import { expect, test } from '@playwright/test';
import { testEvent } from './fixtures/event-data';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Not authenticated' }),
    });
  });

  await page.route('**/api/events/getAllEvents**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        events: [testEvent],
        totalEvents: 1,
      }),
    });
  });
});

test('shows upcoming events on the home page', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Events' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: testEvent.name }),
  ).toBeVisible();
  await expect(page.getByText(testEvent.venue, { exact: true })).toBeVisible();
  await expect(page.getByText(testEvent.category, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Select Seats' })).toBeVisible();
  await expect(page.getByText('Sign in')).toBeVisible();
});
