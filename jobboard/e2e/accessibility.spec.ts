import { test, expect } from '@playwright/test';

test('login pages label their fields', async ({ page }) => {
  for (const path of ['/applicants', '/employers']) {
    await page.goto(path);
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  }
});

test('signup pages label their fields', async ({ page }) => {
  await page.goto('/applicants/signup');
  for (const name of [/^Email Address/, /^Password\b/, /^Confirm Password/, /^First Name/, /^Last Name/, /^Mobile Number/]) {
    await expect(page.getByLabel(name)).toBeVisible();
  }

  await page.goto('/employers/signup');
  await expect(page.getByLabel(/^Company Name/)).toBeVisible();
});

test('the home page search controls have names', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: /search jobs/i })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Filter by job type' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Filter by category' })).toBeVisible();
});