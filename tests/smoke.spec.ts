import { expect, test } from '@playwright/test';

test('home deve carregar com titulo visivel', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
});

test('deve responder sem erro no endpoint inicial', async ({ request, baseURL }) => {
  const response = await request.get(baseURL || '/');
  expect(response.ok()).toBeTruthy();
});
