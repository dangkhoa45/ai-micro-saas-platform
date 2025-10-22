import Stripe from "stripe";

/**
 * Stripe client configuration
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
  typescript: true,
});

/**
 * Plan configurations
 */
export const STRIPE_PLANS = {
  FREE: {
    name: "Free",
    priceId: null,
    price: 0,
    features: ["1,000 AI tokens/month", "Basic analytics", "Community support"],
    limits: {
      tokensPerMonth: 1000,
      projectsMax: 1,
    },
  },
  STARTER: {
    name: "Starter",
    priceId: process.env.STRIPE_PRICE_ID_STARTER,
    price: 9.99,
    features: [
      "50,000 AI tokens/month",
      "Advanced analytics",
      "Email support",
      "Up to 5 projects",
    ],
    limits: {
      tokensPerMonth: 50000,
      projectsMax: 5,
    },
  },
  PRO: {
    name: "Pro",
    priceId: process.env.STRIPE_PRICE_ID_PRO,
    price: 29.99,
    features: [
      "200,000 AI tokens/month",
      "Premium analytics",
      "Priority support",
      "Unlimited projects",
      "API access",
    ],
    limits: {
      tokensPerMonth: 200000,
      projectsMax: -1, // Unlimited
    },
  },
  BUSINESS: {
    name: "Business",
    priceId: process.env.STRIPE_PRICE_ID_BUSINESS,
    price: 99.99,
    features: [
      "1,000,000 AI tokens/month",
      "Custom analytics",
      "Dedicated support",
      "Unlimited projects",
      "Full API access",
      "Custom integrations",
    ],
    limits: {
      tokensPerMonth: 1000000,
      projectsMax: -1, // Unlimited
    },
  },
} as const;

/**
 * Create a Stripe checkout session for subscription
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

/**
 * Create a Stripe customer
 */
export async function createStripeCustomer(email: string, userId: string) {
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });

  return customer;
}

/**
 * Get or create a Stripe customer portal session
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return subscription;
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}

/**
 * Update subscription
 */
export async function updateSubscription(
  subscriptionId: string,
  priceId: string
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const updatedSubscription = await stripe.subscriptions.update(
    subscriptionId,
    {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
    }
  );

  return updatedSubscription;
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err}`);
  }
}
