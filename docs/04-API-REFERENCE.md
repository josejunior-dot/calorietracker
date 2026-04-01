# CalorieTracker - Referencia da API

## Visao Geral

API REST construida com **Next.js Route Handlers** (App Router). Todas as rotas estao em `/src/app/api/`. As respostas sao JSON e os erros seguem o formato `{ error: string, details?: object }`.

A aplicacao eh single-user por padrao. Quando `userId` nao eh informado, o sistema resolve automaticamente para o primeiro usuario cadastrado via `getDefaultUserId()`.

---

## Tabela de Rotas

| Rota | Metodo | Descricao |
|------|--------|-----------|
| `/api/alimentos` | GET | Buscar alimentos |
| `/api/alimentos` | POST | Criar alimento customizado |
| `/api/base-alimentar` | GET | Listar alimentos fixos |
| `/api/base-alimentar` | POST | Adicionar alimento fixo |
| `/api/base-alimentar` | DELETE | Remover alimento fixo |
| `/api/combos` | GET | Listar combos com ingredientes |
| `/api/combos` | POST | Criar combo/receita |
| `/api/combos` | PUT | Editar combo existente |
| `/api/combos` | DELETE | Excluir combo |
| `/api/dashboard` | GET | Dados do dashboard |
| `/api/dieta` | GET | Gerar plano alimentar |
| `/api/dieta` | POST | Aplicar plano no diario |
| `/api/exercicios` | GET | Buscar exercicios ou entradas |
| `/api/exercicios` | POST | Registrar exercicio |
| `/api/exercicios/[id]` | DELETE | Excluir entrada de exercicio |
| `/api/perfil` | GET | Obter perfil do usuario |
| `/api/perfil` | POST | Criar perfil |
| `/api/perfil` | PUT | Atualizar perfil |
| `/api/peso` | GET | Listar logs de peso |
| `/api/peso` | POST | Registrar pesagem |
| `/api/peso/[id]` | DELETE | Excluir log de peso |
| `/api/projecao` | GET | Projecao de peso |
| `/api/refeicoes` | GET | Listar refeicoes por data |
| `/api/refeicoes` | POST | Adicionar refeicao |
| `/api/refeicoes/[id]` | DELETE | Excluir entrada de refeicao |
| `/api/streak` | GET | Info de streak |

---

## Endpoints em Detalhe

### Alimentos

#### `GET /api/alimentos`

Busca alimentos no catalogo. Opcionalmente retorna os mais recentes do usuario primeiro.

**Query params:**

| Param | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `q` | string | nao | Termo de busca (case-insensitive, busca parcial no nome) |
| `category` | string | nao | Filtrar por categoria |
| `limit` | number | nao | Maximo de resultados (default: 20) |
| `recent` | string | nao | userId — se informado, retorna os 5 alimentos mais consumidos nos ultimos 7 dias no topo |

**Resposta (200):**
```json
[
  {
    "id": "cuid...",
    "name": "Arroz branco cozido",
    "brand": null,
    "category": "graos",
    "servingSize": 100,
    "servingLabel": "100g",
    "calories": 128,
    "protein": 2.5,
    "carbs": 28.1,
    "fat": 0.2,
    "saturatedFat": 0,
    "transFat": 0,
    "fiber": 1.6,
    "sugar": 0,
    "sodium": 1,
    "noomColor": "yellow",
    "isCustom": false,
    "isCombo": false,
    "isRecent": true
  }
]
```

Os itens recentes vem primeiro com `isRecent: true`. Os demais resultados excluem duplicatas dos recentes.

**Erros:** `500` — erro interno

---

#### `POST /api/alimentos`

Cria um alimento customizado. A cor Noom eh calculada automaticamente pela densidade calorica.

**Body (JSON):**

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `name` | string | sim | Nome do alimento |
| `brand` | string | nao | Marca |
| `category` | string | sim | Categoria valida |
| `servingSize` | number | sim | Tamanho da porcao em gramas |
| `servingLabel` | string | nao | Descricao da porcao (default: "{servingSize}g") |
| `calories` | number | sim | Calorias por porcao |
| `protein` | number | nao | Proteina em gramas (default: 0) |
| `carbs` | number | nao | Carboidratos em gramas (default: 0) |
| `fat` | number | nao | Gordura em gramas (default: 0) |
| `fiber` | number | nao | Fibra em gramas (default: 0) |
| `sugar` | number | nao | Acucar em gramas (default: 0) |
| `sodium` | number | nao | Sodio em mg (default: 0) |

