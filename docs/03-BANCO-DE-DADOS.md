# CalorieTracker - Banco de Dados

## Visao Geral

O CalorieTracker utiliza **PostgreSQL** como banco de dados, gerenciado pelo **Prisma 7** com driver adapter. O schema define 10 models que cobrem todo o dominio da aplicacao: perfil do usuario, alimentos, refeicoes, exercicios, peso e gamificacao.

---

## Diagrama de Relacionamentos

```mermaid
erDiagram
    User ||--o{ MealEntry : "registra"
    User ||--o{ ExerciseEntry : "registra"
    User ||--o{ WeightLog : "registra"
    User ||--o{ DailyLog : "possui"
    User ||--o{ FixedFood : "define"
    User ||--o| Streak : "possui"

    Food ||--o{ MealEntry : "referenciado em"
    Food ||--o{ FixedFood : "referenciado em"
    Food ||--o{ ComboItem : "eh ingrediente de"
    Food ||--o{ ComboItem : "eh combo pai de"

    Exercise ||--o{ ExerciseEntry : "referenciado em"

    User {
        string id PK
        string name
        string email UK
        string gender
        datetime birthDate
        float height
        float weight
        float bodyFatPercent
        string activityLevel
        string goal
        float goalKgPerWeek
        int dailyCalTarget
    }

    Food {
        string id PK
        string name
        string brand
        string category
        float servingSize
        string servingLabel
        float calories
        float protein
        float carbs
        float fat
        string noomColor
        boolean isCustom
        boolean isCombo
    }

    ComboItem {
        string id PK
        string comboId FK
        string foodId FK
        float quantity
        string unit
        float servings
    }

    MealEntry {
        string id PK
        string userId FK
        string foodId FK
        string date
        string mealType
        float servings
        float calories
        float protein
        float carbs
        float fat
    }

    Exercise {
        string id PK
        string name
        string category
        float caloriesPerMinBase
        string icon
    }

    ExerciseEntry {
        string id PK
        string userId FK
        string exerciseId FK
        string date
        int durationMin
        float caloriesBurned
    }

    WeightLog {
        string id PK
        string userId FK
        string date
        float weight
        float bodyFatPercent
        string note
    }

    DailyLog {
        string id PK
        string userId FK
        string date
        int caloriesTarget
        float caloriesConsumed
        float caloriesBurned
        float protein
        float carbs
        float fat
    }

    FixedFood {
        string id PK
        string userId FK
        string foodId FK
        string mealType
        float servings
    }

    Streak {
        string id PK
        string userId FK-UK
        int currentStreak
        int longestStreak
        string lastLogDate
    }
```

---

## Models em Detalhe

### 1. User

Perfil do usuario. Aplicacao single-user, mas o modelo suporta multiplos usuarios.

| Campo | Tipo | Restricoes | Descricao |
|-------|------|------------|-----------|
| `id` | `String` | PK, cuid() | Identificador unico |
| `name` | `String` | obrigatorio | Nome do usuario |
| `email` | `String?` | unique, opcional | E-mail (opcional) |
| `gender` | `String` | obrigatorio | Sexo: `masculino` ou `feminino` |
| `birthDate` | `DateTime` | obrigatorio | Data de nascimento (usado para calculo de idade/BMR) |
| `height` | `Float` | obrigatorio | Altura em centimetros |
| `weight` | `Float` | obrigatorio | Peso atual em quilogramas |
| `bodyFatPercent` | `Float?` | opcional | Percentual de gordura corporal |
| `activityLevel` | `String` | obrigatorio | Nivel de atividade: `sedentario`, `leve`, `moderado`, `ativo`, `muito_ativo` |
| `goal` | `String` | obrigatorio | Objetivo: `perder`, `manter`, `ganhar` |
| `goalKgPerWeek` | `Float` | default 0.5 | Ritmo desejado em kg/semana |
| `dailyCalTarget` | `Int?` | opcional | Meta calorica diaria (calculada automaticamente se nao informada) |
| `createdAt` | `DateTime` | auto | Data de criacao |
| `updatedAt` | `DateTime` | auto | Data da ultima atualizacao |

**Relacionamentos:**
- `mealEntries` -> MealEntry[] (1:N)
- `exerciseEntries` -> ExerciseEntry[] (1:N)
- `weightLogs` -> WeightLog[] (1:N)
- `dailyLogs` -> DailyLog[] (1:N)
- `fixedFoods` -> FixedFood[] (1:N)
- `streak` -> Streak? (1:1)

---

### 2. Food

