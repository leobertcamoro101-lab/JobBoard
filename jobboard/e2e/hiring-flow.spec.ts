import { test, expect, type Page } from '@playwright/test';

// Unique per run, so reruns never collide with earlier accounts
const runId = Date.now().toString(36);
const PASSWORD = 'E2eTest!Pass123';

const employer = {
  email: `e2e.employer.${runId}@example.test`,
  company: `E2E Company ${runId}`,
};
const applicant = {
  email: `e2e.applicant.${runId}@example.test`,
};
const jobTitle = `E2E Engineer ${runId}`;

let jobId = '';

// Smallest file that Laravel's type check accepts as a PDF
const PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n',
);

async function login(page: Page, path: '/employers' | '/applicants', email: string, landing: RegExp) {
  await page.goto(path);
  await page.getByPlaceholder('email@example.com').fill(email);
  await page.getByPlaceholder('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: /Log In/ }).click();
  await expect(page).toHaveURL(landing);
}

async function fillAccountFields(page: Page, email: string, first: string, last: string) {
  await page.getByPlaceholder('Email Address').fill(email);
  await page.getByPlaceholder('Password', { exact: true }).fill(PASSWORD);
  await page.getByPlaceholder('Confirm Password').fill(PASSWORD);
  await page.getByPlaceholder('First Name').fill(first);
  await page.getByPlaceholder('Last Name').fill(last);
  await page.getByPlaceholder('Mobile Number').fill('09170000000');
}

test.describe.configure({ mode: 'serial' });

test.describe('hiring flow', () => {
  test('is running against the e2e database, not real data', async ({ request }) => {
    const res = await request.get('/api/jobs');
    expect(res.ok()).toBeTruthy();

    const jobs: { title: string }[] = await res.json();
    const strangers = jobs.filter((j) => !j.title.startsWith('E2E '));

    expect(
      strangers,
      'Found jobs this suite did not create. The API is probably pointing at a real database, so the run is aborted.',
    ).toEqual([]);
  });

  test('logged-out visitors are sent to the employer login when posting a job', async ({ page }) => {
    await page.goto('/post');
    await expect(page).toHaveURL(/\/employers$/);
  });

  test('employer signs up and posts a job', async ({ page }) => {
    await page.goto('/employers/signup');
    await fillAccountFields(page, employer.email, 'Emma', 'Employer');
    await page.getByPlaceholder('Company Name').fill(employer.company);
    await page.getByRole('button', { name: /Next/ }).click();

    // step 2: logo is optional, and there is no emailed code in this environment
    await page.getByRole('button', { name: /Create Account/ }).click();

    await expect(page).toHaveURL(/\/employers\/dashboard/);
    await expect(page.getByRole('heading', { name: employer.company })).toBeVisible();

    await page.goto('/post');
    await page.getByPlaceholder('e.g. Senior React Developer').fill(jobTitle);
    await page.getByPlaceholder('e.g. Cebu City or Remote').fill('Cebu City');
    await page.getByPlaceholder('Describe the role').fill('E2E description. '.repeat(10));
    await page.getByRole('button', { name: /Post Job/ }).click();

    await expect(page).toHaveURL(/\/jobs\/\d+/);
    jobId = page.url().match(/\/jobs\/(\d+)/)![1];
    await expect(page.getByRole('heading', { name: jobTitle })).toBeVisible();
  });

  test('applicant signs up with a resume and applies', async ({ page }) => {
    await page.goto('/applicants/signup');
    await fillAccountFields(page, applicant.email, 'Alex', 'Applicant');
    await page.getByRole('button', { name: /Next/ }).click();

    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: PDF,
    });
    await page.getByRole('button', { name: /Upload Resume/ }).click();
    await expect(page).toHaveURL('/');

    await page.goto(`/jobs/${jobId}`);
    await page.getByRole('button', { name: /Apply Now/ }).click();
    await page.getByPlaceholder(/great fit/).fill('E2E cover letter. '.repeat(10));
    await page.getByRole('button', { name: /Submit Application/ }).click();

    await expect(page.getByText('Application Submitted!')).toBeVisible();
  });

  test('employer reviews the applicant and accepts them', async ({ page }) => {
    await login(page, '/employers', employer.email, /\/employers\/dashboard/);

    await page.goto(`/employers/jobs/${jobId}/applicants`);
    await expect(page.getByText(applicant.email)).toBeVisible();

    const status = page.getByRole('combobox', { name: /Change status for/ });
    await expect(status).toHaveValue('pending');
    await status.selectOption('accepted');
    await expect(status).toHaveValue('accepted');
  });

  test('applicant sees the decision on their dashboard', async ({ page }) => {
    await login(page, '/applicants', applicant.email, /\/$/);

    await page.goto('/applicants/dashboard');
    await expect(page.getByText(jobTitle)).toBeVisible();
    await expect(page.getByText('accepted', { exact: true })).toBeVisible();
  });

  test('an applicant cannot open the employer dashboard', async ({ page }) => {
    await login(page, '/applicants', applicant.email, /\/$/);

    await page.goto('/employers/dashboard');
    await expect(page).toHaveURL(/\/applicants\/dashboard/);
  });
});