**Resposta (201):** Objeto Food criado (com `isCustom: true` e `noomColor` calculado)

**Erros:**
- `400` — campos obrigatorios ausentes
- `500` — erro interno

---

### Base Alimentar

#### `GET /api/base-alimentar`

Lista os alimentos fixos (base alimentar) do usuario. Usados como preferencias para geracao automatica de dieta.

**Query params:** Nenhum (userId resolvido automaticamente)

**Resposta (200):**
```json
[
  {
    "id": "cuid...",
    "userId": "cuid...",
    "foodId": "cuid...",
    "mealType": "cafe_da_manha",
    "servings": 1,
    "createdAt": "2026-03-31T...",
    "food": {
      "id": "cuid...",
      "name": "Ovo cozido",
      "calories": 72,
      "...": "..."
    }
  }
]
```

**Erros:**
- `404` — nenhum usuario cadastrado
- `500` — erro interno

---

#### `POST /api/base-alimentar`

Adiciona um alimento a base alimentar do usuario.

**Body (JSON):**

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `foodId` | string | sim | ID do alimento |
| `mealType` | string | sim | `cafe_da_manha`, `almoco`, `jantar`, `lanche` ou `qualquer` |
| `servings` | number | nao | Porcoes (default: 1) |

**Resposta (201):** Objeto FixedFood criado (com food incluso)

**Erros:**
- `400` — parametros ausentes ou mealType invalido
- `404` — usuario ou alimento nao encontrado
- `500` — erro interno

---

#### `DELETE /api/base-alimentar?id={id}`

Remove um alimento fixo da base alimentar.

**Query params:**

| Param | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `id` | string | sim | ID do FixedFood |

**Resposta (200):** `{ "success": true }`

**Erros:**
- `400` — id ausente
- `404` — usuario nao cadastrado
- `500` — erro interno

---

### Combos

#### `GET /api/combos`

Lista todos os combos/receitas com detalhes dos ingredientes.

**Query params:** Nenhum

**Resposta (200):**
```json
[
  {
    "id": "cuid...",
    "name": "Marmita fitness",
    "calories": 450.5,
    "protein": 35.2,
    "carbs": 48.1,
    "fat": 12.3,
    "fiber": 5.0,
    "sodium": 320,
    "noomColor": "yellow",
    "servingSize": 1,
    "servingLabel": "1 combo",
    "createdAt": "2026-03-31T...",
    "items": [
      {
        "id": "cuid...",
        "foodId": "cuid...",
        "foodName": "Arroz branco cozido",
        "quantity": 150,
        "unit": "g",
        "servings": 1.5,
        "calories": 192,
        "protein": 3.75,
        "carbs": 42.15,
        "fat": 0.3
      }
    ]
  }
]
```

**Erros:** `500` — erro interno

---

#### `POST /api/combos`

Cria um novo combo/receita. Calcula automaticamente os valores nutricionais totais e a cor Noom.

**Body (JSON):**

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `name` | string | sim | Nome do combo |
| `items` | array | sim | Lista de ingredientes (minimo 1) |
| `items[].foodId` | string | sim | ID do alimento ingrediente |
| `items[].quantity` | number | sim | Quantidade |
| `items[].unit` | string | sim | Unidade: `g`, `unidade`, `pitada`, `colher` |
| `items[].servings` | number | sim | Porcoes do ingrediente |

**Resposta (201):** Combo criado com items e detalhes nutricionais

**Erros:**
- `400` — nome ou items ausentes
- `500` — erro interno

---

#### `PUT /api/combos`

Edita um combo existente. Remove todos os items antigos e recria com os novos. Recalcula valores nutricionais.

**Body (JSON):**

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `id` | string | sim | ID do combo |
| `name` | string | sim | Nome atualizado |
| `items` | array | sim | Nova lista de ingredientes |

(items segue o mesmo formato do POST)

**Resposta (200):** Combo atualizado

**Erros:**
- `400` — id, nome ou items ausentes
- `404` — combo nao encontrado
- `500` — erro interno

---

#### `DELETE /api/combos?id={id}`

Exclui um combo. Remove automaticamente todas as referencias em MealEntry e FixedFood antes de deletar. Os ComboItems sao removidos por cascade.

**Query params:**

| Param | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `id` | string | sim | ID do combo |

**Resposta (200):** `{ "success": true }`