Catalogo de alimentos. Inclui alimentos do seed (base) e alimentos customizados criados pelo usuario. Tambem serve como container para combos/receitas.

| Campo | Tipo | Restricoes | Descricao |
|-------|------|------------|-----------|
| `id` | `String` | PK, cuid() | Identificador unico |
| `name` | `String` | obrigatorio | Nome do alimento |
| `brand` | `String?` | opcional | Marca (ex: "Nestle", "Seara") |
| `category` | `String` | obrigatorio | Categoria do alimento |
| `servingSize` | `Float` | obrigatorio | Tamanho da porcao em gramas |
| `servingLabel` | `String` | obrigatorio | Descricao da porcao (ex: "100g", "1 unidade", "1 fatia") |
| `calories` | `Float` | obrigatorio | Calorias por porcao (kcal) |
| `protein` | `Float` | obrigatorio | Proteina em gramas por porcao |
| `carbs` | `Float` | obrigatorio | Carboidratos em gramas por porcao |
| `fat` | `Float` | obrigatorio | Gordura total em gramas por porcao |
| `saturatedFat` | `Float` | default 0 | Gordura saturada em gramas |
| `transFat` | `Float` | default 0 | Gordura trans em gramas |
| `fiber` | `Float` | default 0 | Fibra em gramas |
| `sugar` | `Float` | default 0 | Acucar em gramas |
| `sodium` | `Float` | default 0 | Sodio em miligramas |
| `noomColor` | `String` | obrigatorio | Classificacao Noom: `green`, `yellow`, `orange` |
| `isCustom` | `Boolean` | default false | Se foi criado pelo usuario |
| `isCombo` | `Boolean` | default false | Se eh um combo/receita |
| `createdAt` | `DateTime` | auto | Data de criacao |

**Categorias validas:**
`frutas`, `carnes`, `graos`, `laticinios`, `legumes`, `paes`, `bebidas`, `refeicoes`, `industrializados`, `oleos`

**Classificacao Noom Color:**
- `green` (densidade < 1.0 cal/g) — alimentos de baixa densidade calorica
- `yellow` (densidade 1.0-2.4 cal/g) — alimentos de media densidade
- `orange` (densidade > 2.4 cal/g) — alimentos de alta densidade calorica

**Relacionamentos:**
- `mealEntries` -> MealEntry[] (1:N)
- `fixedFoods` -> FixedFood[] (1:N)
- `comboItems` -> ComboItem[] (1:N, quando isCombo=true, via comboId)

---

### 3. ComboItem

Ingredientes de um combo/receita. Cada item referencia o combo pai e o alimento ingrediente.

| Campo | Tipo | Restricoes | Descricao |
|-------|------|------------|-----------|
| `id` | `String` | PK, cuid() | Identificador unico |
| `comboId` | `String` | FK -> Food.id | ID do combo pai |
| `foodId` | `String` | FK -> Food.id | ID do alimento ingrediente |
| `quantity` | `Float` | obrigatorio | Quantidade (em gramas, unidades, etc.) |
| `unit` | `String` | obrigatorio | Unidade: `g`, `unidade`, `pitada`, `colher` |
| `servings` | `Float` | default 1 | Numero de porcoes do ingrediente |

**Indices:** `@@index([comboId])`

**Cascade:** Ao deletar o combo pai (Food), todos os ComboItems sao removidos automaticamente via `onDelete: Cascade`.

**Relacionamentos:**
- `combo` -> Food (N:1, via comboId)

> Nota: `foodId` nao possui relacao formal no schema Prisma (sem `@relation`), mas referencia logicamente um Food.

---

### 4. MealEntry

Registro de uma refeicao. Cada entrada vincula um usuario a um alimento em uma data e tipo de refeicao. Os valores nutricionais sao desnormalizados (copiados do Food no momento da criacao) para performance.

| Campo | Tipo | Restricoes | Descricao |
|-------|------|------------|-----------|
| `id` | `String` | PK, cuid() | Identificador unico |
| `userId` | `String` | FK -> User.id | ID do usuario |
| `foodId` | `String` | FK -> Food.id | ID do alimento |
| `date` | `String` | obrigatorio | Data no formato ISO: "2026-03-31" |
| `mealType` | `String` | obrigatorio | Tipo da refeicao |
| `servings` | `Float` | default 1 | Numero de porcoes consumidas |
| `calories` | `Float` | desnormalizado | Calorias (Food.calories * servings) |
| `protein` | `Float` | desnormalizado | Proteina em gramas |
| `carbs` | `Float` | desnormalizado | Carboidratos em gramas |
| `fat` | `Float` | desnormalizado | Gordura em gramas |
| `createdAt` | `DateTime` | auto | Data de criacao |

