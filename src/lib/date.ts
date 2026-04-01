// Format date to pt-BR display: "31 de março de 2026"
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : date
  return d.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Format date short: "31/03/2026"
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : date
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Format weekday: "Segunda-feira"
export function formatWeekday(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : date
  const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' })
  return weekday.charAt(0).toUpperCase() + weekday.slice(1)
}

// Convert Date to ISO date string: "2026-03-31"
export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Parse ISO date string to Date
export function fromISODate(isoDate: string): Date {
  return new Date(isoDate + 'T12:00:00')
}

// Add days to an ISO date string
export function addDays(isoDate: string, days: number): string {
  const d = fromISODate(isoDate)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

// Check if ISO date string is today
export function isToday(isoDate: string): boolean {
  return isoDate === toISODate(new Date())
}

// Get greeting based on current hour
export function getGreeting(): string {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) return 'Bom dia'
  if (hour >= 12 && hour < 18) return 'Boa tarde'
  return 'Boa noite'
}