**Erros:**
- `400` — id ausente
- `404` — combo nao encontrado
- `500` — erro interno

---

### Dashboard

#### `GET /api/dashboard`

Retorna todos os dados necessarios para renderizar o dashboard: calorias, macros, refeicoes do dia e streak.

**Query params:**

| Param | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `userId` | string | nao | ID do usuario (resolve automaticamente) |
| `date` | string | nao | Data ISO (default: hoje) |

**Resposta (200):**
```json
{
  "user": { "name": "Joao", "dailyCalTarget": 2200 },
  "date": "2026-03-31",
  "calories": {
    "target": 2200,
    "consumed": 1450,
    "burned": 300,
    "remaining": 1050
  },
  "macros": {
    "protein": 85.5,
    "carbs": 150.2,
    "fat": 42.1,
    "proteinTarget": 138,
    "carbsTarget": 275,
    "fatTarget": 61
  },
  "meals": [
    {
      "type": "cafe_da_manha",
      "label": "Cafe da Manha",
      "totalCalories": 450,
      "itemCount": 3
    }
  ],
  "streak": { "current": 5, "longest": 12 }
}
```

**Distribuicao de macros (padrao):**
- Proteina: 25% das calorias / 4 cal por grama
- Carboidratos: 50% das calorias / 4 cal por grama
- Gordura: 25% das calorias / 9 cal por grama

**Erros:**
- `404` — usuario nao cadastrado/encontrado
- `500` — erro interno

---

### Dieta

#### `GET /api/dieta`

Gera um plano alimentar automatico baseado no perfil, metas e base alimentar do usuario.

**Query params:**

| Param | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `strategy` | string | nao | Estrategia nutricional (default: `equilibrado`) |
| `proteinPerKg` | number | nao | Override: gramas de proteina por kg de peso |
| `carbsGrams` | number | nao | Override: gramas de carboidratos fixas |

**Resposta (200):**
```json
{
  "plan": {
    "meals": [
      {
        "mealType": "cafe_da_manha",
        "items": [
          {
            "foodId": "cuid...",
            "name": "Ovo cozido",
            "servings": 2,
            "calories": 144,
            "protein": 12.4,
            "carbs": 1.4,
            "fat": 10.0
          }
        ]
      }
    ],
    "totals": { "calories": 2180, "protein": 130, "carbs": 260, "fat": 60 }
  },
  "macros": {
    "protein": 130,
    "carbs": 260,
    "fat": 60
  },
  "user": {
    "name": "Joao",
    "weight": 80,
    "height": 175,
    "age": 30,
    "activityLevel": "moderado",
    "goal": "perder",
    "dailyCalTarget": 2200,
    "tdee": 2700
  }
}
```

**Comportamento:**
- Utiliza a base alimentar (FixedFood) do usuario como ponto de partida
- Alimentos fixos com mealType `qualquer` podem ser alocados em qualquer refeicao
- Preenche o restante com alimentos do catalogo para atingir as metas de macros
- Apenas alimentos nao-custom sao usados no preenchimento automatico

**Erros:**
- `400` — nenhum alimento cadastrado no banco
- `404` — usuario nao encontrado
- `500` — erro interno

---

#### `POST /api/dieta`

Aplica um plano de dieta gerado ao diario do usuario, criando MealEntries em lote.

**Body (JSON):**

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `date` | string | sim | Data ISO para aplicar o plano |
| `meals` | array | sim | Array de refeicoes do plano |
| `meals[].mealType` | string | sim | Tipo da refeicao |
| `meals[].items` | array | sim | Itens da refeicao |
| `meals[].items[].foodId` | string | sim | ID do alimento |
| `meals[].items[].servings` | number | sim | Porcoes |
| `meals[].items[].calories` | number | sim | Calorias |
| `meals[].items[].protein` | number | sim | Proteina |
| `meals[].items[].carbs` | number | sim | Carboidratos |
| `meals[].items[].fat` | number | sim | Gordura |

**Resposta (200):**
```json
{ "success": true, "entriesCreated": 12 }
```

**Efeitos colaterais:**
- Cria MealEntries em lote via `createMany`
- Recalcula o DailyLog (caloriesConsumed + macros)
- Atualiza o Streak

**Erros:**
- `400` — date ou meals ausentes
- `404` — usuario nao encontrado
- `500` — erro interno

---

### Exercicios

#### `GET /api/exercicios`