**Tipos de refeicao validos:** `cafe_da_manha`, `almoco`, `jantar`, `lanche`

**Indices:** `@@index([userId, date])` — otimiza consultas por usuario+data (caso mais comum).

**Relacionamentos:**
- `user` -> User (N:1)
- `food` -> Food (N:1)

**Efeitos colaterais ao criar/deletar:**
- Recalcula o `DailyLog` do usuario+data (caloriesConsumed, protein, carbs, fat)
- Ao criar, atualiza o `Streak` do usuario

---

### 5. Exercise

Catalogo de exercicios disponiveis. Populado via seed com exercicios comuns.

| Campo | Tipo | Restricoes | Descricao |
|-------|------|------------|-----------|
| `id` | `String` | PK, cuid() | Identificador unico |
| `name` | `String` | obrigatorio | Nome do exercicio |
| `category` | `String` | obrigatorio | Categoria do exercicio |
| `caloriesPerMinBase` | `Float` | obrigatorio | Calorias/minuto para pessoa de 70kg |
| `icon` | `String?` | opcional | Emoji representativo |
| `createdAt` | `DateTime` | auto | Data de criacao |

**Categorias validas:** `cardio`, `musculacao`, `esportes`, `flexibilidade`, `funcional`

**Calculo de calorias queimadas:**
```
caloriesBurned = caloriesPerMinBase * (userWeight / 70) * durationMin
```
O valor base eh para uma pessoa de 70kg e eh ajustado proporcionalmente ao peso real do usuario.

**Relacionamentos:**
- `exerciseEntries` -> ExerciseEntry[] (1:N)

---

### 6. ExerciseEntry

Registro de exercicio realizado por um usuario em uma data.

| Campo | Tipo | Restricoes | Descricao |
|-------|------|------------|-----------|
| `id` | `String` | PK, cuid() | Identificador unico |
| `userId` | `String` | FK -> User.id | ID do usuario |
| `exerciseId` | `String` | FK -> Exercise.id | ID do exercicio |
| `date` | `String` | obrigatorio | Data no formato ISO |
| `durationMin` | `Int` | obrigatorio | Duracao em minutos |
| `caloriesBurned` | `Float` | calculado | Calorias queimadas (ajustado pelo peso) |
| `createdAt` | `DateTime` | auto | Data de criacao |

**Indices:** `@@index([userId, date])`

**Relacionamentos:**
- `user` -> User (N:1)
- `exercise` -> Exercise (N:1)

**Efeitos colaterais ao criar/deletar:**
- Recalcula o `DailyLog.caloriesBurned` do usuario+data

---

### 7. WeightLog

Historico de pesagens do usuario. Permite acompanhar evolucao do peso ao longo do tempo.

| Campo | Tipo | Restricoes | Descricao |
|-------|------|------------|-----------|
| `id` | `String` | PK, cuid() | Identificador unico |
| `userId` | `String` | FK -> User.id | ID do usuario |
| `date` | `String` | obrigatorio | Data no formato ISO |
| `weight` | `Float` | obrigatorio | Peso em quilogramas |
| `bodyFatPercent` | `Float?` | opcional | Percentual de gordura corporal |
| `note` | `String?` | opcional | Observacao livre |
| `createdAt` | `DateTime` | auto | Data de criacao |

**Constraint unico:** `@@unique([userId, date])` — apenas um registro por usuario por dia. Se ja existir, faz upsert (atualiza o existente).

**Efeito colateral ao criar/atualizar:**
- Atualiza `User.weight` (e `User.bodyFatPercent` se informado) com o valor mais recente

**Relacionamentos:**
- `user` -> User (N:1)

---

### 8. DailyLog

Resumo diario consolidado. Funciona como cache dos totais do dia para o usuario, evitando recalculos a cada consulta ao dashboard.

| Campo | Tipo | Restricoes | Descricao |
|-------|------|------------|-----------|
| `id` | `String` | PK, cuid() | Identificador unico |
| `userId` | `String` | FK -> User.id | ID do usuario |
| `date` | `String` | obrigatorio | Data no formato ISO |
| `caloriesTarget` | `Int` | obrigatorio | Meta calorica do dia |
| `caloriesConsumed` | `Float` | default 0 | Total de calorias consumidas |
| `caloriesBurned` | `Float` | default 0 | Total de calorias queimadas em exercicios |
| `protein` | `Float` | default 0 | Total de proteina consumida (g) |
| `carbs` | `Float` | default 0 | Total de carboidratos consumidos (g) |
| `fat` | `Float` | default 0 | Total de gordura consumida (g) |
| `createdAt` | `DateTime` | auto | Data de criacao |
| `updatedAt` | `DateTime` | auto | Data da ultima atualizacao |

