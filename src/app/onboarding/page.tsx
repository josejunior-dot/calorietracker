'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  User,
  Users,
  Ruler,
  Weight,
  Calendar,
  ChevronRight,
  ChevronLeft,
  ArrowDown,
  Minus,
  ArrowUp,
  Sofa,
  Footprints,
  Bike,
  Dumbbell,
  Flame,
  Check,
  HelpCircle,
  Loader2,
  Sparkles,
  Target,
  Activity,
} from 'lucide-react'
import { ACTIVITY_LEVELS, GOALS } from '@/lib/constants'
import { calculateAllMetrics } from '@/lib/bmr'

const ACTIVITY_ICONS = [Sofa, Footprints, Bike, Dumbbell, Flame]

const GOAL_ICONS: Record<string, typeof ArrowDown> = {
  perder: ArrowDown,
  manter: Minus,
  ganhar: ArrowUp,
}

const GOAL_COLORS: Record<string, { bg: string; border: string; text: string; ring: string }> = {
  perder: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', ring: 'ring-blue-400' },
  manter: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', ring: 'ring-green-400' },
  ganhar: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', ring: 'ring-orange-400' },
}

const PACE_OPTIONS = [0.25, 0.5, 0.75, 1.0]

const PACE_LABELS: Record<number, string> = {
  0.25: 'Leve',
  0.5: 'Moderado',
  0.75: 'Acelerado',
  1.0: 'Intenso',
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showBodyFatHelp, setShowBodyFatHelp] = useState(false)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')

  const [form, setForm] = useState({
    name: '',
    gender: '',
    birthDate: '',
    height: 170,
    weight: 70,
    bodyFatPercent: undefined as number | undefined,
    activityLevel: '',
    goal: '',
    goalKgPerWeek: 0.5,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateForm = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const metrics = useMemo(() => {
    if (!form.gender || !form.birthDate || !form.activityLevel || !form.goal) return null
    try {
      return calculateAllMetrics({
        weight: form.weight,
        height: form.height,
        birthDate: new Date(form.birthDate),
        gender: form.gender,
        activityLevel: form.activityLevel,
        goal: form.goal,
        goalKgPerWeek: form.goalKgPerWeek,
        bodyFatPercent: form.bodyFatPercent,
      })
    } catch {
      return null
    }
  }, [form])

  const stepValid = useMemo(() => {
    switch (step) {
      case 1:
        return form.name.trim().length >= 2 && form.gender !== ''
      case 2:
        return form.birthDate !== '' && form.height >= 100 && form.weight >= 30
      case 3:
        return form.activityLevel !== ''
      case 4:
        return form.goal !== ''
      case 5:
        return true
      default:
        return false
    }
  }, [step, form])

  const goNext = () => {
    if (!stepValid || step >= 5) return
    setDirection('next')
    setStep((s) => s + 1)
  }

  const goBack = () => {
    if (step <= 1) return
    setDirection('prev')
    setStep((s) => s - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao salvar perfil')
      }
      toast.success('Perfil criado com sucesso!')
      router.push('/inicio')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar perfil'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with step dots */}
      <div className="pt-12 pb-6 px-6">
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-primary'
                  : s < step
                    ? 'w-2 bg-primary/60'
                    : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Passo {step} de 5
        </p>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        <div className="max-w-md mx-auto w-full">
          <div
            key={step}
            className={`${
              direction === 'next' ? 'animate-slide-up' : 'animate-fade-in'
            }`}
          >
            {step === 1 && <Step1 form={form} updateForm={updateForm} />}
            {step === 2 && (
              <Step2
                form={form}
                updateForm={updateForm}
                showBodyFatHelp={showBodyFatHelp}
                setShowBodyFatHelp={setShowBodyFatHelp}
              />
            )}
            {step === 3 && <Step3 form={form} updateForm={updateForm} />}
            {step === 4 && <Step4 form={form} updateForm={updateForm} />}
            {step === 5 && <Step5 form={form} metrics={metrics} />}
          </div>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="px-6 pb-8 pt-4 max-w-md mx-auto w-full">
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={goBack}
              className="flex items-center justify-center gap-1 px-5 py-3.5 rounded-xl
                         bg-card border border-border text-foreground font-medium
                         active:scale-[0.97] transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>
          )}
          {step < 5 ? (
            <button
              onClick={goNext}
              disabled={!stepValid}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
                         bg-primary text-primary-foreground font-semibold text-base
                         disabled:opacity-40 disabled:cursor-not-allowed
                         active:scale-[0.97] transition-all shadow-lg shadow-primary/20"
            >
              Continuar
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
                         bg-primary text-primary-foreground font-semibold text-base
                         disabled:opacity-60
                         active:scale-[0.97] transition-all shadow-lg shadow-primary/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Comecar
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ==================== STEP 1: Dados Basicos ==================== */
function Step1({
  form,
  updateForm,
}: {
  form: { name: string; gender: string }
  updateForm: (key: string, value: any) => void
}) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-accent-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Vamos comecar!</h1>
        <p className="text-muted-foreground">Como podemos te chamar?</p>
      </div>

      {/* Name input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Seu nome</label>
        <input
          type="text"
          placeholder="Digite seu nome"
          value={form.name}
          onChange={(e) => updateForm('name', e.target.value)}
          className="w-full px-4 py-3.5 rounded-xl bg-card border border-border
                     text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-ring
                     text-base transition-all"
          autoFocus
        />
      </div>

      {/* Gender selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Sexo</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'masculino', label: 'Masculino', icon: Users },
            { key: 'feminino', label: 'Feminino', icon: User },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => updateForm('gender', key)}
              className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all
                         active:scale-[0.97] ${
                           form.gender === key
                             ? 'border-primary bg-accent ring-2 ring-primary/20'
                             : 'border-border bg-card hover:border-muted-foreground/30'
                         }`}
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  form.gender === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="w-7 h-7" />
              </div>
              <span
                className={`font-semibold text-base ${
                  form.gender === key ? 'text-primary' : 'text-foreground'
                }`}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ==================== STEP 2: Medidas ==================== */
function Step2({
  form,
  updateForm,
  showBodyFatHelp,
  setShowBodyFatHelp,
}: {
  form: { birthDate: string; height: number; weight: number; bodyFatPercent?: number }
  updateForm: (key: string, value: any) => void
  showBodyFatHelp: boolean
  setShowBodyFatHelp: (v: boolean) => void
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
          <Ruler className="w-8 h-8 text-accent-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Suas medidas</h1>
        <p className="text-muted-foreground">Para calcular suas calorias diarias</p>
      </div>

      {/* Birth date */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          Data de nascimento
        </label>
        <input
          type="date"
          value={form.birthDate}
          onChange={(e) => updateForm('birthDate', e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-3.5 rounded-xl bg-card border border-border
                     text-foreground focus:outline-none focus:ring-2 focus:ring-ring
                     text-base transition-all"
        />
      </div>

      {/* Height */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Ruler className="w-4 h-4 text-muted-foreground" />
          Altura
        </label>
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-foreground">{form.height}</span>
            <span className="text-muted-foreground font-medium">cm</span>
          </div>
          <input
            type="range"
            min={100}
            max={230}
            value={form.height}
            onChange={(e) => updateForm('height', Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer
                       bg-muted accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>100 cm</span>
            <span>230 cm</span>
          </div>
        </div>
      </div>

      {/* Weight */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Weight className="w-4 h-4 text-muted-foreground" />
          Peso
        </label>
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-foreground">{form.weight}</span>
            <span className="text-muted-foreground font-medium">kg</span>
          </div>
          <input
            type="range"
            min={30}
            max={200}
            step={0.5}
            value={form.weight}
            onChange={(e) => updateForm('weight', Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer
                       bg-muted accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>30 kg</span>
            <span>200 kg</span>
          </div>
        </div>
      </div>

      {/* Body fat % (optional) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          Gordura corporal (%)
          <button
            type="button"
            onClick={() => setShowBodyFatHelp(!showBodyFatHelp)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground font-normal ml-auto">Opcional</span>
        </label>
        {showBodyFatHelp && (
          <div className="bg-accent rounded-xl p-3 text-sm text-accent-foreground animate-fade-in">
            Se voce sabe seu percentual de gordura corporal, informe aqui para um calculo mais
            preciso (formula Katch-McArdle). Caso contrario, deixe em branco.
          </div>
        )}
        <input
          type="number"
          placeholder="Ex: 20"
          min={3}
          max={60}
          value={form.bodyFatPercent ?? ''}
          onChange={(e) => {
            const v = e.target.value
            updateForm('bodyFatPercent', v === '' ? undefined : Number(v))
          }}
          className="w-full px-4 py-3.5 rounded-xl bg-card border border-border
                     text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-ring
                     text-base transition-all"
        />
      </div>
    </div>
  )
}

/* ==================== STEP 3: Nivel de Atividade ==================== */
function Step3({
  form,
  updateForm,
}: {
  form: { activityLevel: string }
  updateForm: (key: string, value: any) => void
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-accent-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Nivel de atividade</h1>
        <p className="text-muted-foreground">Como e sua rotina de exercicios?</p>
      </div>

      <div className="space-y-3">
        {ACTIVITY_LEVELS.map((level, idx) => {
          const Icon = ACTIVITY_ICONS[idx]
          const selected = form.activityLevel === level.key
          return (
            <button
              key={level.key}
              onClick={() => updateForm('activityLevel', level.key)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left
                         transition-all active:scale-[0.98] ${
                           selected
                             ? 'border-primary bg-accent ring-2 ring-primary/20'
                             : 'border-border bg-card hover:border-muted-foreground/30'
                         }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  selected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold text-base ${
                    selected ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {level.label}
                </p>
                <p className="text-sm text-muted-foreground">{level.description}</p>
              </div>
              {selected && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ==================== STEP 4: Objetivo ==================== */
function Step4({
  form,
  updateForm,
}: {
  form: { goal: string; goalKgPerWeek: number }
  updateForm: (key: string, value: any) => void
}) {
  const showPace = form.goal === 'perder' || form.goal === 'ganhar'

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-accent-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Qual seu objetivo?</h1>
        <p className="text-muted-foreground">Vamos personalizar seu plano</p>
      </div>

      <div className="space-y-3">
        {GOALS.map((g) => {
          const Icon = GOAL_ICONS[g.key]
          const colors = GOAL_COLORS[g.key]
          const selected = form.goal === g.key
          return (
            <button
              key={g.key}
              onClick={() => updateForm('goal', g.key)}
              className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left
                         transition-all active:scale-[0.98] ${
                           selected
                             ? `${colors.border} ${colors.bg} ring-2 ${colors.ring}`
                             : 'border-border bg-card hover:border-muted-foreground/30'
                         }`}
            >
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  selected ? `${colors.bg} ${colors.text}` : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <p
                  className={`font-semibold text-lg ${
                    selected ? colors.text : 'text-foreground'
                  }`}
                >
                  {g.label}
                </p>
              </div>
              {selected && (
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${colors.text}`}
                  style={{ backgroundColor: 'currentcolor' }}
                >
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Pace selector */}
      {showPace && (
        <div className="space-y-3 animate-slide-up">
          <label className="text-sm font-medium text-foreground">
            Ritmo: {form.goalKgPerWeek} kg por semana
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PACE_OPTIONS.map((pace) => {
              const selected = form.goalKgPerWeek === pace
              return (
                <button
                  key={pace}
                  onClick={() => updateForm('goalKgPerWeek', pace)}
                  className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all
                             active:scale-[0.95] ${
                               selected
                                 ? 'border-primary bg-accent'
                                 : 'border-border bg-card'
                             }`}
                >
                  <span
                    className={`text-lg font-bold ${
                      selected ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {pace}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {PACE_LABELS[pace]}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {form.goal === 'perder'
              ? 'Recomendado: 0.5 kg/semana para resultados sustentaveis'
              : 'Recomendado: 0.25 a 0.5 kg/semana para ganho muscular'}
          </p>
        </div>
      )}
    </div>
  )
}

/* ==================== STEP 5: Resumo ==================== */
function Step5({
  form,
  metrics,
}: {
  form: {
    name: string
    gender: string
    birthDate: string
    height: number
    weight: number
    bodyFatPercent?: number
    activityLevel: string
    goal: string
    goalKgPerWeek: number
  }
  metrics: { bmr: number; tdee: number; dailyTarget: number; age: number } | null
}) {
  const activityLabel =
    ACTIVITY_LEVELS.find((a) => a.key === form.activityLevel)?.label ?? form.activityLevel
  const goalLabel = GOALS.find((g) => g.key === form.goal)?.label ?? form.goal

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-accent-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Tudo pronto!</h1>
        <p className="text-muted-foreground">Confira seus dados antes de comecar</p>
      </div>

      {/* Profile summary card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-bold text-lg text-foreground">{form.name}</p>
              <p className="text-sm text-muted-foreground">
                {form.gender === 'masculino' ? 'Masculino' : 'Feminino'}
                {metrics ? `, ${metrics.age} anos` : ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SummaryItem label="Altura" value={`${form.height} cm`} />
            <SummaryItem label="Peso" value={`${form.weight} kg`} />
            <SummaryItem label="Atividade" value={activityLabel} />
            <SummaryItem label="Objetivo" value={goalLabel} />
            {form.bodyFatPercent !== undefined && (
              <SummaryItem label="Gordura" value={`${form.bodyFatPercent}%`} />
            )}
            {(form.goal === 'perder' || form.goal === 'ganhar') && (
              <SummaryItem label="Ritmo" value={`${form.goalKgPerWeek} kg/sem`} />
            )}
          </div>
        </div>
      </div>

      {/* Metrics card */}
      {metrics && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden animate-slide-up">
          <div className="p-4 bg-accent/50 border-b border-border">
            <p className="text-sm font-semibold text-accent-foreground text-center">
              Seu plano personalizado
            </p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              <MetricCard label="TMB" value={metrics.bmr} unit="kcal" />
              <MetricCard label="TDEE" value={metrics.tdee} unit="kcal" />
              <MetricCard
                label="Meta diaria"
                value={metrics.dailyTarget}
                unit="kcal"
                highlight
              />
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                TMB = Taxa Metabolica Basal &bull; TDEE = Gasto Total Diario
                <br />
                Sua meta diaria foi ajustada com base no seu objetivo
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  )
}

function MetricCard({
  label,
  value,
  unit,
  highlight,
}: {
  label: string
  value: number
  unit: string
  highlight?: boolean
}) {
  return (
    <div
      className={`p-3 rounded-xl ${
        highlight ? 'bg-primary/10 ring-1 ring-primary/20' : 'bg-muted/50'
      }`}
    >
      <p
        className={`text-2xl font-bold ${
          highlight ? 'text-primary' : 'text-foreground'
        }`}
      >
        {value.toLocaleString('pt-BR')}
      </p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{unit}</p>
      <p
        className={`text-xs font-medium mt-1 ${
          highlight ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        {label}
      </p>
    </div>
  )
}