Funciona em dois modos: busca de exercicios no catalogo OU listagem de entradas por data.

**Modo 1 — Busca no catalogo:**

| Param | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `search` | string | sim (para este modo) | Termo de busca (string vazia retorna todos, max 20) |

**Resposta (200):**
```json
[
  {
    "id": "cuid...",
    "name": "Corrida",
    "category": "cardio",
    "caloriesPerMinBase": 10.5,
    "icon": "...",
    "createdAt": "..."
  }
]
```

**Modo 2 — Entradas por data:**

| Param | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `date` | string | sim (para este modo) | Data ISO |
| `userId` | string | nao | ID do usuario (resolve automaticamente) |

**Resposta (200):**
```json
{
  "entries": [
    {
      "id": "cuid...",
      "userId": "cuid...",
      "exerciseId": "cuid...",
      "date": "2026-03-31",
      "durationMin": 30,
      "caloriesBurned": 315,
      "exercise": { "name": "Corrida", "category": "cardio", "..." : "..." }
    }
  ],
  "totalBurned": 315
}
```

**Erros:**
- `400` — nem `search` nem `date` informados
- `404` — usuario nao cadastrado
- `500` — erro interno

---

#### `POST /api/exercicios`

Registra um exercicio realizado. Calcula calorias queimadas ajustadas pelo peso do usuario.

**Body (JSON):**

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `userId` | string | nao | ID do usuario (resolve automaticamente) |
| `exerciseId` | string | sim | ID do exercicio |
| `date` | string | sim | Data ISO |
| `durationMin` | number | sim | Duracao em minutos |

**Formula de calculo:**
```
caloriesBurned = exercise.caloriesPerMinBase * (user.weight / 70) * durationMin
```

**Resposta (201):** ExerciseEntry criado (com exercise incluso)

**Efeitos colaterais:**
- Recalcula `DailyLog.caloriesBurned` para o usuario+data

**Erros:**
- `400` — dados invalidos
- `404` — usuario ou exercicio nao encontrado
- `500` — erro interno

---

#### `DELETE /api/exercicios/{id}`

Exclui uma entrada de exercicio e recalcula o DailyLog.

**Path params:**

| Param | Tipo | Descricao |
|-------|------|-----------|
| `id` | string | ID da ExerciseEntry |

**Resposta (200):** `{ "success": true }`

**Efeitos colaterais:**
- Recalcula `DailyLog.caloriesBurned` para o usuario+data da entrada removida

**Erros:**
- `404` — entrada nao encontrada
- `500` — erro interno

---

### Perfil

#### `GET /api/perfil`

Retorna o perfil do usuario com metricas calculadas (BMR, TDEE, meta calorica).

**Query params:** Nenhum

**Resposta (200):**
```json
{
  "id": "cuid...",
  "name": "Joao",
  "gender": "masculino",
  "birthDate": "1996-05-15T00:00:00.000Z",
  "height": 175,
  "weight": 80,
  "bodyFatPercent": null,
  "activityLevel": "moderado",
  "goal": "perder",
  "goalKgPerWeek": 0.5,
  "dailyCalTarget": 2200,
  "bmr": 1800,
  "tdee": 2790,
  "dailyTarget": 2200,
  "age": 30
}
```

Os campos adicionais (`bmr`, `tdee`, `dailyTarget`, `age`) sao calculados em tempo real via `calculateAllMetrics`.

**Erros:**
- `404` — perfil nao encontrado
- `500` — erro interno

---

#### `POST /api/perfil`

Cria o perfil do usuario (apenas se nao existir). Tambem cria o registro de Streak inicial.

**Body (JSON):**

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `name` | string | sim | Nome |
| `gender` | string | sim | `masculino` ou `feminino` |
| `birthDate` | string | sim | Data de nascimento ISO |
| `height` | number | sim | Altura em cm |
| `weight` | number | sim | Peso em kg |
| `bodyFatPercent` | number | nao | % gordura corporal |
| `activityLevel` | string | sim | Nivel de atividade |
| `goal` | string | sim | `perder`, `manter` ou `ganhar` |
| `goalKgPerWeek` | number | sim | Ritmo em kg/semana |

**Resposta (201):** Perfil criado + metricas calculadas

**Efeitos colaterais:**
- Cria registro de `Streak` com currentStreak=0

**Erros:**
- `400` — dados invalidos (validacao Zod)
- `409` — perfil ja existe (usar PUT para atualizar)
- `500` — erro interno

---

