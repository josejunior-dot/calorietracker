# CalorieTracker

## Stack
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + CSS variables (tema em globals.css)
- Prisma 7 + Neon PostgreSQL (driver adapter PrismaPg)
- Recharts para graficos
- Lucide React para icones
- Sonner para toasts
- Resend para emails
- Deploy: Vercel + Docker

## Comandos
```bash
npm run dev          # Dev server
npm run build        # Build producao
npx prisma generate  # Gerar client (obrigatorio apos mudar schema)
npx prisma migrate dev --name <nome>  # Nova migration
npx prisma db seed   # Rodar seed (150 alimentos + 30 exercicios)
```

## Prisma 7 — Regras
- Generator usa `prisma-client` com output em `src/generated/prisma`
- Import: `from '@/generated/prisma/client'` (nao `@prisma/client`)
- Seed: `from '../src/generated/prisma/client'`
- Adapter: `PrismaPg` com Pool do `pg`
- Sem `datasourceUrl` no constructor

## Estrutura
- `src/app/(app)/` — Paginas com BottomNav (inicio, diario, adicionar, exercicios, perfil)
- `src/app/onboarding/` — Fluxo de cadastro (5 passos)
- `src/app/api/` — API routes (alimentos, refeicoes, exercicios, perfil, peso, dashboard, streak)
- `src/components/` — Componentes por feature (dashboard, diario, alimentos, exercicios, perfil, layout)
- `src/lib/` — Utilidades (prisma, bmr, noom-color, date, constants, streak, utils)
- `src/types/` — Schemas Zod + tipos

## Formulas
- BMR: Mifflin-St Jeor (padrao) ou Katch-McArdle (com % gordura)
- TDEE: BMR x fator atividade (1.2 a 1.9)
- Meta: TDEE +/- (ritmo x 7700/7), minimo 1200 kcal

## Cores Noom
- Verde: < 1.0 kcal/g (frutas, legumes)
- Amarelo: 1.0-2.4 kcal/g (carnes magras, graos)
- Laranja: > 2.4 kcal/g (nuts, oleos, doces)
