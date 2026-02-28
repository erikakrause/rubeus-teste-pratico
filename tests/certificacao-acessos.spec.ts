import { expect, test } from '@playwright/test';

test('deve falhar ao validar o CTA Saiba mais sem abertura de link', async ({ page }) => {
  await page.goto('https://qualidade.apprbs.com.br/certificacao', {
    waitUntil: 'domcontentloaded',
  });

  const saibaMais = page.locator('a', { hasText: /saiba/i }).first();
  await expect(saibaMais).toBeVisible();

  const popupPromise = page.waitForEvent('popup', { timeout: 8_000 }).catch(() => null);
  await saibaMais.click();
  const popup = await popupPromise;

  expect(
    popup,
    'Ao clicar em "Saiba mais", deveria abrir uma nova aba com o destino do CTA.',
  ).not.toBeNull();

  await popup!.waitForLoadState('domcontentloaded');
  expect(popup!.url()).toMatch(/^https?:\/\//i);
  await popup!.close();
});

test('deve acessar o CTA Quero me certificar com sucesso', async ({ page }) => {
  await page.goto('https://qualidade.apprbs.com.br/certificacao', {
    waitUntil: 'domcontentloaded',
  });

  const queroMeCertificar = page
    .locator('a:visible', { hasText: 'Quero me certificar' })
    .first();

  await expect(queroMeCertificar).toBeVisible();

  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    queroMeCertificar.click(),
  ]);

  await popup.waitForLoadState('domcontentloaded');
  expect(popup.url()).toMatch(/^https?:\/\//i);
  await popup.close();
});
