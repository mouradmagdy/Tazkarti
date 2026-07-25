import { expect, test } from '@playwright/test';
import { testEvent, testSeatMap } from './fixtures/event-data';

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

  await page.route(`**/api/events/getEventById/${testEvent.id}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(testEvent),
    });
  });

  await page.route(`**/api/events/${testEvent.id}/seat-map`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(testSeatMap),
    });
  });
});

test('opens event details and renders the assigned-seat map', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'View Details' }).click();

  await expect(page).toHaveURL(new RegExp(`/events/${testEvent.id}$`));
  await expect(page.getByRole('heading', { name: testEvent.name })).toBeVisible();
  await expect(page.getByText(`${testEvent.availableSeats} available`)).toBeVisible();
  await expect(page.getByText(testEvent.description)).toBeVisible();
  await expect(
    page.getByRole('img', { name: `${testEvent.name} seat map` }),
  ).toBeVisible();

  await expect(page.getByText('Available', { exact: true })).toBeVisible();
  await expect(page.getByText('Selected', { exact: true })).toBeVisible();
  await expect(page.getByText('Your reservation', { exact: true })).toBeVisible();
  await expect(page.getByText('Held by others', { exact: true })).toBeVisible();
  await expect(page.getByText('Sold', { exact: true })).toBeVisible();

  await expect(page.getByRole('button', { name: 'A2', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'A3', exact: true })).toBeDisabled();

  await page.getByRole('button', { name: 'A1', exact: true }).click();

  const selectedSeatsPanel = page.locator('aside');
  await expect(selectedSeatsPanel.getByText('Floor A A1')).toBeVisible();
  await expect(selectedSeatsPanel.getByText('$75.00').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reserve Seats' })).toBeEnabled();
});
