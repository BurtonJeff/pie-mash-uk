import { Linking, Platform } from 'react-native';
import { Shop } from '../types/database';

export interface DayHours {
  open: string;   // "HH:MM"
  close: string;  // "HH:MM"
  closed: boolean;
}

export type OpeningHours = Record<
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
  DayHours
>;

const DAY_NAMES: (keyof OpeningHours)[] = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
];

export function isOpenNow(hours: OpeningHours): boolean {
  // If no hours data is configured for this shop, assume it is open
  if (!hours || Object.keys(hours).length === 0) return true;
  const now = new Date();
  const day = DAY_NAMES[now.getDay()];
  const dayHours = hours[day];
  if (!dayHours || dayHours.closed) return false;

  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return nowMins >= toMinutes(dayHours.open) && nowMins < toMinutes(dayHours.close);
}

export function formatHours(day: DayHours): string {
  if (day.closed) return 'Closed';
  return `${day.open} – ${day.close}`;
}

/** Haversine distance in km */
export function distanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number): string {
  const miles = km * 0.621371;
  return miles < 0.1 ? `${Math.round(km * 1000)}m` : `${miles.toFixed(1)} mi`;
}

export function formatAddress(shop: Shop): string {
  return [shop.address_line1, shop.address_line2, shop.city, shop.postcode]
    .filter(Boolean)
    .join(', ');
}


export function openDirections(shop: Shop) {
  const label = encodeURIComponent(shop.name);
  const url =
    Platform.OS === 'ios'
      ? `maps://maps.apple.com/?daddr=${shop.latitude},${shop.longitude}&q=${label}`
      : `geo:${shop.latitude},${shop.longitude}?q=${label}`;
  Linking.openURL(url);
}

export function shopPhotoUrl(storagePath: string): string {
  const base = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  return `${base}/storage/v1/object/public/shop-photos/${storagePath}`;
}
