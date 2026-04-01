# CalorieTracker - Operações e Deploy

## Ambiente Local

O projeto utiliza **Next.js 16** com hot reload integrado.

```bash
npm run dev
```

- Porta padrão: **3000** (`http://localhost:3000`)
- Hot reload automático para alterações em componentes, páginas e API routes
- Variáveis de ambiente carregadas do `.env.local`

## Build

```bash
npm run build
```

- Gera o diretório `.next/` com os artefatos de produção
- Pré-renderiza páginas estáticas quando possível
- Executa type-checking e validação de imports
- Para testar o build localmente: `npm run start`

## Prisma

### Gerar o Client

```bash
npx prisma generate
```

- Gera o client em `src/generated/prisma`
- Necessário após alterar o `schema.prisma`
- O script `postinstall` do package.json executa isso automaticamente no deploy

### Sincronizar Schema com o Banco

```bash
npx prisma db push
```

- Sincroniza o schema com o banco de dados (Neon PostgreSQL)
- Útil para desenvolvimento — aplica alterações sem criar migrations formais
- **Cuidado**: pode causar perda de dados em colunas removidas/renomeadas

### Prisma Studio (Interface Visual)

```bash
npx prisma studio
```

- Abre interface web para visualizar e editar dados diretamente
- Porta padrão: 5555

## Deploy na Vercel

### Deploy Automático

1. Push para o repositório GitHub
2. Vercel detecta o push e inicia o build automaticamente
3. Preview deploy para branches não-main, produção para `main`

### Deploy Manual

```bash
npx vercel --prod
```

### Script postinstall

O `postinstall` no `package.json` executa `prisma generate` automaticamente durante o build na Vercel, garantindo que o Prisma Client esteja disponível.

### Variáveis de Ambiente (Painel Vercel)

As seguintes env vars devem estar configuradas no painel da Vercel:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string do Neon PostgreSQL |
| `RESEND_API_KEY` | Chave da API Resend para envio de emails |

### URL de Produção

```
https://calorietracker-eosin.vercel.app
```

## Banco de Dados — Neon

- **Tipo**: PostgreSQL serverless
- **Connection pooling**: automático (gerenciado pelo Neon)
- **SSL**: obrigatório em todas as conexões
- **Branching**: suporte a branches de banco para testes isolados
- **Point-in-time recovery**: restauração para qualquer ponto no tempo disponível no plano

### Connection String

Formato típico:

```
postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

## Monitoramento

- **Vercel Analytics**: habilitado por padrão, métricas de performance e uso
- **Error tracking**: `console.error` nos catch blocks das API routes e Server Actions
- Erros são capturados nos logs das Vercel Functions

## Backup

O Neon oferece:

- **Branching**: crie branches do banco para experimentação sem afetar produção
- **Point-in-time recovery**: restaure o banco para qualquer momento dentro do período de retenção

## Logs

### Via CLI

```bash
vercel logs
```

### Via Painel

1. Acesse o painel da Vercel
2. Navegue até o projeto CalorieTracker
3. Aba **Functions** → logs em tempo real das API routes e Server Actions
