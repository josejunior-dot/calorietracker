# CalorieTracker - Changelog

## v0.1.0 — Abril 2026

### 01/04/2026
- **feat:** Detecção de alimentos similares na mesma refeição (feijão+feijão, carne+carne) — API retorna 409, frontend pede confirmação
- **fix:** Corrigir exclusão de combo (remove refs MealEntry/FixedFood antes) e adicionar edição PUT

### 31/03/2026
- **feat:** Adequação por refeição + fechamento calórico com gordura
- **feat:** Sistema de Combos — receitas personalizadas com ingredientes
- **fix:** Fontes de gordura por nome + corrigir busca de fat foods
- **fix:** Reescrever montagem de refeições com orçamento rígido
- **fix:** Balanceamento pós-montagem para gordura e carbs
- **fix:** Melhorar coerência alimentar e incluir fontes de gordura
- **fix:** Reescrever motor de montagem de dieta (macro-first)
- **refactor:** Montador de dieta com lógica nutricional real

### 30/03/2026
- **feat:** Base Alimentar — alimentos fixos que o usuário não abre mão
- **feat:** Seletores de macro % e substituição de alimentos na dieta
- **feat:** Projeções de peso + montador de dieta automático
- **feat:** Adicionar gordura saturada e trans na base alimentar

### 29/03/2026
- **fix:** Corrigir redirect loop na página raiz
- **feat:** Adicionar 41 variedades de carnes brasileiras
- **fix:** Remover userId hardcoded de todos os componentes
- **fix:** APIs auto-detectam userId do usuário único

### 28/03/2026
- **fix:** Adicionar vercel.json com framework nextjs
- **fix:** Adicionar postinstall para prisma generate no Vercel
- **fix:** Simplificar prisma.config.ts para compatibilidade com Vercel
- **feat:** CalorieTracker MVP — app controle de peso e calorias
- Initial commit from Create Next App
