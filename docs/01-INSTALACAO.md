# CalorieTracker - Guia de Instalacao

## Pre-requisitos

- **Node.js 20+** (recomendado: LTS mais recente)
- **npm** (incluido com Node.js)
- **Conta Neon PostgreSQL** - banco de dados serverless ([neon.tech](https://neon.tech))
- **Conta Vercel** - para deploy em producao ([vercel.com](https://vercel.com))

## 1. Clone do Repositorio

```bash
git clone <url-do-repositorio>
cd calorietracker
```

## 2. Instalacao de Dependencias

```bash
npm install
```

Isso instala todas as dependencias do projeto, incluindo:

- **Next.js 16** + React 19 (framework fullstack)
- **Prisma 7** + adapter PostgreSQL (ORM)
- **@neondatabase/serverless** + **pg** (driver do banco)
- **Recharts** (graficos), **Sonner** (notificacoes), **Lucide React** (icones)
- **Zod 4** (validacao de dados)
- **Resend** (envio de e-mails)

> O script `postinstall` roda `prisma generate` automaticamente apos o `npm install`.

## 3. Configuracao do Ambiente (.env)

Crie um arquivo `.env` na raiz do projeto:

```env
# Conexao com Neon PostgreSQL (obrigatorio)
# Copie a connection string do dashboard Neon, incluindo ?sslmode=require
DATABASE_URL="postgresql://usuario:senha@ep-xxx.us-east-2.aws.neon.tech/calorietracker?sslmode=require"

# API key do Resend para envio de e-mails (opcional)
RESEND_API_KEY="re_xxxxxxxx"
```

### Obtendo a DATABASE_URL no Neon

1. Acesse [console.neon.tech](https://console.neon.tech)
2. Crie um novo projeto (ou use um existente)
3. Copie a **connection string** no formato `postgresql://...`
4. Certifique-se de que `?sslmode=require` esta no final da URL

## 4. Prisma - Gerar Client e Criar Tabelas

```bash
# Gera o Prisma Client (necessario antes de rodar a app)
npx prisma generate

# Cria/atualiza as tabelas no banco de dados
npx prisma db push
```

O Prisma Client e gerado em `src/generated/prisma/` conforme configurado no `schema.prisma`.

## 5. Seed do Banco de Dados

O seed popula o banco com dados base: alimentos (frutas, carnes, graos, laticinios, etc.) e exercicios (cardio, musculacao, esportes, etc.).

```bash
npx prisma db seed
```

> O seed usa `tsx` como runner e configura o adapter `PrismaPg` manualmente, pois o `prisma.config.ts` e exclusivo do CLI.

## 6. Rodar Localmente

```bash
npm run dev
```

A aplicacao estara disponivel em **http://localhost:3000**.

## 7. Build de Producao

```bash
npm run build
npm start
```

O `build` gera a versao otimizada do Next.js e o `start` serve a aplicacao em modo producao.

## 8. Deploy na Vercel

### Via CLI

```bash
npx vercel --prod
```

### Configuracao na Vercel

1. Conecte o repositorio no dashboard da Vercel
2. Adicione as variaveis de ambiente:
   - `DATABASE_URL` (connection string do Neon com SSL)
   - `RESEND_API_KEY` (se usar envio de e-mails)
3. O deploy roda automaticamente `npm install` (que aciona o `postinstall` com `prisma generate`)

> O projeto inclui `vercel.json` com configuracoes de deploy pre-definidas.

## Troubleshooting

### Prisma 7 - Erros comuns

**Erro: `datasourceUrl is not a valid constructor option`**

O Prisma 7 removeu `datasourceUrl` e `datasources` do constructor do `PrismaClient`. Voce deve usar um **driver adapter**:

```typescript
import { PrismaClient } from './generated/prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })
```

**Erro: `datasource url not found in schema.prisma`**

No Prisma 7, o bloco `datasource` no `schema.prisma` nao aceita `url`. A URL e configurada via adapter no codigo ou via `prisma.config.ts` para o CLI.

**Erro: `prisma generate` nao gera nada**

Verifique se o `generator client` esta com `provider = "prisma-client"` (e nao `prisma-client-js`, que e do Prisma 6).

### Conexao com Neon

**Erro: `SSL connection required`**

Adicione `?sslmode=require` ao final da `DATABASE_URL`.

**Erro: `connection timeout`**

O Neon suspende bancos inativos (cold start). A primeira conexao pode levar alguns segundos. Tente novamente.

### Next.js 16

**Erro: `searchParams` ou `params` com tipo incorreto**

No Next.js 16+, `searchParams` e `params` em page components sao `Promise<...>` e devem ser aguardados com `await`.
