import { expect, type Page } from '@playwright/test';

export async function expectNoDuplicateIds(page: Page) {
  const dupes = await page.evaluate(() => {
    const seen = new Map<string, number>();
    document.querySelectorAll('[id]').forEach((el) => seen.set(el.id, (seen.get(el.id) ?? 0) + 1));
    return Array.from(seen.entries()).filter(([, n]) => n > 1).map(([id]) => id);
  });
  expect(dupes, `Duplicate ids: ${dupes.join(', ')}`).toEqual([]);
}