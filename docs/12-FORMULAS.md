# CalorieTracker - Formulas e Algoritmos

**1. BMR — Taxa Metabolica Basal**

Mifflin-St Jeor (padrao):
- Homem: BMR = 10 x peso(kg) + 6.25 x altura(cm) - 5 x idade(anos) + 5
- Mulher: BMR = 10 x peso(kg) + 6.25 x altura(cm) - 5 x idade(anos) - 161

Katch-McArdle (quando %gordura disponivel):
- Massa magra = peso x (1 - gordura/100)
- BMR = 370 + 21.6 x massa_magra

**2. TDEE — Gasto Energetico Total**
TDEE = BMR x fator_atividade
| Nivel | Fator |
|-------|-------|
| Sedentario | 1.2 |
| Leve | 1.375 |
| Moderado | 1.55 |
| Ativo | 1.725 |
| Muito ativo | 1.9 |

**3. Meta Calorica Diaria**
meta = TDEE + (meta_kg_semana x 7700 / 7)
- Perder peso: meta_kg_semana negativo -> deficit
- Ganhar peso: meta_kg_semana positivo -> superavit
- 7700 kcal ~ 1 kg de gordura

**4. Sistema Noom Color (Densidade Calorica)**
densidade = calorias / peso_gramas
- Green (baixa): < 1.0 kcal/g
- Yellow (media): 1.0 - 2.4 kcal/g
- Orange (alta): > 2.4 kcal/g

**5. Calorias de Exercicio**
cal_queimadas = caloriesPerMinBase x (peso_usuario / 70) x duracao_min
- Base calibrada para 70kg

**6. Projecao de Peso**
Para cada semana i:
- deficit_semanal = (TDEE - meta_calorica) x 7
- perda_semanal = deficit_semanal / 7700
- peso[i] = peso[i-1] - perda_semanal

**7. Deteccao de Alimentos Similares**
- Normalizar nome: lowercase + remover acentos (NFD)
- Mapear para "tipo base" via keywords (feijao, arroz, carne, etc.)
- Se novo alimento tem mesmo tipo base de existente na refeicao -> alerta 409

**8. Calculo de Servings em Combos**
- g/ml: servings = quantidade / servingSize
- unidade/fatia/scoop: servings = quantidade
- colher: servings = (quantidade x 15) / servingSize
- pitada: servings = 0