**Constraint unico:** `@@unique([userId, date])` — um registro por usuario por dia.

**Calculo de calorias restantes:**
```
remaining = caloriesTarget - caloriesConsumed + caloriesBurned
```

**Atualizacao automatica:**
- Recalculado sempre que um `MealEntry` eh criado/deletado (atualiza consumed + macros)
- Recalculado sempre que um `ExerciseEntry` eh criado/deletado (atualiza burned)
- Criado automaticamente ao acessar o dashboard se ainda nao existir

**Relacionamentos:**
- `user` -> User (N:1)

---

### 9. FixedFood

Base alimentar do usuario. Alimentos que o usuario consome frequentemente e que servem como base para a geracao automatica de dietas.

| Campo | Tipo | Restricoes | Descricao |
|-------|------|------------|-----------|
| `id` | `String` | PK, cuid() | Identificador unico |
| `userId` | `String` | FK -> User.id | ID do usuario |
| `foodId` | `String` | FK -> Food.id | ID do alimento |
| `mealType` | `String` | obrigatorio | Tipo de refeicao preferencial |
| `servings` | `Float` | default 1 | Quantidade padrao de porcoes |
| `createdAt` | `DateTime` | auto | Data de criacao |

**Tipos de refeicao validos:** `cafe_da_manha`, `almoco`, `jantar`, `lanche`, `qualquer`

> Nota: O tipo `qualquer` indica que o alimento pode ser alocado em qualquer refeicao pelo gerador de dieta.

**Indices:** `@@index([userId])`

**Relacionamentos:**
- `user` -> User (N:1)
- `food` -> Food (N:1)

---

### 10. Streak

Controle de sequencia de dias consecutivos com registro de refeicoes. Gamificacao para motivar o usuario.

| Campo | Tipo | Restricoes | Descricao |
|-------|------|------------|-----------|
| `id` | `String` | PK, cuid() | Identificador unico |
| `userId` | `String` | FK -> User.id, unique | ID do usuario (1:1) |
| `currentStreak` | `Int` | default 0 | Sequencia atual de dias consecutivos |
| `longestStreak` | `Int` | default 0 | Maior sequencia ja atingida |
| `lastLogDate` | `String?` | opcional | Data do ultimo registro (formato ISO) |

**Constraint unico:** `userId` eh unique — cada usuario possui no maximo um registro de streak.

**Logica de atualizacao:**
- Se `lastLogDate` == ontem: incrementa `currentStreak`
- Se `lastLogDate` == hoje: nao faz nada (ja contabilizado)
- Caso contrario: reseta `currentStreak` para 1
- Se `currentStreak` > `longestStreak`: atualiza `longestStreak`
- Criado automaticamente junto com o perfil do usuario

**Relacionamentos:**
- `user` -> User (1:1)

---

## Indices e Performance

| Model | Indice | Colunas | Tipo |
|-------|--------|---------|------|
| User | email | `email` | Unique |
| MealEntry | idx_meal_user_date | `[userId, date]` | Composto |
| ExerciseEntry | idx_exercise_user_date | `[userId, date]` | Composto |
| WeightLog | unique_weight_user_date | `[userId, date]` | Unique composto |
| DailyLog | unique_daily_user_date | `[userId, date]` | Unique composto |
| FixedFood | idx_fixed_user | `[userId]` | Simples |
| ComboItem | idx_combo_id | `[comboId]` | Simples |
| Streak | userId | `userId` | Unique |

Os indices compostos `[userId, date]` sao fundamentais para performance, ja que a maioria das consultas filtra por usuario e data (dashboard, listagem de refeicoes, exercicios do dia).

---

## Desnormalizacao

A tabela `MealEntry` armazena valores nutricionais desnormalizados (calories, protein, carbs, fat) calculados no momento da insercao (`Food.valor * servings`). Isso:

1. **Melhora performance** — evita JOINs e calculos em tempo de consulta
2. **Preserva historico** — se o alimento for editado depois, os registros antigos mantem os valores originais

A tabela `DailyLog` funciona como cache dos totais diarios e eh recalculada automaticamente a cada insercao/remocao de MealEntry ou ExerciseEntry.

---

## Configuracao Prisma

```prisma
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

O Prisma 7 utiliza driver adapter. A URL do banco e configuracao do adapter ficam em `prisma.config.ts`, nao no `schema.prisma`.
