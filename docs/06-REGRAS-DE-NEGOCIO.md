# CalorieTracker - Regras de Negocio

## Formulas de Calculo

### BMR (Taxa Metabolica Basal)

O CalorieTracker suporta duas formulas para calcular a taxa metabolica basal:

#### Mifflin-St Jeor (padrao)

Usada quando o percentual de gordura corporal (`bodyFat`) **nao esta disponivel**.

```
Homem:  BMR = 10 * peso(kg) + 6.25 * altura(cm) - 5 * idade(anos) + 5
Mulher: BMR = 10 * peso(kg) + 6.25 * altura(cm) - 5 * idade(anos) - 161
```

#### Katch-McArdle (quando bodyFat disponivel)

Quando o usuario informa seu percentual de gordura corporal, o sistema usa a formula Katch-McArdle, que e mais precisa por considerar a massa magra:

```
massa_magra = peso * (1 - bodyFat / 100)
BMR = 370 + 21.6 * massa_magra
```

### TDEE (Gasto Energetico Total Diario)

O TDEE e calculado multiplicando o BMR pelo fator de atividade fisica do usuario:

| Nivel de Atividade | Fator | Descricao |
|---|---|---|
| Sedentario | 1.2 | Pouco ou nenhum exercicio |
| Levemente ativo | 1.375 | Exercicio leve 1-3 dias/semana |
| Moderadamente ativo | 1.55 | Exercicio moderado 3-5 dias/semana |
| Ativo | 1.725 | Exercicio intenso 6-7 dias/semana |
| Muito ativo | 1.9 | Exercicio muito intenso ou trabalho fisico |

### Meta Calorica Diaria

A meta calorica e derivada do TDEE ajustada pelo objetivo de peso do usuario:

```
meta_calorica = TDEE + (objetivo_kg_por_semana * 7700 / 7)
```

Onde:

- **7700** = calorias aproximadas em 1 kg de gordura corporal
- `objetivo_kg_por_semana` e **negativo** para perda de peso (ex: -0.5 = perder 0.5 kg/semana)
- `objetivo_kg_por_semana` e **positivo** para ganho de peso (ex: +0.3 = ganhar 0.3 kg/semana)

**Exemplo:** Usuario com TDEE de 2200 kcal querendo perder 0.5 kg/semana:

```
meta = 2200 + (-0.5 * 7700 / 7) = 2200 - 550 = 1650 kcal/dia
```

---

## Sistema Noom Color (Densidade Calorica)

Cada alimento recebe uma classificacao por cor baseada na sua **densidade calorica** (kcal por grama):

| Cor | Densidade | Significado | Exemplos |
|---|---|---|---|
| **Green** (Verde) | < 1.0 kcal/g | Baixa densidade calorica | Frutas, vegetais, sopas, iogurte natural |
| **Yellow** (Amarelo) | 1.0 - 2.4 kcal/g | Media densidade calorica | Arroz, feijao, carnes magras, pao integral |
| **Orange** (Laranja) | > 2.4 kcal/g | Alta densidade calorica | Castanhas, queijos, chocolate, oleos |

### Calculo da densidade

```
densidade = calorias_totais / peso_em_gramas
```

A cor e atribuida automaticamente ao cadastrar ou importar um alimento, e exibida na interface para orientar escolhas alimentares.

---

## Deteccao de Alimentos Similares

### Problema

Evitar duplicacoes acidentais na mesma refeicao (ex: usuario adiciona "Arroz branco" e depois "Arroz integral" sem perceber que ja tem arroz).

### Mecanismo

Ao adicionar uma refeicao via API, o sistema verifica se ja existe um alimento do mesmo **tipo base** registrado na mesma refeicao.

### Tipos Base Reconhecidos

```
feijao, arroz, carne, frango, peixe, ovo, leite, pao, queijo, banana, batata, macarrao, iogurte
```

### Fluxo de Deteccao

1. O nome do alimento e **normalizado** (remocao de acentos, conversao para minusculas)
2. O sistema extrai o **tipo base** via correspondencia de keywords
3. Busca na refeicao atual por outros alimentos com o mesmo tipo base
4. Se encontrar: retorna **HTTP 409 Conflict** com mensagem descritiva

### Comportamento no Frontend

Ao receber 409, o frontend exibe um dialogo de confirmacao:

> "Voce ja tem [alimento existente] nesta refeicao. Deseja adicionar [novo alimento] mesmo assim?"

Se o usuario confirmar, a requisicao e reenviada com flag de forca (`force: true`).

---

## Combos e Receitas

### Estrutura

Um combo/receita e um **Food** com flags especiais:

| Campo | Valor |
|---|---|
| `isCombo` | `true` |
| `isCustom` | `true` |

### Ingredientes

