import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe, verifyWebhookSignature } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = verifyWebhookSignature(body, signature);
  } catch (err: any) {
    console.error("[STRIPE_WEBHOOK_ERROR]", err.message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  console.log(`[STRIPE_WEBHOOK] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`[STRIPE_WEBHOOK] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[STRIPE_WEBHOOK_HANDLER_ERROR]", error);
    return NextResponse.json(
      { error: `Webhook handler failed: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!customerId || !subscriptionId) {
    console.error("[STRIPE_WEBHOOK] Missing customer or subscription ID");
    return;
  }

  // Get the subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Find user by Stripe customer ID
  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (existingSubscription) {
    // Update existing subscription
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
        status: subscription.status,
        plan: determinePlanFromPriceId(subscription.items.data[0].price.id),
      },
    });

    console.log(
      `[STRIPE_WEBHOOK] Updated subscription for customer ${customerId}`
    );
  }
}

/**
 * Handle subscription update
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (existingSubscription) {
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
        status: subscription.status,
        plan: determinePlanFromPriceId(subscription.items.data[0].price.id),
      },
    });

    console.log(`[STRIPE_WEBHOOK] Updated subscription ${subscription.id}`);
  }
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (existingSubscription) {
    // Downgrade to free plan
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeCurrentPeriodEnd: null,
        status: "canceled",
        plan: "free",
      },
    });

    console.log(
      `[STRIPE_WEBHOOK] Canceled subscription ${subscription.id}, downgraded to free`
    );
  }
}

/**
 * Handle successful payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = subscription.customer as string;

  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (existingSubscription) {
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        status: "active",
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
      },
    });

    console.log(
      `[STRIPE_WEBHOOK] Payment succeeded for subscription ${subscriptionId}`
    );
  }
}

/**
 * Handle failed payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = subscription.customer as string;

  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (existingSubscription) {
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        status: "past_due",
      },
    });

    console.log(
      `[STRIPE_WEBHOOK] Payment failed for subscription ${subscriptionId}`
    );
  }
}

/**
 * Determine plan tier from Stripe price ID
 */
function determinePlanFromPriceId(priceId: string): string {
  // Map price IDs to plan names
  const priceToPlan: Record<string, string> = {
    [process.env.STRIPE_PRICE_ID_STARTER || ""]: "starter",
    [process.env.STRIPE_PRICE_ID_PRO || ""]: "pro",
    [process.env.STRIPE_PRICE_ID_BUSINESS || ""]: "business",
  };

  return priceToPlan[priceId] || "free";
}
