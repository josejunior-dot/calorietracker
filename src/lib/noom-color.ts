export type NoomColor = 'green' | 'yellow' | 'orange'

export function getNoomColor(calories: number, servingSizeGrams: number): NoomColor {
  if (servingSizeGrams <= 0) return 'green'

  const density = calories / servingSizeGrams

  if (density < 1.0) return 'green'
  if (density <= 2.4) return 'yellow'
  return 'orange'
}

export function getNoomColorHex(color: NoomColor): string {
  const map: Record<NoomColor, string> = {
    green: '#22c55e',
    yellow: '#eab308',
    orange: '#f97316',
  }
  return map[color]
}

export function getNoomColorLabel(color: NoomColor): string {
  const map: Record<NoomColor, string> = {
    green: 'Baixa densidade',
    yellow: 'Média densidade',
    orange: 'Alta densidade',
  }
  return map[color]
}

export function getNoomColorBg(color: NoomColor): string {
  const map: Record<NoomColor, string> = {
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
    orange: 'bg-orange-100',
  }
  return map[color]
}

export function getNoomColorText(color: NoomColor): string {
  const map: Record<NoomColor, string> = {
    green: 'text-green-700',
    yellow: 'text-yellow-700',
    orange: 'text-orange-700',
  }
  return map[color]
}