Os ingredientes sao armazenados na tabela **ComboItem**, que referencia:

- O Food principal (combo)
- O Food ingrediente
- Quantidade (`quantity`)
- Unidade (`unit`)
- Porcoes (`servings`)

### Calculo Nutricional

A nutricao total do combo e **recalculada a partir dos ingredientes**:

```
calorias_combo = SUM(calorias_ingrediente * quantidade_ingrediente / porcao_padrao)
```

O mesmo se aplica para proteina, carboidrato e gordura.

### Exclusao de Combo

A exclusao segue uma ordem especifica para manter integridade referencial:

1. Remove referencias em **MealEntry** (registros de refeicao que usam o combo)
2. Remove registros em **FixedFood** (base alimentar que usa o combo)
3. Remove os **ComboItem** (ingredientes)
4. Remove o **Food** (combo em si)

---

## Dieta Automatica

### Motor de Montagem

O sistema gera planos alimentares automaticos usando uma abordagem **macro-first** com orcamento calorico rigido.

### Estrategias Disponiveis

| Estrategia | Descricao | Distribuicao tipica |
|---|---|---|
| **Equilibrada** | Distribuicao balanceada de macros | ~50% carb, ~25% prot, ~25% gordura |
| **Low-carb** | Reducao de carboidratos | ~20% carb, ~35% prot, ~45% gordura |
| **High-protein** | Priorizacao de proteina | ~35% carb, ~40% prot, ~25% gordura |

### Base Alimentar

A dieta automatica utiliza os **alimentos fixos do usuario** (tabela FixedFood) como catalogo de opcoes. Isso garante que o plano gerado contenha apenas alimentos que o usuario ja consome ou tem disponivel.

### Adequacao por Refeicao

O motor distribui os alimentos respeitando a adequacao de cada tipo de refeicao:

| Refeicao | Criterios |
|---|---|
| **Cafe da manha** | Alimentos tipicos de manha (paes, frutas, laticinios, ovos) |
| **Almoco** | Refeicao principal (arroz, feijao, carnes, saladas) |
| **Jantar** | Similar ao almoco, porcoes potencialmente menores |
| **Lanche** | Opcoes leves (frutas, iogurte, castanhas, barras) |

### Orcamento Calorico

O motor respeita rigorosamente a meta calorica diaria, distribuindo o total entre as refeicoes e garantindo que a soma final fique dentro da margem de tolerancia.

---

## Sistema de Streak

### Definicao

O streak conta **dias consecutivos** em que o usuario registrou pelo menos uma refeicao.

### Regras

- Um dia "conta" quando existe ao menos um **MealEntry** com data daquele dia
- O streak e **atualizado automaticamente** sempre que um novo MealEntry e criado
- O sistema mantem dois contadores:
  - `currentStreak` — sequencia atual de dias consecutivos
  - `longestStreak` — maior sequencia ja alcancada (recorde)

### Comportamento

| Situacao | Resultado |
|---|---|
| Usuario registra refeicao hoje (dia seguinte ao ultimo registro) | `currentStreak` incrementa |
| Usuario registra refeicao hoje (mesmo dia do ultimo registro) | Sem alteracao |
| Usuario pula um dia | `currentStreak` reseta para 1 (se registrar no dia seguinte) |
| `currentStreak` supera `longestStreak` | `longestStreak` e atualizado |

---

## DailyLog (Resumo Diario)

### Recalculo Automatico

O DailyLog e o registro consolidado de um dia e e **recalculado automaticamente** sempre que uma **MealEntry** ou **ExerciseEntry** e criada, editada ou removida.

### Campos Agregados

| Campo | Origem | Calculo |
|---|---|---|
| `caloriesConsumed` | MealEntry | Soma de calorias de todas as refeicoes do dia |
| `caloriesBurned` | ExerciseEntry | Soma de calorias queimadas em exercicios do dia |
| `protein` | MealEntry | Soma de proteina (g) de todas as refeicoes do dia |
| `carbs` | MealEntry | Soma de carboidratos (g) de todas as refeicoes do dia |
| `fat` | MealEntry | Soma de gordura (g) de todas as refeicoes do dia |

### Balanco Calorico

O balanco calorico diario pode ser derivado:

```
balanco = caloriesConsumed - caloriesBurned
deficit_ou_superavit = meta_calorica - balanco
```

### Triggers de Recalculo

O DailyLog e recalculado nos seguintes eventos:

- Adicionar MealEntry
- Editar MealEntry (alterar alimento, quantidade ou refeicao)
- Remover MealEntry
- Adicionar ExerciseEntry
- Editar ExerciseEntry
- Remover ExerciseEntry

O recalculo e feito no **mesmo request** da operacao que o disparou, garantindo consistencia imediata.
