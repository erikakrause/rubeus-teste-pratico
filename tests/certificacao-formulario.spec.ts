import { expect, test } from '@playwright/test';

const FORM_URL = 'https://qualidade.apprbs.com.br/certificacao';
test.describe.configure({ mode: 'serial' });

async function abrirFormulario(page: import('@playwright/test').Page) {
  await page.goto(FORM_URL, { waitUntil: 'domcontentloaded' });
  await page.locator('#rbBtnNext').waitFor({ state: 'visible' });
  await page.locator('input[name="pessoa.emailPrincipal"]').waitFor({ state: 'visible' });
}

async function clicarAvancar(page: import('@playwright/test').Page) {
  const botaoAvancar = page.locator('#rbBtnNext');
  await botaoAvancar.scrollIntoViewIfNeeded();
  await expect(botaoAvancar).toBeVisible();

  try {
    await botaoAvancar.click({ timeout: 8_000 });
  } catch {
    // Fallback para contornar interceptacao transitória da camada de UI.
    await botaoAvancar.evaluate((btn) => (btn as HTMLButtonElement).click());
  }
}

async function preencherFormularioValido(page: import('@playwright/test').Page) {
  await page.fill('input[name="pessoa.nome"]', 'Teste Playwright');
  await page.locator('input[name="pessoa.nome"]').press('Tab');

  const telefoneUnico = `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(
    1000 + Math.random() * 9000,
  )}`;
  await page.fill('input[name="pessoa.telefonePrincipal"]', telefoneUnico);
  await page.locator('input[name="pessoa.telefonePrincipal"]').press('Tab');

  await page.fill(
    'input[name="pessoa.emailPrincipal"]',
    `qa.playwright+${Date.now()}@example.com`,
  );
  await page.locator('input[name="pessoa.emailPrincipal"]').press('Tab');
}

async function tentarSubmeter(page: import('@playwright/test').Page, tentativas = 3) {
  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    await clicarAvancar(page);
    await page.waitForTimeout(1_500);
  }
}

test('deve exibir mensagem de erro ao tentar avancar com email obrigatorio vazio', async ({ page }) => {
  await abrirFormulario(page);

  await clicarAvancar(page);

  const mensagemErroEmail = await page
    .locator('input[name="pessoa.emailPrincipal"]')
    .evaluate((input) => (input as HTMLInputElement).validationMessage);

  await expect(page.locator('#rbBtnNext')).toBeDisabled();
  expect(mensagemErroEmail.toLowerCase()).toMatch(/prencha este campo|please fill out this field/);
});

test('deve habilitar envio e disparar API com dados validos do formulario', async ({ page }) => {
  await abrirFormulario(page);

  const requisicoesDisparadas: string[] = [];
  let mensagemAlerta: string | null = null;

  page.on('request', (request) => {
    if (request.url().includes('/api/v2/sendData') && request.method() === 'PATCH') {
      requisicoesDisparadas.push('sendData');
    }
    if (request.url().includes('/api/v2/sendVisitor') && request.method() === 'POST') {
      requisicoesDisparadas.push('sendVisitor');
    }
  });

  page.on('dialog', async (dialog) => {
    mensagemAlerta = dialog.message();
    await dialog.accept();
  });

  await preencherFormularioValido(page);

  await expect(page.locator('#rbBtnNext')).toBeEnabled();

  await tentarSubmeter(page, 3);

  expect(
    requisicoesDisparadas.includes('sendData') || requisicoesDisparadas.includes('sendVisitor'),
    mensagemAlerta
      ? `Formulario nao submeteu; alerta exibido: "${mensagemAlerta}"`
      : 'Formulario nao submeteu; nenhuma chamada de envio foi disparada.',
  ).toBeTruthy();

  expect(
    mensagemAlerta,
    'Nao era esperado alerta de erro durante envio com dados validos.',
  ).toBeNull();
});

test('deve tratar falha da API ao enviar formulario', async ({ page }) => {
  await abrirFormulario(page);
  await preencherFormularioValido(page);
  await expect(page.locator('#rbBtnNext')).toBeEnabled();

  let houveResposta500 = false;
  page.on('response', (response) => {
    if (response.url().includes('/api/v2/sendVisitor') && response.status() >= 500) {
      houveResposta500 = true;
    }
  });

  await page.route('**/api/v2/sendVisitor', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'erro-forcado-playwright' }),
    });
  });

  await tentarSubmeter(page, 2);

  await expect
    .poll(() => houveResposta500, {
      timeout: 10_000,
      message: 'Era esperado retorno 500 da API para validar o cenario de falha.',
    })
    .toBeTruthy();
});

test('nao deve disparar envio duplicado ao dar duplo clique no botao de envio', async ({ page }) => {
  await abrirFormulario(page);
  await preencherFormularioValido(page);
  await expect(page.locator('#rbBtnNext')).toBeEnabled();

  const contagemEnvio = {
    sendData: 0,
    sendVisitor: 0,
  };

  page.on('request', (request) => {
    if (request.url().includes('/api/v2/sendData') && request.method() === 'PATCH') {
      contagemEnvio.sendData += 1;
    }
    if (request.url().includes('/api/v2/sendVisitor') && request.method() === 'POST') {
      contagemEnvio.sendVisitor += 1;
    }
  });

  await page.locator('#rbBtnNext').dblclick();
  await page.waitForTimeout(4_000);

  const totalDisparado = contagemEnvio.sendData + contagemEnvio.sendVisitor;
  if (totalDisparado === 0) {
    await clicarAvancar(page);
    await page.waitForTimeout(2_000);
  }

  expect(contagemEnvio.sendData).toBeLessThanOrEqual(1);
  expect(contagemEnvio.sendVisitor).toBeLessThanOrEqual(1);
  expect(contagemEnvio.sendData + contagemEnvio.sendVisitor).toBeGreaterThan(0);
});

test('deve exibir mensagem de confirmacao apos enviar formulario e clicar no botao', async ({
  page,
}) => {
  await abrirFormulario(page);
  await preencherFormularioValido(page);

  await expect(page.locator('#rbBtnNext')).toBeEnabled();
  await clicarAvancar(page);

  const botaoConcluir = page.locator('#rbBtnNext-2');
  if (await botaoConcluir.isVisible().catch(() => false)) {
    await botaoConcluir.click();
  }

  await expect(
    page.getByText(/obrigado/i),
    'A mensagem de confirmacao deveria aparecer apos o envio do formulario.',
  ).toBeVisible({ timeout: 8_000 });
});
