# CalorieTracker - Dependências

## Dependências de Produção

| Pacote | Versão | Finalidade |
|--------|--------|------------|
| `next` | 16.2.1 | Framework fullstack com App Router, Server Components e Server Actions |
| `react` | 19.2.4 | Biblioteca de UI para construção de componentes |
| `react-dom` | 19.2.4 | Renderizador React para o DOM do navegador |
| `@prisma/client` | 7.6.0 | ORM client — acesso tipado ao banco de dados |
| `prisma` | 7.6.0 | ORM CLI e engine — migrations, generate, studio |
| `@prisma/adapter-pg` | 7.6.0 | Adapter PostgreSQL para Prisma 7 (driver adapter obrigatório no Prisma 7+) |
| `pg` | 8.20.0 | Driver PostgreSQL nativo para Node.js |
| `@neondatabase/serverless` | 1.0.2 | Driver serverless do Neon (fallback para ambientes edge/serverless) |
| `tailwind-merge` | 3.5.0 | Merge inteligente de classes Tailwind CSS, resolve conflitos de classes |
| `clsx` | 2.1.1 | Utilitário para classnames condicionais |
| `lucide-react` | 1.7.0 | Biblioteca de ícones SVG como componentes React |
| `sonner` | 2.0.7 | Toast notifications — substitui o toast deprecado do shadcn/ui |
| `recharts` | 3.8.1 | Biblioteca de gráficos (peso, projeções calóricas) |
| `zod` | 4.3.6 | Validação de schemas e parsing de dados em runtime |
| `resend` | 6.10.0 | SDK para envio de emails transacionais |

## Dependências de Desenvolvimento

| Pacote | Versão | Finalidade |
|--------|--------|------------|
| `typescript` | 5.x | Type checking estático e compilação TypeScript |
| `@types/node` | 20.x | Definições de tipos para APIs do Node.js |
| `@types/react` | 19.x | Definições de tipos para React 19 |
| `@types/react-dom` | 19.x | Definições de tipos para React DOM 19 |
| `@types/pg` | 8.20.0 | Definições de tipos para o driver pg |
| `@tailwindcss/postcss` | 4.x | Plugin PostCSS para Tailwind CSS v4 |
| `eslint` | 9.x | Linter para análise estática de código |
| `eslint-config-next` | 16.x | Configuração ESLint otimizada para Next.js |
| `tsx` | 4.21.0 | Executor TypeScript para scripts (seed, utilitários) |
| `dotenv` | 17.3.1 | Carregamento de variáveis de ambiente em scripts standalone |

## Notas sobre Versões

### Prisma 7
- O Prisma 7 exige um **driver adapter** (não aceita mais `datasourceUrl` no construtor)
- O `@prisma/adapter-pg` conecta o Prisma ao driver `pg` nativo
- O client é gerado em `src/generated/prisma` via `prisma generate`

### Next.js 16
- `searchParams` e `params` em page components são `Promise<...>` — devem ser awaited
- App Router com Server Components como padrão

### shadcn/ui
- O componente `toast` foi deprecado — usar `sonner` como substituto
