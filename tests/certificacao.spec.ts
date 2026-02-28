import { expect, test } from '@playwright/test';

test('deve acessar a pagina de certificacao com sucesso', async ({ page }) => {
  const response = await page.goto('https://qualidade.apprbs.com.br/certificacao', {
    waitUntil: 'domcontentloaded',
  });

  expect(response, 'A navegacao deve retornar uma resposta HTTP').not.toBeNull();
  expect(response?.ok(), 'A resposta HTTP deve ser de sucesso (2xx)').toBeTruthy();
  await expect(page).toHaveURL(/\/certificacao\/?$/);
});
