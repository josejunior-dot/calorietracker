# CalorieTracker - Development Log

> Registro completo do processo de construcao, decisoes arquiteturais, problemas encontrados e solucoes.

**Repositorio:** https://github.com/josejunior-dot/calorietracker
**Status:** Em Desenvolvimento
**Inicio do desenvolvimento:** 28/03/2026

---

## Sumario

- [1. Visao Geral do Produto](#1-visao-geral-do-produto)
- [2. Stack Tecnologica](#2-stack-tecnologica)
- [3. Cronologia de Desenvolvimento](#3-cronologia-de-desenvolvimento)
- [4. Arquitetura e Decisoes Tecnicas](#4-arquitetura-e-decisoes-tecnicas)
- [5. Estrutura do Projeto](#5-estrutura-do-projeto)
- [6. Modelos de Dados](#6-modelos-de-dados)
- [7. Endpoints da API](#7-endpoints-da-api)
- [8. Rotas do Frontend](#8-rotas-do-frontend)
- [9. Deploy e Infraestrutura](#9-deploy-e-infraestrutura)
- [10. Problemas Encontrados e Solucoes](#10-problemas-encontrados-e-solucoes)
- [11. Metricas do Projeto](#11-metricas-do-projeto)

---

## 1. Visao Geral do Produto

App de controle de calorias e peso corporal, tipo MyFitnessPal brasileiro. Permite registrar refeicoes, exercicios, acompanhar peso e receber planos alimentares automaticos. Usa sistema de cores Noom para classificar alimentos por densidade calorica.

---

## 2. Stack Tecnologica

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 16.2.1 |
| UI | React + TypeScript | 19.2.4 |
| Estilos | Tailwind CSS | 4.x |
| ORM | Prisma | 7.6.0 |
| Banco | Neon PostgreSQL | serverless |
| Graficos | Recharts | 3.8.1 |
| Validacao | Zod | 4.3.6 |
| Notificacoes | Sonner | 2.0.7 |
| Icones | Lucide React | 1.7.0 |
| Deploy | Vercel | - |

---

## 3. Cronologia de Desenvolvimento

### Sessao 5 — 01/04/2026

**Objetivo:** Correcoes de combos + validacao de alimentos similares

- Fix: Exclusao de combo falhava por FK constraint — agora remove refs em MealEntry e FixedFood antes de deletar
- Fix: Botao "Salvar Combo" agora mostra "Salvar Alteracoes" quando editando
- Feat: Deteccao de alimentos similares na mesma refeicao
  - API retorna 409 quando detecta alimento do mesmo tipo base (feijao+feijao, carne+carne)
  - Frontend mostra confirmacao antes de adicionar duplicata
  - 13 tipos base: feijao, arroz, carne, frango, peixe, ovo, leite, pao, queijo, banana, batata, macarrao, iogurte
- Documentacao completa do projeto (13 arquivos)

**Commits:**
- `02a9c0b` — feat: detectar alimentos similares na mesma refeicao
- `1c76420` — fix: corrigir exclusao de combo e adicionar edicao (PUT)

---

### Sessao 4 — 31/03/2026

**Objetivo:** Sistema de combos + motor de dieta refinado

- Feat: Sistema de Combos — receitas personalizadas com ingredientes, preview nutricional
- Feat: Adequacao por refeicao + fechamento calorico com gordura
- Multiplos fixes no motor de montagem de dieta (macro-first, orcamento rigido, fontes de gordura)
- Refactor completo do diet-builder com logica nutricional real

**Commits:**
- `23a4194` — feat: adequacao por refeicao + fechamento calorico
- `0b595df` — feat: sistema de Combos
- `810a1e7` a `ef95ab2` — serie de fixes no motor de dieta

---

### Sessao 3 — 30/03/2026

**Objetivo:** Base Alimentar + gerador de dieta + projecoes

- Feat: Base Alimentar — alimentos fixos que o usuario nao abre mao
- Feat: Seletores de macro % e substituicao de alimentos na dieta
- Feat: Projecoes de peso (12 semanas) + montador de dieta automatico
- Feat: Gordura saturada e trans na base alimentar

**Commits:**
- `a7bf52d` — feat: Base Alimentar
- `d37bb2c` — feat: seletores de macro e substituicao
- `6c3e296` — feat: projecoes de peso + montador de dieta
- `fb50113` — feat: gordura saturada e trans

---

### Sessao 2 — 29/03/2026

**Objetivo:** Correcoes pos-deploy + expansao de alimentos

- Fix: Redirect loop na pagina raiz
- Feat: 41 variedades de carnes brasileiras no banco
- Fix: Remover userId hardcoded -> auto-deteccao de usuario unico
- Fix: APIs auto-detectam userId

**Commits:**
- `059c1d9` — fix: redirect loop
- `9b87a9d` — feat: 41 carnes brasileiras
- `eef1e7c` — fix: remover userId hardcoded
- `4c762f0` — fix: APIs auto-detectam userId

---

### Sessao 1 — 28/03/2026

**Objetivo:** MVP completo + primeiro deploy

- Setup inicial: Next.js 16 + Prisma 7 + Neon PostgreSQL
- Todas as paginas: dashboard, diario, exercicios, perfil, peso, onboarding
- Todas as APIs: alimentos, refeicoes, exercicios, perfil, peso, dashboard, streak
- Deploy Vercel com fixes de compatibilidade (postinstall, vercel.json, prisma.config.ts)

**Commits:**
- `47ce467` — feat: CalorieTracker MVP
- `e2a8f1a` — Initial commit
- `7b938f3` a `4a0e37f` — fixes de deploy

---

## 4. Arquitetura e Decisoes Tecnicas

### Single-user sem autenticacao
**Escolha:** Auto-detectar userId do primeiro User no banco
**Motivo:** MVP pessoal, sem necessidade de multi-user no momento

### Denormalizacao de macros no MealEntry
**Escolha:** Salvar calories/protein/carbs/fat calculados no MealEntry
**Motivo:** Leitura rapida no dashboard sem joins complexos. DailyLog recalculado automaticamente.

### Prisma 7 com PrismaPg adapter
**Escolha:** Usar driver adapter pattern (novo no Prisma 7)
**Motivo:** Compatibilidade com Neon serverless e Vercel Edge

### Sistema Noom Color
**Escolha:** Classificar todos os alimentos por densidade calorica (green/yellow/orange)
**Motivo:** Indicador visual intuitivo sem precisar analisar numeros

### Deteccao de similares por tipo base
**Escolha:** Keywords hardcoded por tipo (feijao, carne, etc.) com normalizacao de acentos
**Motivo:** Simples, eficiente, sem dependencia de IA. Cobre os casos mais comuns de duplicata.

---

## 5. Estrutura do Projeto

```
calorietracker/
├── prisma/schema.prisma
├── src/
│   ├── app/
│   │   ├── (app)/           # 9 paginas com BottomNav
│   │   ├── api/             # 12 pastas de API (25+ endpoints)
│   │   └── onboarding/
│   ├── components/          # 20 componentes (5 pastas)
│   ├── generated/prisma/    # Client gerado
│   ├── lib/                 # 11 utilitarios
│   └── types/               # Schemas Zod
└── docs/                    # Documentacao
```

---

## 6. Modelos de Dados

10 modelos: User, Food, ComboItem, MealEntry, Exercise, ExerciseEntry, WeightLog, DailyLog, FixedFood, Streak

(Detalhes completos em docs/03-BANCO-DE-DADOS.md)

---

## 7. Endpoints da API

25+ endpoints em 12 rotas. Principais:
- /api/refeicoes — CRUD refeicoes + deteccao similares
- /api/combos — CRUD receitas/combos
- /api/dieta — Gerador de plano alimentar
- /api/dashboard — Dados consolidados do dia

(Detalhes completos em docs/04-API-REFERENCE.md)

---

## 8. Rotas do Frontend

| Rota | Pagina |
|------|--------|
| / | Redirect para /inicio ou /onboarding |
| /onboarding | Cadastro em 5 steps |
| /inicio | Dashboard (anel calorico, macros, resumo) |
| /diario | Diario alimentar por refeicao |
| /adicionar | Adicionar alimento ao diario |
| /exercicios | Log de exercicios |
| /perfil | Perfil do usuario |
| /perfil/peso | Registro e grafico de peso |
| /dieta | Gerador de plano alimentar |
| /dieta/base | Base Alimentar (favoritos) |
| /combos | Receitas/combos personalizados |

---

## 9. Deploy e Infraestrutura

- **Hosting:** Vercel (auto-deploy via GitHub push)
- **Banco:** Neon PostgreSQL (serverless, SSL)
- **URL producao:** https://calorietracker-eosin.vercel.app
- **Env vars:** DATABASE_URL, RESEND_API_KEY

---

## 10. Problemas Encontrados e Solucoes

### Problema 1: Prisma 7 no Vercel
**Sintoma:** Build falhava — "Cannot find module prisma client"
**Causa:** Prisma 7 requer generate explicito + adapter pattern
**Solucao:** postinstall script + PrismaPg adapter + output customizado

### Problema 2: Redirect loop na raiz
**Sintoma:** Pagina / ficava em loop infinito
**Causa:** Logica de redirect verificava user sem tratamento de erro
**Solucao:** Tratar caso de banco vazio -> redirect para /onboarding

### Problema 3: Exclusao de combo falhava
**Sintoma:** Erro 500 ao excluir combo que foi usado no diario
**Causa:** FK constraint — MealEntry referenciava o Food (combo)
**Solucao:** Deletar MealEntry e FixedFood referenciando o combo antes de deletar

### Problema 4: Alimentos duplicados na refeicao
**Sintoma:** Usuario adicionava feijao preto + feijao carioca na mesma refeicao
**Causa:** Sem validacao de similaridade
**Solucao:** extractFoodBaseType() com 13 tipos base + resposta 409 + confirmacao no frontend

---

## 11. Metricas do Projeto

| Metrica | Valor |
|---------|-------|
| Arquivos-fonte (TS/TSX) | 77 |
| Modelos Prisma | 10 |
| Endpoints API | 25+ |
| Paginas | 11 |
| Componentes | 20 |
| Lib utilitarios | 11 |
| Commits | 23 |
| Dias de desenvolvimento | 4 |

---

*Ultima atualizacao: 01/04/2026*
