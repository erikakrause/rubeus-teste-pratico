# Teste Prático de Qualidade - Página de Certificação

Este teste consiste em uma simulação na qual foi avaliada a qualidade da página de exemplo:

1. Certificação: https://qualidade.apprbs.com.br/certificacao

## Repositório GitHub

Link para análise dos testes automatizados:

- https://github.com/erikakrause/rubeus-teste-pratico

## Objetivo

Validar comportamento funcional da página de Certificação, com foco em:

- Acesso à página
- Acesso aos CTAs principais
- Fluxo de formulário com dados válidos e inválidos
- Tratamento de falhas e comportamento de envio

## Stack de automação

- Node.js
- Playwright (`@playwright/test`)
- Execução configurada para Chromium

## Cenários automatizados

### 1. Acesso à página

Arquivo: `tests/certificacao.spec.ts`

- Valida abertura da URL de certificação
- Valida resposta HTTP com sucesso

### 2. Acessos de CTA

Arquivo: `tests/certificacao-acessos.spec.ts`

- CTA `Saiba mais`:
  - Cenário mantido para falhar quando não abre destino (bug funcional esperado)
- CTA `Quero me certificar`:
  - Valida abertura de nova aba com URL válida

### 3. Formulário

Arquivo: `tests/certificacao-formulario.spec.ts`

- Validação de campo obrigatório vazio (erro esperado)
- Envio com dados válidos e disparo de requisição de envio
- Simulação de falha de API
- Validação de não duplicidade em duplo clique no envio
- Cenário de mensagem de confirmação (atualmente com comportamento inconsistente)

### 4. Smoke

Arquivo: `tests/smoke.spec.ts`

- Sanidade da home e endpoint inicial

## Evidências de qualidade encontradas

- O CTA `Saiba mais` não executa navegação/abertura de link em cenários testados
- A mensagem de confirmação (`Obrigado!`) aparece no DOM, mas em alguns fluxos permanece oculta
- O envio do formulário apresenta comportamento intermitente dependendo do contexto de execução

## Como executar

Instalar dependências:

```bash
npm install
npx playwright install
```

Executar todos os testes:

```bash
npx playwright test
```

Executar apenas formulário:

```bash
npx playwright test tests/certificacao-formulario.spec.ts
```

Executar apenas acessos:

```bash
npx playwright test tests/certificacao-acessos.spec.ts
```

Abrir relatório:

```bash
npx playwright show-report
```
