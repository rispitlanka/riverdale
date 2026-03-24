import Stripe from "stripe";

export function getStripe(): Stripe {
  const raw = process.env.STRIPE_SECRET_KEY;
  const key = typeof raw === "string" ? raw.split(" #")[0].trim() : undefined;
  if (!key || key.trim() === "") {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key);
}

export function getAppOrigin(): string {
  const normalize = (value?: string) =>
    typeof value === "string" ? value.split(" #")[0].trim() : "";
  const baseUrl =
    normalize(process.env.NEXT_PUBLIC_APP_URL) ||
    normalize(process.env.VERCEL_URL) ||
    "http://localhost:3000";
  return baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
}
