/**
 * Webhook Delivery System
 * Handle webhook delivery with retry logic and signature verification
 */

import crypto from "crypto";
import { prisma } from "../db";

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: number;
}

/**
 * Generate HMAC signature for webhook payload
 */
export function generateWebhookSignature(
  payload: string,
  secret: string
): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Deliver webhook to URL
 */
async function deliverWebhook(
  url: string,
  payload: WebhookPayload,
  secret: string
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    const payloadString = JSON.stringify(payload);
    const signature = generateWebhookSignature(payloadString, secret);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Timestamp": payload.timestamp.toString(),
        "User-Agent": "AI-MicroSaaS-Webhooks/1.0",
      },
      body: payloadString,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const responseBody = await response.text();

    return {
      success: response.ok,
      statusCode: response.status,
    };
  } catch (error) {
    console.error("Webhook delivery error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send webhook with retry logic
 */
export async function sendWebhook(
  webhookId: string,
  event: string,
  data: any
): Promise<void> {
  try {
    // Get webhook configuration
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook || !webhook.isActive) {
      return;
    }

    // Check if webhook is subscribed to this event
    if (!webhook.events.includes(event) && !webhook.events.includes("*")) {
      return;
    }

    const payload: WebhookPayload = {
      event,
      data,
      timestamp: Date.now(),
    };

    const maxAttempts = 3;
    const backoffMs = [0, 5000, 30000]; // Immediate, 5s, 30s

    let lastError: string | undefined;
    let lastStatusCode: number | undefined;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Wait for backoff period
      if (backoffMs[attempt] > 0) {
        await new Promise((resolve) => setTimeout(resolve, backoffMs[attempt]));
      }

      // Attempt delivery
      const result = await deliverWebhook(webhook.url, payload, webhook.secret);

      // Log delivery attempt
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload: payload as any,
          statusCode: result.statusCode,
          responseBody: result.error,
          attempts: attempt + 1,
          success: result.success,
        },
      });

      if (result.success) {
        // Update webhook last status
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            lastStatus: result.statusCode,
            lastError: null,
          },
        });
        return; // Success!
      }

      lastError = result.error;
      lastStatusCode = result.statusCode;
    }

    // All attempts failed
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: {
        lastStatus: lastStatusCode,
        lastError: lastError || "Failed after max retries",
      },
    });
  } catch (error) {
    console.error("Error sending webhook:", error);
  }
}

/**
 * Trigger webhooks for an event
 */
export async function triggerWebhooks(
  userId: string,
  event: string,
  data: any
): Promise<void> {
  try {
    // Get all active webhooks for this user subscribed to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { events: { has: event } },
          { events: { has: "*" } }, // Wildcard subscription
        ],
      },
    });

    // Send to all webhooks (non-blocking)
    const deliveryPromises = webhooks.map((webhook) =>
      sendWebhook(webhook.id, event, data)
    );

    // Don't await - let webhooks deliver in background
    Promise.allSettled(deliveryPromises).catch((error) => {
      console.error("Error in webhook delivery batch:", error);
    });
  } catch (error) {
    console.error("Error triggering webhooks:", error);
  }
}

/**
 * Get webhook delivery history
 */
export async function getWebhookDeliveries(
  webhookId: string,
  limit: number = 50
) {
  return await prisma.webhookDelivery.findMany({
    where: { webhookId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Retry failed webhook delivery
 */
export async function retryWebhookDelivery(deliveryId: string): Promise<void> {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
  });

  if (!delivery) {
    throw new Error("Delivery not found");
  }

  await sendWebhook(
    delivery.webhookId,
    delivery.event,
    delivery.payload as any
  );
}

/**
 * Available webhook events
 */
export const WEBHOOK_EVENTS = {
  // Content events
  CONTENT_CREATED: "content.created",
  CONTENT_UPDATED: "content.updated",
  CONTENT_DELETED: "content.deleted",

  // AI generation events
  AI_GENERATION_STARTED: "ai.generation.started",
  AI_GENERATION_COMPLETED: "ai.generation.completed",
  AI_GENERATION_FAILED: "ai.generation.failed",

  // Subscription events
  SUBSCRIPTION_CREATED: "subscription.created",
  SUBSCRIPTION_UPDATED: "subscription.updated",
  SUBSCRIPTION_CANCELED: "subscription.canceled",

  // Usage events
  USAGE_QUOTA_WARNING: "usage.quota.warning",
  USAGE_QUOTA_EXCEEDED: "usage.quota.exceeded",

  // Project events
  PROJECT_CREATED: "project.created",
  PROJECT_UPDATED: "project.updated",
  PROJECT_DELETED: "project.deleted",

  // API key events
  API_KEY_CREATED: "api.key.created",
  API_KEY_REVOKED: "api.key.revoked",
} as const;
