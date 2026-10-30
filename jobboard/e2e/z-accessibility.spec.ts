import { test, expect } from '@playwright/test';
import { expectNoDuplicateIds } from './helpers';

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

test('login errors are tied to their fields', async ({ page }) => {
  await page.goto('/applicants');
  await page.getByRole('button', { name: /Log In/ }).click();

  const email = page.getByLabel('Email', { exact: true });
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toHaveAccessibleDescription(/email/i);
});

test('signup errors are tied to their fields', async ({ page }) => {
  await page.goto('/applicants/signup');
  await expectNoDuplicateIds(page);
  await page.getByRole('button', { name: /Next/ }).click();

  const email = page.getByLabel(/^Email Address/);
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toHaveAccessibleDescription(/email/i);
});

test('modals are named, take focus, and close with Escape', async ({ page }) => {
  await page.goto('/');
  await page.locator('a[href^="/jobs/"]').first().click();

  const opener = page.getByRole('button', { name: /Apply Now/ });
  await opener.click();

  const dialog = page.getByRole('dialog', { name: /Apply for/ });
  await expect(dialog).toBeVisible();
  await expect(dialog).toBeFocused();
  await expectNoDuplicateIds(page);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test('apply form errors are tied to their fields', async ({ page }) => {
  await page.goto('/');
  await page.locator('a[href^="/jobs/"]').first().click();
  await page.getByRole('button', { name: /Apply Now/ }).click();

  const dialog = page.getByRole('dialog', { name: /Apply for/ });
  await dialog.getByRole('button', { name: /Submit Application/ }).click();

  for (const label of [/^Full Name/, /^Email/, /^Cover Letter/]) {
    const field = dialog.getByLabel(label);
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(field).toHaveAccessibleDescription(/\S/);
  }
  await expectNoDuplicateIds(page);
});