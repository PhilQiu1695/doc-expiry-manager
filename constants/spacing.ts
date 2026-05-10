/**
 * 8px grid — use multiples of `u1` (8px) for padding, margin, gap, and layout spacing.
 * `half` (4px) is only for tight inline tweaks (e.g. icon optical alignment).
 */
export const space = {
  half: 4,
  u1: 8,
  u2: 16,
  u3: 24,
  u4: 32,
  u5: 40,
  u6: 48,
} as const;

/** n × 8px (e.g. grid(10) → 80px swipe column). */
export function grid(n: number): number {
  return n * 8;
}
