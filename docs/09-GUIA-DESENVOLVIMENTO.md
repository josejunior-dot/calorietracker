# CalorieTracker - Guia de Desenvolvimento

## Estrutura de Pastas

```
calorietracker/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── (app)/          # Páginas autenticadas (com BottomNav)
│   │   │   ├── adicionar/
│   │   │   ├── combos/
│   │   │   ├── diario/
│   │   │   ├── dieta/
│   │   │   │   └── base/
│   │   │   ├── exercicios/
│   │   │   ├── inicio/
│   │   │   └── perfil/
│   │   │       └── peso/
│   │   ├── api/            # API Routes
│   │   │   ├── alimentos/
│   │   │   ├── base-alimentar/
│   │   │   ├── combos/
│   │   │   ├── dashboard/
│   │   │   ├── dieta/
│   │   │   ├── exercicios/
│   │   │   ├── perfil/
│   │   │   ├── peso/
│   │   │   ├── projecao/
│   │   │   ├── refeicoes/
│   │   │   └── streak/
│   │   ├── onboarding/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── alimentos/      # FoodCard, FoodSearch, PortionSelector
│   │   ├── diario/         # DayNavigator, FoodEntryCard, MealSection
│   │   ├── exercicios/     # ExerciseCard, ExerciseSearch, DurationInput
│   │   ├── inicio/         # CalorieRing, MacroBar, MealSummaryCard, etc
│   │   ├── perfil/         # ProfileForm, MetricsDisplay, WeightChart
│   │   └── ui/             # BottomNav
│   ├── generated/prisma/   # Prisma client (gerado)
│   ├── lib/                # Utilitários (bmr, diet-builder, noom-color, etc)
│   └── types/              # Schemas Zod e tipos
├── docs/                   # Documentação
└── public/
```

## Convenções de Código

- **Componentes:** PascalCase, um por arquivo
- **API Routes:** kebab-case nas pastas, exports nomeados (`GET`, `POST`, `PUT`, `DELETE`)
- **Estilos:** Tailwind utility-first, sem CSS modules
- **Estado:** `useState`/`useCallback` (sem state management externo)
- **Validação:** Zod no backend, forms controlados no frontend
- **Toasts:** Sonner (`toast.success`/`toast.error`)

## Como Adicionar Nova Feature

1. Criar model no `schema.prisma` se necessário → `npx prisma db push`
2. Criar API route em `src/app/api/`
3. Criar página em `src/app/(app)/` se necessário
4. Criar componentes em `src/components/`
5. Build: `npm run build` → Deploy: `npx vercel --prod`

## Como Adicionar Novo Alimento no Seed

Adicionar no arquivo de seed com os seguintes campos obrigatórios:

- `name` — nome do alimento
- `category` — categoria (ex: Proteína, Carboidrato, Gordura, etc)
- `servingSize` — tamanho da porção em gramas
- `servingLabel` — rótulo da porção (ex: "1 unidade", "1 colher de sopa")
- Todos os macros: `calories`, `protein`, `carbs`, `fat`, `fiber`, `saturatedFat`, `transFat`
- `noomColor` — classificação Noom (GREEN, YELLOW, RED)
