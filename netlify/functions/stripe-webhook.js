const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const sig = event.headers["stripe-signature"] || event.headers["Stripe-Signature"];
    if (!sig) return { statusCode: 400, body: "Missing stripe-signature" };

    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;

    const stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    const admin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1) Po checkout: przypnij sub do usera
    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object;

      const userId = session?.metadata?.user_id;
      const plan = session?.metadata?.plan;
      const customerId = session?.customer;
      const subscriptionId = session?.subscription;

      if (userId) {
        await admin.from("profiles").update({
          stripe_customer_id: customerId || null,
          stripe_subscription_id: subscriptionId || null,
          plan: plan || "free",
          plan_status: "active",
        }).eq("user_id", userId);
      }
    }

    // 2) Zmiany subskrypcji (update/cancel)
    if (
      stripeEvent.type === "customer.subscription.updated" ||
      stripeEvent.type === "customer.subscription.deleted"
    ) {
      const sub = stripeEvent.data.object;
      const userId = sub?.metadata?.user_id;

      const status = stripeEvent.type === "customer.subscription.deleted"
        ? "canceled"
        : (sub.status || "active");

      if (userId) {
        await admin.from("profiles").update({
          stripe_subscription_id: sub.id,
          plan_status: status,
        }).eq("user_id", userId);
      }
    }

    return { statusCode: 200, body: "ok" };
  } catch (e) {
    console.error(e);
    return { statusCode: 400, body: `Webhook error: ${e.message}` };
  }
};
