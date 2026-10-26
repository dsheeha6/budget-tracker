// Turns receipt line items into one amount per category.
//
// Items rarely add up to the total on their own (tax, fees, rounding), so the
// difference is spread across categories in proportion to what each one
// spent. Amounts are worked out in cents so they always add up to the total.

export type SplitItem = { name: string; price: number; categoryId: string };
export type CategoryShare = { categoryId: string; amount: number; itemNames: string[] };

export function splitByCategory(items: SplitItem[], total: number): CategoryShare[] {
  const groups = new Map<string, { cents: number; itemNames: string[] }>();
  for (const item of items) {
    const group = groups.get(item.categoryId) ?? { cents: 0, itemNames: [] };
    group.cents += Math.round(item.price * 100);
    group.itemNames.push(item.name);
    groups.set(item.categoryId, group);
  }

  const shares = [...groups.entries()].map(([categoryId, g]) => ({ categoryId, ...g }));
  const itemsCents = shares.reduce((sum, s) => sum + s.cents, 0);
  const extraCents = Math.round(total * 100) - itemsCents;
  const weightTotal = shares.reduce((sum, s) => sum + Math.max(s.cents, 0), 0);

  if (extraCents !== 0 && weightTotal > 0) {
    // Round each share down, then hand the leftover cents to the shares that
    // lost the most to rounding, so every category is within a cent of exact.
    const exact = shares.map((s) => (extraCents * Math.max(s.cents, 0)) / weightTotal);
    const floors = exact.map(Math.floor);
    let leftover = extraCents - floors.reduce((a, b) => a + b, 0);
    const byRemainder = exact.map((e, i) => ({ i, rest: e - floors[i] })).sort((a, b) => b.rest - a.rest);
    for (const { i } of byRemainder) {
      if (leftover-- <= 0) break;
      floors[i] += 1;
    }
    shares.forEach((s, i) => (s.cents += floors[i]));
  }

  return shares
    .filter((s) => s.cents !== 0)
    .sort((a, b) => b.cents - a.cents)
    .map((s) => ({ categoryId: s.categoryId, amount: s.cents / 100, itemNames: s.itemNames }));
}

/** Short note listing what was bought, e.g. "Milk, Eggs, Bread +3 more". */
export function itemsNote(names: string[], max = 3): string {
  if (names.length <= max) return names.join(", ");
  return `${names.slice(0, max).join(", ")} +${names.length - max} more`;
}
