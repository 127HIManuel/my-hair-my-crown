/**
 * The developer's platform surcharge.
 *
 * This is intentionally driven entirely by environment variables rather
 * than the database, so the salon owner (who has admin access to the
 * dashboard) cannot see or change it. Only whoever controls the Vercel /
 * hosting environment variables can.
 *
 * How the money moves:
 *   1. The customer pays `total_charged_cents` (service price + this fee).
 *   2. Stripe Connect is used with a "destination charge": the Checkout
 *      Session is created on YOUR (the platform's) Stripe account, with
 *      `transfer_data.destination` set to the salon's connected account
 *      and `application_fee_amount` set to this fee.
 *   3. Stripe automatically settles the service price into the salon
 *      owner's connected account, and keeps the application fee in YOUR
 *      platform account's balance. No manual transfer is needed.
 */

export type FeeBreakdown = {
  servicePriceCents: number;
  devFeeCents: number;
  totalChargedCents: number;
  feeLabel: string;
};

export function calculateDevFee(servicePriceCents: number): FeeBreakdown {
  const fixed = Number(process.env.DEV_FEE_FIXED_CENTS ?? 0);
  const label = process.env.DEV_FEE_LABEL || "Booking & processing fee";

  const totalChargedCents = 1000; // always £10
  const devFeeCents = Math.max(0, fixed);
  const depositPriceCents = totalChargedCents - devFeeCents; // what goes to the salon at booking

  return {
    servicePriceCents: depositPriceCents,
    devFeeCents,
    totalChargedCents,
    feeLabel: label,
  };
}
