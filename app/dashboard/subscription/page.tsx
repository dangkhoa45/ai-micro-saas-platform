"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    price: 0,
    priceId: null,
    interval: "forever",
    features: [
      "1,000 AI tokens/month",
      "Basic analytics",
      "Community support",
      "1 project",
    ],
    popular: false,
  },
  {
    name: "Starter",
    price: 9.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER,
    interval: "month",
    features: [
      "50,000 AI tokens/month",
      "Advanced analytics",
      "Email support",
      "Up to 5 projects",
    ],
    popular: true,
  },
  {
    name: "Pro",
    price: 29.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO,
    interval: "month",
    features: [
      "200,000 AI tokens/month",
      "Premium analytics",
      "Priority support",
      "Unlimited projects",
      "API access",
    ],
    popular: false,
  },
  {
    name: "Business",
    price: 99.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS,
    interval: "month",
    features: [
      "1,000,000 AI tokens/month",
      "Custom analytics",
      "Dedicated support",
      "Unlimited projects",
      "Full API access",
      "Custom integrations",
    ],
    popular: false,
  },
];

function SubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [success, setSuccess] = useState(false);
  const [canceled, setCanceled] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    // Check for success/canceled query params
    if (searchParams.get("success") === "true") {
      setSuccess(true);
      // Clear params after showing message
      setTimeout(() => {
        window.history.replaceState({}, "", "/dashboard/subscription");
      }, 3000);
    }
    if (searchParams.get("canceled") === "true") {
      setCanceled(true);
      setTimeout(() => {
        window.history.replaceState({}, "", "/dashboard/subscription");
      }, 3000);
    }

    // Fetch current subscription
    fetchCurrentPlan();
  }, [searchParams]);

  const fetchCurrentPlan = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        // You would need to extend this API to include subscription info
        // For now, we'll leave this as a placeholder
      }
    } catch (error) {
      console.error("Failed to fetch current plan:", error);
    }
  };

  const handleSubscribe = async (priceId: string | null, planName: string) => {
    if (!priceId) {
      return; // Free plan, no action needed
    }

    setLoading(planName);

    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to create checkout session");
        setLoading(null);
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Subscription error:", error);
      alert("An unexpected error occurred. Please try again.");
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading("portal");

    try {
      const response = await fetch("/api/subscription/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to open customer portal");
        setLoading(null);
        return;
      }

      // Redirect to Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
      alert("An unexpected error occurred. Please try again.");
      setLoading(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Subscription Plans</h1>
          <Link
            href="/dashboard"
            className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {success && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md">
            🎉 Subscription activated successfully! Welcome aboard!
          </div>
        )}

        {canceled && (
          <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-md">
            Checkout was canceled. No charges were made.
          </div>
        )}

        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Choose the Perfect Plan for You
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Unlock the full power of AI with our flexible pricing plans
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-6 bg-white dark:bg-gray-800 rounded-lg shadow ${
                plan.popular ? "ring-2 ring-primary" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  {plan.price > 0 && (
                    <span className="text-gray-600 dark:text-gray-400">
                      /{plan.interval}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <span className="mr-2 text-green-500">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.priceId || null, plan.name)}
                disabled={loading === plan.name}
                className={`w-full px-4 py-2 rounded-md font-medium ${
                  plan.popular
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "border hover:bg-gray-50 dark:hover:bg-gray-700"
                } disabled:opacity-50`}
              >
                {loading === plan.name
                  ? "Processing..."
                  : plan.price === 0
                  ? "Current Plan"
                  : "Subscribe"}
              </button>
            </div>
          ))}
        </div>

        {/* Manage Subscription */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
          <h3 className="text-lg font-semibold mb-2">
            Already have a subscription?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Manage your billing, update payment methods, or cancel your
            subscription
          </p>
          <button
            onClick={handleManageSubscription}
            disabled={loading === "portal"}
            className="px-6 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            {loading === "portal" ? "Opening portal..." : "Manage Subscription"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <SubscriptionContent />
    </Suspense>
  );
}
