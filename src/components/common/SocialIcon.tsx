import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Renders a social link icon.
 * Prefix "mci:" → MaterialCommunityIcons (e.g. "mci:wikipedia")
 * No prefix   → Ionicons (e.g. "logo-facebook", "globe-outline")
 */
export default function SocialIcon({ name, size, color }: { name: string; size: number; color: string }) {
  if (name.startsWith('mci:')) {
    return <MaterialCommunityIcons name={name.slice(4) as any} size={size} color={color} />;
  }
  return <Ionicons name={name as any} size={size} color={color} />;
}
