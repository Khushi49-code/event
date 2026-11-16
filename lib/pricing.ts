// FILE PATH: lib/pricing.ts
// Shared by client (display) and server (real charge calculation).
export const PRICE_PER_CREDIT = 2; // USD per event credit (tamari kimat ahi lakho, decimal pan chalse jem ke 1.99)
export const CURRENCY = 'USD';
export const CURRENCY_SYMBOL = '$';
export const MIN_QTY = 1;
export const MAX_QTY = 999;
export const PLAN_DURATION_DAYS = 365;

// Frontend ma price batavva mate (jem ke formatPrice(4) => "$4.00")
export const formatPrice = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY }).format(amount);