#### `PUT /api/perfil`

Atualiza o perfil do usuario. Recalcula `dailyCalTarget` automaticamente.

**Body (JSON):** Mesmo formato do POST

**Resposta (200):** Perfil atualizado + metricas recalculadas

**Erros:**
- `400` — dados invalidos
- `404` — perfil nao encontrado
- `500` — erro interno

---

### Peso

#### `GET /api/peso`

Retorna historico de pesagens ordenado por data decrescente.

**Query params:**

| Param | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `limit` | number | nao | Maximo de registros (default: 30, max: 365) |

**Resposta (200):**
```json
[
  {
    "id": "cuid...",
    "userId": "cuid...",
    "date": "2026-03-31",
    "weight": 79.5,
    "bodyFatPercent": null,
    "note": "Apos treino",
    "createdAt": "..."
  }
]
```

**Erros:**
- `404` — perfil nao encontrado
- `500` — erro interno

---

#### `POST /api/peso`

Registra uma pesagem. Faz upsert (atualiza se ja existe registro para a mesma data).

**Body (JSON):**

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `date` | string | sim | Data ISO |
| `weight` | number | sim | Peso em kg |
| `bodyFatPercent` | number | nao | % gordura corporal |
| `note` | string | nao | Observacao |

**Resposta (201):** WeightLog criado/atualizado

**Efeitos colaterais:**
- Atualiza `User.weight` com o novo valor
- Atualiza `User.bodyFatPercent` se informado

**Erros:**
- `400` — dados invalidos
- `404` — perfil nao encontrado
- `500` — erro interno

---

#### `DELETE /api/peso/{id}`

Exclui um registro de pesagem.

**Path params:**

| Param | Tipo | Descricao |
|-------|------|-----------|
| `id` | string | ID do WeightLog |

**Resposta (200):** `{ "success": true }`

**Erros:**
- `404` — registro nao encontrado
- `500` — erro interno

---

### Projecao

#### `GET /api/projecao`

Calcula projecao de peso baseada na meta e no consumo real dos ultimos 7 dias.

**Query params:**

| Param | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `userId` | string | nao | ID do usuario (resolve automaticamente) |
| `weeks` | number | nao | Semanas para projetar (default: 12, min: 1, max: 52) |

**Resposta (200):**
```json
{
  "user": {
    "currentWeight": 80,
    "goalWeight": 74,
    "tdee": 2790,
    "dailyCalTarget": 2200
  },
  "basedOnTarget": {
    "weeklyData": [
      { "week": 1, "weight": 79.5 },
      { "week": 2, "weight": 79.0 }
    ]
  },
  "basedOnActual": {
    "weeklyData": [
      { "week": 1, "weight": 79.7 },
      { "week": 2, "weight": 79.3 }
    ]
  },
  "avgDailyConsumed": 2100,
  "avgDailyBurned": 200,
  "insight": "Com base no seu consumo real, voce deve perder 0.4kg por semana. Para atingir 74.0kg, serao necessarias aproximadamente 15 semanas."
}
```

**Comportamento:**
- `basedOnTarget` — projecao se o usuario seguir a meta calorica exatamente
- `basedOnActual` — projecao baseada na media real dos ultimos 7 dias (null se nao houver dados)
- `goalWeight` — calculado como `weight +/- goalKgPerWeek * weeks` (null se goal == manter)
- `insight` — texto em pt-BR com resumo e estimativa de tempo para atingir a meta

**Erros:**
- `404` — usuario nao encontrado
- `500` — erro interno

---

### Refeicoes

#### `GET /api/refeicoes`

Retorna as refeicoes de um usuario em uma data, agrupadas por tipo de refeicao.

**Query params:**

| Param | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `date` | string | sim | Data ISO (ex: "2026-03-31") |
| `userId` | string | nao | ID do usuario (resolve automaticamente) |

**Resposta (200):**
```json
{
  "meals": [
    {
      "type": "cafe_da_manha",
      "label": "Cafe da Manha",
      "totalCalories": 450,
      "items": [
        {
          "id": "cuid...",
          "userId": "cuid...",
          "foodId": "cuid...",
          "date": "2026-03-31",
          "mealType": "cafe_da_manha",
          "servings": 2,
          "calories": 144,
          "protein": 12.4,
          "carbs": 1.4,
          "fat": 10.0,
          "food": { "name": "Ovo cozido", "..." : "..." }
        }
      ]
    }
  ],
  "totals": {
    "calories": 1850,
    "protein": 120.5,
    "carbs": 200.3,
    "fat": 55.2
  }
}
```

