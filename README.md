# MyHermes

MyHermes é um hub pessoal de automações. A primeira fatia recebe texto de um proprietário autorizado pelo Telegram, preserva a Entrada, interpreta-a como Nota, Tarefa ou Lembrete e confirma o Item criado.

## Requisitos

- Node.js 24 ou superior
- pnpm 10.18.3
- Docker com Compose
- Um bot do Telegram e um projeto OpenAI

## Desenvolvimento local

1. Copie `.env.example` para `.env` e preencha os valores secretos.
2. Inicie o PostgreSQL com `docker compose up -d --wait postgres`.
3. Instale as dependências com `pnpm install`.
4. Inicie o Hermes em polling com `pnpm dev`.

As migrações são aplicadas automaticamente na inicialização. Para aplicá-las separadamente, use `pnpm db:migrate`.

## Verificação

- `pnpm test` executa a suíte completa.
- `pnpm typecheck` valida os contratos TypeScript.
- `pnpm lint` executa as regras estáticas.
- `pnpm build` gera o serviço em `dist/`.

Os testes de PostgreSQL usam Testcontainers e requerem Docker disponível.

## Operação atual

- `GET /health` confirma que o processo está ativo.
- `GET /ready` confirma acesso ao PostgreSQL.
- Somente `TELEGRAM_ALLOWED_USER_ID` é aceito.
- O update ID do Telegram impede Entradas duplicadas.
- Processamento assíncrono usa pg-boss no mesmo PostgreSQL.

O webhook de produção, áudio, URLs, revisão de ambiguidades e gestão completa de Itens são entregas posteriores rastreadas nas issues do projeto.
