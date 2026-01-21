import { ResourceType } from "../types";

/**
 * Formats a resource number.
 * Uses 2 decimal places for small numbers, or integers for large ones.
 */
export const formatResource = (amount: number): string => {
  if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount)) return '0';
  if (amount < 10) return amount.toFixed(2);
  if (amount < 1000) return Math.floor(amount).toString();
  if (amount < 1000000) return (amount / 1000).toFixed(1) + 'k';
  return (amount / 1000000).toFixed(2) + 'M';
};

/**
 * Calculates current time-of-day multiplier.
 * Night time (6 PM to 6 AM) gives a bonus to vampires.
 */
export const getNightMultiplier = (): number => {
  const hour = new Date().getHours();
  // Night is 18:00 (6PM) to 06:00 (6AM)
  const isNight = hour >= 18 || hour < 6;
  return isNight ? 1.25 : 1.0;
};

/**
 * Calculates offline production.
 * @param secondsOffline Time in seconds since last save
 * @param rates Net production per second for each resource
 * @param capSeconds Max offline time to calculate (e.g. 24h = 86400)
 */
export const calculateOfflineProduction = (
  secondsOffline: number, 
  rates: Partial<Record<ResourceType, number>>,
  capSeconds: number = 86400
): Partial<Record<ResourceType, number>> => {
  const effectiveTime = Math.min(secondsOffline, capSeconds);
  const gains: Partial<Record<ResourceType, number>> = {};

  Object.entries(rates).forEach(([key, rate]) => {
    const r = key as ResourceType;
    if (typeof rate === 'number' && !isNaN(rate)) {
       gains[r] = rate * effectiveTime;
    }
  });

  return gains;
};