As refeicoes sao sempre retornadas na ordem: cafe_da_manha, almoco, jantar, lanche (mesmo que vazias).

**Erros:**
- `400` — parametro `date` ausente
- `404` — usuario nao cadastrado
- `500` — erro interno

---

#### `POST /api/refeicoes`

Adiciona uma entrada de refeicao. Possui deteccao inteligente de alimentos similares ja registrados na mesma refeicao.

**Body (JSON):**

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `userId` | string | nao | ID do usuario (resolve automaticamente) |
| `foodId` | string | sim | ID do alimento |
| `date` | string | sim | Data ISO |
| `mealType` | string | sim | `cafe_da_manha`, `almoco`, `jantar` ou `lanche` |
| `servings` | number | sim | Numero de porcoes |
| `skipDuplicateCheck` | boolean | nao | Pular verificacao de similares (default: false) |

**Resposta (201):** MealEntry criado (com food incluso)

**Resposta especial (409) — Alimento similar detectado:**
```json
{
  "error": "similar_food",
  "message": "Ja existe \"Feijao preto cozido\" nessa refeicao. Deseja adicionar \"Feijao carioca cozido\" tambem?",
  "existingFood": "Feijao preto cozido",
  "newFood": "Feijao carioca cozido"
}
```

A deteccao de similares reconhece tipos base como: feijao, arroz, carne, frango, peixe, ovo, leite, pao, queijo, banana, batata, macarrao e iogurte. Para confirmar, reenvie a requisicao com `skipDuplicateCheck: true`.

**Efeitos colaterais:**
- Recalcula DailyLog (caloriesConsumed + macros)
- Atualiza Streak

**Erros:**
- `400` — dados invalidos
- `404` — usuario ou alimento nao encontrado
- `409` — alimento similar detectado (requer confirmacao)
- `500` — erro interno

---

#### `DELETE /api/refeicoes/{id}`

Exclui uma entrada de refeicao e recalcula o DailyLog.

**Path params:**

| Param | Tipo | Descricao |
|-------|------|-----------|
| `id` | string | ID da MealEntry |

**Resposta (200):** `{ "success": true }`

**Efeitos colaterais:**
- Recalcula DailyLog (caloriesConsumed + macros) para o usuario+data da entrada removida

**Erros:**
- `404` — entrada nao encontrada
- `500` — erro interno

---

### Streak

#### `GET /api/streak`

Retorna informacoes da sequencia de dias consecutivos com registro.

**Query params:**

| Param | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `userId` | string | nao | ID do usuario (resolve automaticamente) |

**Resposta (200):**
```json
{
  "current": 5,
  "longest": 12,
  "lastLogDate": "2026-03-31"
}
```

Se o usuario nao tiver registro de streak, retorna zeros:
```json
{ "current": 0, "longest": 0, "lastLogDate": null }
```

**Erros:**
- `404` — usuario nao cadastrado
- `500` — erro interno

---

## Padroes Gerais

### Resolucao de Usuario
Todos os endpoints que recebem `userId` opcionalmente utilizam `getDefaultUserId()` como fallback, que retorna o primeiro usuario cadastrado (`User.findFirst({ orderBy: { createdAt: 'desc' } })`).

### Recalculo Automatico
- **DailyLog** eh recalculado sempre que MealEntry ou ExerciseEntry sao criados/removidos
- **Streak** eh atualizado ao criar MealEntry ou aplicar dieta
- **User.weight** eh atualizado ao registrar pesagem

### Validacao
Os endpoints de criacao/atualizacao utilizam schemas **Zod** para validacao (`mealEntrySchema`, `exerciseEntrySchema`, `weightLogSchema`, `userProfileSchema`). Erros de validacao retornam status `400` com detalhes no campo `details`.

### Formato de Data
Todas as datas sao armazenadas como strings ISO (`"2026-03-31"`), nao como DateTime. Isso simplifica comparacoes e evita problemas de timezone.

### Codigos de Erro Comuns

| Codigo | Descricao |
|--------|-----------|
| `400` | Dados invalidos ou parametros obrigatorios ausentes |
| `404` | Recurso nao encontrado (usuario, alimento, entrada, etc.) |
| `409` | Conflito (perfil ja existe, alimento similar detectado) |
| `500` | Erro interno do servidor |
