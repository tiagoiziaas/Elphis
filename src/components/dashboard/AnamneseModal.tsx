'use client'

import { useState, useEffect } from 'react'
import { X, Save, Loader2, ClipboardList, ChevronRight, ChevronLeft, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { AnamnesePdfButton } from './AnamnesePdfButton'

interface AnamneseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId?: string
  patientName?: string
  professionalName?: string
  crp?: string
  existingAnamnese?: Record<string, any> | null
  onSuccess?: () => void
}

// ─── Template types ─────────────────────────────────────────────────────────
interface Question {
  id: string
  label: string
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select'
  options?: string[]
  required?: boolean
}

interface Template {
  id: string
  title: string
  questionsJson: string
}

// ─── Legacy form types ───────────────────────────────────────────────────────
const CARACTERISTICAS = ['Agressiva', 'Passiva', 'Dependente', 'Irrequieta', 'Medrosa', 'Retraída', 'Excitada', 'Desligada']

type FormStringFields = {
  nomeCompleto: string; dataNascimento: string; idade: string; sexo: string; escolaridade: string; endereco: string; cidade: string;
  nomePai: string; idadePai: string; estadoCivilPai: string; rgPai: string; cpfPai: string; escolaridadePai: string; profissaoPai: string; telefonePai: string;
  nomeMae: string; idadeMae: string; estadoCivilMae: string; rgMae: string; cpfMae: string; escolaridadeMae: string; profissaoMae: string; telefoneMae: string;
  encaminhadoPor: string; queixa: string; resideCom: string; irmaos: string; adotado: string;
  gestacaoPlanejada: string; gestacaoDesejada: string; prenatal: string; intercorrencias: string; consumoSubstancias: string; transfusao: string; tombo: string; condicoeNascimento: string;
  acidentes: string; alergias: string; bronquiteAsma: string; visao: string; audicao: string; dorcabeca: string; desmaios: string; convulsoes: string; historiaFamiliar: string; obsSaude: string;
  amamentacao: string; alimentacao: string; forcadaAlimentar: string; comeSemDerrubar: string; ajudaAlimentacao: string; obsAlimentacao: string;
  dormeBem: string; qualidadeSono: string; falaDormindo: string; sonambulo: string; rangeDentes: string; quartoSeparado: string; comQuemDorme: string; acordaCamaPais: string; obsSono: string;
  comoBebe: string; lentoTarefas: string; vesteSozinho: string; banhaSozinho: string; calcaSozinho: string; noCalcados: string; desastrado: string; esportes: string; roiUnhas: string; chupaDedo: string; manias: string; ajudaTarefas: string; obsMotor: string;
  gostaEscola: string; aceitoPelosAmigos: string; repetiu: string; motivoRepetiu: string; gostaEstudar: string; habitoLeitura: string; fazLicoes: string; paisEstudam: string; mudouEscola: string; motivoMudou: string; matematica: string; dificuldadeLeitura: string; irrequieta: string; circunstancias: string; dificuldadesEscola: string; professoresAcham: string; obsEscola: string;
  comunicacaoAtual: string; obsLinguagem: string;
  educacaoSexual: string; dequemEducacaoSexual: string; comoFoiSexual: string; curiosidadeSexual: string; paisConversam: string; obsSexualidade: string;
  brincaSozinha: string; brincaComIdade: string; fazAmigos: string; adaptaMeio: string; relacaoPais: string; relacaoIrmaos: string; medidasDisciplinares: string; quemUsa: string; reacoesMedidas: string; obsAmbiental: string;
  aspectoEmocional: string; outrasCaracteristicas: string; reageContrariedade: string; atividadesPreferidas: string; obsEmocional: string;
  rotinaDiaria: string;
}

type FormState = FormStringFields & { caracteristicas: string[] }

const EMPTY_FORM: FormState = {
  nomeCompleto: '', dataNascimento: '', idade: '', sexo: '', escolaridade: '', endereco: '', cidade: '',
  nomePai: '', idadePai: '', estadoCivilPai: '', rgPai: '', cpfPai: '', escolaridadePai: '', profissaoPai: '', telefonePai: '',
  nomeMae: '', idadeMae: '', estadoCivilMae: '', rgMae: '', cpfMae: '', escolaridadeMae: '', profissaoMae: '', telefoneMae: '',
  encaminhadoPor: '', queixa: '', resideCom: '', irmaos: '', adotado: '',
  gestacaoPlanejada: '', gestacaoDesejada: '', prenatal: '', intercorrencias: '', consumoSubstancias: '', transfusao: '', tombo: '', condicoeNascimento: '',
  acidentes: '', alergias: '', bronquiteAsma: '', visao: '', audicao: '', dorcabeca: '', desmaios: '', convulsoes: '', historiaFamiliar: '', obsSaude: '',
  amamentacao: '', alimentacao: '', forcadaAlimentar: '', comeSemDerrubar: '', ajudaAlimentacao: '', obsAlimentacao: '',
  dormeBem: '', qualidadeSono: '', falaDormindo: '', sonambulo: '', rangeDentes: '', quartoSeparado: '', comQuemDorme: '', acordaCamaPais: '', obsSono: '',
  comoBebe: '', lentoTarefas: '', vesteSozinho: '', banhaSozinho: '', calcaSozinho: '', noCalcados: '', desastrado: '', esportes: '', roiUnhas: '', chupaDedo: '', manias: '', ajudaTarefas: '', obsMotor: '',
  gostaEscola: '', aceitoPelosAmigos: '', repetiu: '', motivoRepetiu: '', gostaEstudar: '', habitoLeitura: '', fazLicoes: '', paisEstudam: '', mudouEscola: '', motivoMudou: '', matematica: '', dificuldadeLeitura: '', irrequieta: '', circunstancias: '', dificuldadesEscola: '', professoresAcham: '', obsEscola: '',
  comunicacaoAtual: '', obsLinguagem: '',
  educacaoSexual: '', dequemEducacaoSexual: '', comoFoiSexual: '', curiosidadeSexual: '', paisConversam: '', obsSexualidade: '',
  brincaSozinha: '', brincaComIdade: '', fazAmigos: '', adaptaMeio: '', relacaoPais: '', relacaoIrmaos: '', medidasDisciplinares: '', quemUsa: '', reacoesMedidas: '', obsAmbiental: '',
  aspectoEmocional: '', caracteristicas: [], outrasCaracteristicas: '', reageContrariedade: '', atividadesPreferidas: '', obsEmocional: '',
  rotinaDiaria: '',
}

// ─── Mini UI helpers ────────────────────────────────────────────────
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-600">{label}</Label>
      {children}
    </div>
  )
}

const inputCls = "rounded-lg text-sm h-9 border-border/60 focus:border-primary/40 bg-background"
const textareaCls = "rounded-lg text-sm border-border/60 focus:border-primary/40 bg-background resize-none"

function TI({ field, form, set, ph = '' }: { field: keyof FormStringFields; form: FormState; set: (f: string, v: string) => void; ph?: string }) {
  return <Input value={form[field] || ''} onChange={e => set(field, e.target.value)} placeholder={ph} className={inputCls} />
}

function TA({ field, form, set, rows = 2, ph = '' }: { field: keyof FormStringFields; form: FormState; set: (f: string, v: string) => void; rows?: number; ph?: string }) {
  return <Textarea value={form[field] || ''} onChange={e => set(field, e.target.value)} rows={rows} placeholder={ph} className={textareaCls} />
}

function Radio({ field, form, set, options }: { field: keyof FormStringFields; form: FormState; set: (f: string, v: string) => void; options: string[] }) {
  return (
    <div className="flex gap-4 flex-wrap pt-1">
      {options.map(o => (
        <label key={o} className="flex items-center gap-1.5 cursor-pointer">
          <input type="radio" checked={form[field] === o} onChange={() => set(field, o)} className="w-3.5 h-3.5 accent-primary" />
          <span className="text-sm">{o}</span>
        </label>
      ))}
    </div>
  )
}

const STEPS = [
  'Identificação', 'Responsáveis', 'Queixa & Família', 'Gestação',
  'Saúde', 'Alimentação & Sono', 'Desenvolvimento', 'Escolaridade',
  'Linguagem & Sexualidade', 'Ambiental', 'Emocional & Rotina',
]

// ─── Dynamic Question Renderer ───────────────────────────────────────────────
function DynamicQuestion({
  question,
  value,
  onChange,
}: {
  question: Question
  value: any
  onChange: (val: any) => void
}) {
  const inputClass = "rounded-lg text-sm h-9 border-border/60 focus:border-primary/40 bg-background w-full px-3 border outline-none focus:ring-2 focus:ring-primary/20 transition-all"
  const textareaClass = "rounded-lg text-sm border-border/60 focus:border-primary/40 bg-background resize-none w-full px-3 py-2 border outline-none focus:ring-2 focus:ring-primary/20 transition-all"

  if (question.type === 'textarea') {
    return (
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        rows={3}
        className={textareaClass}
        placeholder="Sua resposta..."
      />
    )
  }

  if (question.type === 'radio') {
    const opts = question.options || []
    return (
      <div className="flex flex-wrap gap-3 pt-1">
        {opts.map(opt => (
          <label key={opt} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-sm transition-all ${value === opt ? 'border-primary bg-primary/8 text-primary font-medium' : 'border-border/60 text-foreground hover:border-border'}`}>
            <input type="radio" checked={value === opt} onChange={() => onChange(opt)} className="w-3.5 h-3.5 accent-primary" />
            {opt}
          </label>
        ))}
      </div>
    )
  }

  if (question.type === 'checkbox') {
    const opts = question.options || []
    const selected: string[] = Array.isArray(value) ? value : []
    return (
      <div className="flex flex-wrap gap-2 pt-1">
        {opts.map(opt => {
          const checked = selected.includes(opt)
          return (
            <label key={opt} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-sm transition-all ${checked ? 'border-primary bg-primary/8 text-primary font-medium' : 'border-border/60 text-foreground hover:border-border'}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  if (checked) onChange(selected.filter(s => s !== opt))
                  else onChange([...selected, opt])
                }}
                className="w-3.5 h-3.5 accent-primary"
              />
              {opt}
            </label>
          )
        })}
      </div>
    )
  }

  if (question.type === 'select') {
    const opts = question.options || []
    return (
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="rounded-lg text-sm h-9 border border-border/60 focus:border-primary/40 bg-background w-full px-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
      >
        <option value="">Selecione...</option>
        {opts.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    )
  }

  // Default: text
  return (
    <input
      type="text"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder="Sua resposta..."
      className={inputClass}
    />
  )
}

// ─── Template Selector Screen ────────────────────────────────────────────────
function TemplateSelectorScreen({
  templates,
  loadingTemplates,
  selectedTemplate,
  onSelect,
  showLegacyOption = true,
}: {
  templates: Template[]
  loadingTemplates: boolean
  selectedTemplate: Template | null | 'legacy'
  onSelect: (t: Template | 'legacy') => void
  showLegacyOption?: boolean
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Selecione qual formulário de anamnese deseja preencher para este paciente:
      </p>

      {loadingTemplates ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-7 w-7 text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {/* Custom templates */}
          {templates.map(t => {
            let qCount = 0
            try { qCount = JSON.parse(t.questionsJson).length } catch {}
            const active = selectedTemplate !== 'legacy' && (selectedTemplate as Template)?.id === t.id
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${active ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/40 hover:bg-muted/40'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-muted'}`}>
                  <ClipboardList className={`h-5 w-5 ${active ? 'text-white' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${active ? 'text-primary' : 'text-foreground'}`}>{t.title}</p>
                  <p className="text-xs text-muted-foreground">{qCount} pergunta{qCount !== 1 ? 's' : ''} · Personalizado</p>
                </div>
                {active && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />}
              </button>
            )
          })}

          {/* Legacy default form */}
          {showLegacyOption && (
            <button
              onClick={() => onSelect('legacy')}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${selectedTemplate === 'legacy' ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/40 hover:bg-muted/40'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedTemplate === 'legacy' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-muted'}`}>
                <FileText className={`h-5 w-5 ${selectedTemplate === 'legacy' ? 'text-white' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${selectedTemplate === 'legacy' ? 'text-primary' : 'text-foreground'}`}>Anamnese Infantil Padrão</p>
                <p className="text-xs text-muted-foreground">Formulário completo · 11 seções · Psicologia</p>
              </div>
              {selectedTemplate === 'legacy' && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />}
            </button>
          )}

          {templates.length === 0 && !showLegacyOption && (
            <div className="text-center py-4 text-xs text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border/60">
              Nenhuma anamnese preenchida para este paciente.
            </div>
          )}

          {templates.length === 0 && showLegacyOption && (
            <div className="text-center py-4 text-xs text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border/60">
              Você ainda não criou nenhum formulário personalizado.
              <br />Acesse <strong>Anamneses</strong> no menu para criar.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Dynamic Form Screen ─────────────────────────────────────────────────────
function DynamicFormScreen({
  template,
  answers,
  onChange,
}: {
  template: Template
  answers: Record<string, any>
  onChange: (answers: Record<string, any>) => void
}) {
  let questions: Question[] = []
  try { questions = JSON.parse(template.questionsJson) } catch {}

  return (
    <div className="space-y-5">
      {questions.map((q, i) => (
        <div key={q.id} className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-600">
            {i + 1}. {q.label}
            {q.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <DynamicQuestion
            question={q}
            value={answers[q.id]}
            onChange={val => onChange({ ...answers, [q.id]: val })}
          />
        </div>
      ))}
      {questions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Este template não tem perguntas cadastradas.</p>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AnamneseModal({
  open, onOpenChange, patientId, patientName, professionalName, crp, existingAnamnese, onSuccess
}: AnamneseModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM })
  const [savedAnamnese, setSavedAnamnese] = useState<Record<string, any> | null>(existingAnamnese || null)
  const [profName, setProfName] = useState(professionalName || '')
  const [profCrp, setProfCrp] = useState(crp || '')
  const [loadingData, setLoadingData] = useState(false)

  // Template selection state
  const [templates, setTemplates] = useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | 'legacy' | null>(null)
  const [dynamicAnswers, setDynamicAnswers] = useState<Record<string, any>>({})
  const [savedSubmissionId, setSavedSubmissionId] = useState<string | null>(null)
  const [patientSubmissions, setPatientSubmissions] = useState<any[]>([])
  const [hasLegacyAnamnese, setHasLegacyAnamnese] = useState<boolean>(false)

  // Phase: 'select' = choosing template, 'fill' = filling form
  const phase = selectedTemplate === null ? 'select' : 'fill'

  // Fetch templates when modal opens
  useEffect(() => {
    if (open) {
      setLoadingTemplates(true)
      fetch('/api/professional/custom-anamnese/templates')
        .then(r => r.json())
        .then(d => setTemplates(d.templates || []))
        .catch(() => {})
        .finally(() => setLoadingTemplates(false))
    }
  }, [open])

  // Fetch professional profile
  useEffect(() => {
    if (open && !profName) {
      fetch('/api/professional/profile')
        .then(res => res.json())
        .then(data => {
          if (data.fullName) setProfName(data.fullName)
          if (data.councilNumber) setProfCrp(data.councilNumber)
        })
        .catch(() => {})
    }
  }, [open, profName])

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep(0)
      setSelectedTemplate(null)
      setDynamicAnswers({})
      setSavedSubmissionId(null)
      setPatientSubmissions([])
      setHasLegacyAnamnese(false)

      const loadAnamneseData = (data: any) => {
        const loaded: any = { ...EMPTY_FORM }
        for (const k of Object.keys(EMPTY_FORM)) {
          if (k === 'caracteristicas') {
            try {
              const raw = data[k]
              loaded[k] = Array.isArray(raw) ? raw : (raw ? JSON.parse(raw) : [])
            } catch { loaded[k] = [] }
          } else {
            loaded[k] = data[k] || ''
          }
        }
        if (!loaded.nomeCompleto && patientName) loaded.nomeCompleto = patientName
        setForm(loaded)
        setSavedAnamnese(data)
      }

      if (existingAnamnese) {
        loadAnamneseData(existingAnamnese)
        setHasLegacyAnamnese(true)
      } else if (patientId) {
        setLoadingData(true)
        Promise.all([
          fetch(`/api/professional/anamnese?patientId=${patientId}`).then(res => res.json()),
          fetch(`/api/professional/custom-anamnese/submissions?patientId=${patientId}`).then(res => res.json())
        ])
          .then(([legacyData, customData]) => {
            const legList = legacyData.anamneses || []
            const custList = customData.submissions || []
            
            setPatientSubmissions(custList)
            
            if (legList.length > 0) {
              loadAnamneseData(legList[0])
              setHasLegacyAnamnese(true)
            } else {
              setForm({ ...EMPTY_FORM, nomeCompleto: patientName || '' })
              setSavedAnamnese(null)
              setHasLegacyAnamnese(false)
            }
          })
          .catch(() => {
            setForm({ ...EMPTY_FORM, nomeCompleto: patientName || '' })
            setSavedAnamnese(null)
            setHasLegacyAnamnese(false)
            setPatientSubmissions([])
          })
          .finally(() => setLoadingData(false))
      } else {
        setForm({ ...EMPTY_FORM, nomeCompleto: patientName || '' })
        setSavedAnamnese(null)
      }
    }
  }, [open, existingAnamnese, patientId, patientName])

  // Load existing dynamic answers when selectedTemplate changes
  useEffect(() => {
    if (selectedTemplate && selectedTemplate !== 'legacy') {
      const sub = patientSubmissions.find(s => s.templateId === selectedTemplate.id)
      if (sub) {
        try {
          setDynamicAnswers(JSON.parse(sub.answersJson))
          setSavedSubmissionId(sub.id)
        } catch {
          setDynamicAnswers({})
          setSavedSubmissionId(null)
        }
      } else {
        setDynamicAnswers({})
        setSavedSubmissionId(null)
      }
    }
  }, [selectedTemplate, patientSubmissions])

  const set = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }))
  const toggleCarac = (c: string) => {
    setForm(p => ({
      ...p,
      caracteristicas: p.caracteristicas.includes(c)
        ? p.caracteristicas.filter((x: string) => x !== c)
        : [...p.caracteristicas, c],
    } as FormState))
  }

  // ─── Save legacy anamnese ─────────────────────────────────────────────
  const handleSaveLegacy = async () => {
    if (!form.nomeCompleto.trim()) {
      toast({ title: 'Nome obrigatório', description: 'Preencha o nome completo do paciente.', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...(savedAnamnese ? { id: savedAnamnese.id } : {}),
        patientId,
        ...form,
        caracteristicas: JSON.stringify(form.caracteristicas),
      }

      const method = savedAnamnese ? 'PUT' : 'POST'
      const res = await fetch('/api/professional/anamnese', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error()
      const data = await res.json()
      setSavedAnamnese(data.anamnese)

      toast({ title: 'Anamnese salva!', description: 'As informações foram salvas com sucesso.' })
      onSuccess?.()
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // ─── Save dynamic (custom template) anamnese ─────────────────────────
  const handleSaveDynamic = async () => {
    if (!selectedTemplate || selectedTemplate === 'legacy') return
    let questions: Question[] = []
    try { questions = JSON.parse(selectedTemplate.questionsJson) } catch {}

    // Validate required questions
    const missing = questions.filter(q => q.required && !dynamicAnswers[q.id])
    if (missing.length > 0) {
      toast({
        title: 'Campos obrigatórios',
        description: `Preencha: ${missing.map(q => q.label).join(', ')}`,
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/professional/custom-anamnese/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          patientId: patientId || null,
          nomeCompleto: patientName || null,
          answersJson: JSON.stringify(dynamicAnswers),
          submissionId: savedSubmissionId || undefined,
        }),
      })

      if (!res.ok) throw new Error()
      const data = await res.json()
      setSavedSubmissionId(data.submission?.id || null)
      toast({ title: 'Anamnese salva!', description: 'As respostas foram salvas com sucesso.' })
      onSuccess?.()
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // ─── Legacy step content ──────────────────────────────────────────────
  const steps = [
    // 0 — Identificação
    <div key="0" className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2"><F label="Nome completo do paciente *"><TI field="nomeCompleto" form={form} set={set} ph="Nome completo" /></F></div>
        <F label="Data de nascimento"><input type="date" value={form.dataNascimento} onChange={e => set('dataNascimento', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm border-border/60 bg-background" /></F>
        <F label="Idade"><TI field="idade" form={form} set={set} ph="Ex: 7 anos" /></F>
        <F label="Sexo"><Radio field="sexo" form={form} set={set} options={['Masculino', 'Feminino']} /></F>
        <F label="Escolaridade"><TI field="escolaridade" form={form} set={set} /></F>
        <div className="md:col-span-2"><F label="Endereço completo"><TA field="endereco" form={form} set={set} ph="Rua, número, bairro, CEP" /></F></div>
        <div className="md:col-span-2"><F label="Cidade"><TI field="cidade" form={form} set={set} /></F></div>
      </div>
    </div>,

    // 1 — Responsáveis
    <div key="1" className="space-y-6">
      <div>
        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Pai ou Responsável</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2"><F label="Nome completo"><TI field="nomePai" form={form} set={set} /></F></div>
          <F label="Idade"><TI field="idadePai" form={form} set={set} /></F>
          <F label="Estado civil"><TI field="estadoCivilPai" form={form} set={set} /></F>
          <F label="RG"><TI field="rgPai" form={form} set={set} /></F>
          <F label="CPF"><TI field="cpfPai" form={form} set={set} /></F>
          <F label="Escolaridade"><TI field="escolaridadePai" form={form} set={set} /></F>
          <F label="Profissão"><TI field="profissaoPai" form={form} set={set} /></F>
          <F label="Telefone"><TI field="telefonePai" form={form} set={set} ph="(11) 99999-9999" /></F>
        </div>
      </div>
      <div className="border-t border-border/40 pt-4">
        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Mãe ou Responsável</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2"><F label="Nome completo"><TI field="nomeMae" form={form} set={set} /></F></div>
          <F label="Idade"><TI field="idadeMae" form={form} set={set} /></F>
          <F label="Estado civil"><TI field="estadoCivilMae" form={form} set={set} /></F>
          <F label="RG"><TI field="rgMae" form={form} set={set} /></F>
          <F label="CPF"><TI field="cpfMae" form={form} set={set} /></F>
          <F label="Escolaridade"><TI field="escolaridadeMae" form={form} set={set} /></F>
          <F label="Profissão"><TI field="profissaoMae" form={form} set={set} /></F>
          <F label="Telefone"><TI field="telefoneMae" form={form} set={set} ph="(11) 99999-9999" /></F>
        </div>
      </div>
      <F label="Encaminhado por"><TI field="encaminhadoPor" form={form} set={set} /></F>
    </div>,

    // 2 — Queixa & Família
    <div key="2" className="space-y-4">
      <F label="Queixa (motivo da consulta)"><TA field="queixa" form={form} set={set} rows={4} ph="Descreva a queixa principal..." /></F>
      <F label="Reside com quais familiares ou responsáveis?"><TA field="resideCom" form={form} set={set} rows={2} /></F>
      <F label="Possui irmãos? Nomes, ordens de nascimento e idade?"><TA field="irmaos" form={form} set={set} rows={2} /></F>
      <F label="Adotado?"><Radio field="adotado" form={form} set={set} options={['Sim', 'Não']} /></F>
    </div>,

    // 3 — Gestação
    <div key="3" className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <F label="Gestação planejada?"><TI field="gestacaoPlanejada" form={form} set={set} /></F>
        <F label="Gestação desejada?"><TI field="gestacaoDesejada" form={form} set={set} /></F>
        <div className="md:col-span-2"><F label="Realizou pré-natal?"><TI field="prenatal" form={form} set={set} /></F></div>
      </div>
      <F label="Intercorrências durante a gestação (doenças, separação, conflitos)?"><TA field="intercorrencias" form={form} set={set} rows={3} /></F>
      <F label="Consumo de medicações, cigarros, álcool ou drogas durante a gestação?"><TA field="consumoSubstancias" form={form} set={set} rows={2} /></F>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <F label="Transfusão durante a gravidez?"><TI field="transfusao" form={form} set={set} /></F>
        <F label="Levou algum tombo?"><TI field="tombo" form={form} set={set} /></F>
      </div>
      <F label="Condições de nascimento"><TA field="condicoeNascimento" form={form} set={set} rows={3} ph="Parto normal, cesárea, peso, APGAR..." /></F>
    </div>,

    // 4 — Saúde
    <div key="4" className="space-y-4">
      <F label="Acidentes ou cirurgias?"><TA field="acidentes" form={form} set={set} rows={2} /></F>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <F label="Reações alérgicas?"><TI field="alergias" form={form} set={set} /></F>
        <F label="Bronquite ou asma?"><TI field="bronquiteAsma" form={form} set={set} /></F>
        <F label="Problemas de visão?"><TI field="visao" form={form} set={set} /></F>
        <F label="Problemas de audição?"><TI field="audicao" form={form} set={set} /></F>
        <F label="Dor de cabeça?"><TI field="dorcabeca" form={form} set={set} /></F>
        <F label="Já desmaiou? Quando? Como foi?"><TI field="desmaios" form={form} set={set} /></F>
        <F label="Teve ou tem convulsões?"><TI field="convulsoes" form={form} set={set} /></F>
        <F label="Histórico familiar (desmaios, convulsões)?"><TI field="historiaFamiliar" form={form} set={set} /></F>
      </div>
      <F label="Observações"><TA field="obsSaude" form={form} set={set} rows={2} /></F>
    </div>,

    // 5 — Alimentação & Sono
    <div key="5" className="space-y-5">
      <p className="text-xs font-bold text-primary uppercase tracking-wider">Alimentação</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <F label="Foi amamentada? Até quando?"><TI field="amamentacao" form={form} set={set} /></F>
        <F label="É forçada a se alimentar?"><TI field="forcadaAlimentar" form={form} set={set} /></F>
        <F label="Come sem derrubar a comida?"><TI field="comeSemDerrubar" form={form} set={set} /></F>
        <F label="Recebe ajuda na alimentação?"><TI field="ajudaAlimentacao" form={form} set={set} /></F>
        <div className="md:col-span-2"><F label="Como é sua alimentação?"><TA field="alimentacao" form={form} set={set} rows={2} /></F></div>
        <div className="md:col-span-2"><F label="Observações"><TA field="obsAlimentacao" form={form} set={set} rows={2} /></F></div>
      </div>
      <div className="border-t border-border/40 pt-4">
        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Sono</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <F label="A criança dorme bem?"><TI field="dormeBem" form={form} set={set} /></F>
          <F label="Como é o sono?"><TI field="qualidadeSono" form={form} set={set} /></F>
          <F label="Fala dormindo?"><TI field="falaDormindo" form={form} set={set} /></F>
          <F label="É sonâmbulo?"><TI field="sonambulo" form={form} set={set} /></F>
          <F label="Range os dentes?"><TI field="rangeDentes" form={form} set={set} /></F>
          <F label="Quarto separado dos pais?"><TI field="quartoSeparado" form={form} set={set} /></F>
          <F label="Com quem dorme?"><TI field="comQuemDorme" form={form} set={set} /></F>
          <F label="Acorda e vai para cama dos pais?"><TI field="acordaCamaPais" form={form} set={set} /></F>
          <div className="md:col-span-2"><F label="Observações"><TA field="obsSono" form={form} set={set} rows={2} /></F></div>
        </div>
      </div>
    </div>,

    // 6 — Desenvolvimento
    <div key="6" className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2"><F label="Como era como bebê?"><TI field="comoBebe" form={form} set={set} /></F></div>
        <F label="É lento para realizar tarefas?"><TI field="lentoTarefas" form={form} set={set} /></F>
        <F label="Veste-se sozinho?"><TI field="vesteSozinho" form={form} set={set} /></F>
        <F label="Toma banho sozinho?"><TI field="banhaSozinho" form={form} set={set} /></F>
        <F label="Calça-se sozinho?"><TI field="calcaSozinho" form={form} set={set} /></F>
        <F label="Sabe dar nó nos calçados?"><TI field="noCalcados" form={form} set={set} /></F>
        <F label="É desastrado?"><TI field="desastrado" form={form} set={set} /></F>
        <F label="Pratica esportes? Quais?"><TI field="esportes" form={form} set={set} /></F>
        <F label="Rói unhas?"><TI field="roiUnhas" form={form} set={set} /></F>
        <F label="Chupa o dedo?"><TI field="chupaDedo" form={form} set={set} /></F>
        <div className="md:col-span-2"><F label="Tem mania ou tic? Qual?"><TI field="manias" form={form} set={set} /></F></div>
        <div className="md:col-span-2"><F label="Precisa de ajuda para alguma coisa?"><TI field="ajudaTarefas" form={form} set={set} /></F></div>
        <div className="md:col-span-2"><F label="Observações"><TA field="obsMotor" form={form} set={set} rows={2} /></F></div>
      </div>
    </div>,

    // 7 — Escolaridade
    <div key="7" className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <F label="Gosta de ir à escola?"><TI field="gostaEscola" form={form} set={set} /></F>
        <F label="É aceita pelos amigos ou isolada?"><TI field="aceitoPelosAmigos" form={form} set={set} /></F>
        <F label="Já repetiu alguma série?"><TI field="repetiu" form={form} set={set} /></F>
        <F label="Por quê repetiu?"><TI field="motivoRepetiu" form={form} set={set} /></F>
        <F label="Gosta de estudar?"><TI field="gostaEstudar" form={form} set={set} /></F>
        <F label="Tem hábito de leitura?"><TI field="habitoLeitura" form={form} set={set} /></F>
        <F label="Faz as lições?"><TI field="fazLicoes" form={form} set={set} /></F>
        <F label="Os pais estudam com ela?"><TI field="paisEstudam" form={form} set={set} /></F>
        <F label="Mudou muitas vezes de escola?"><TI field="mudouEscola" form={form} set={set} /></F>
        <F label="Por quê mudou?"><TI field="motivoMudou" form={form} set={set} /></F>
        <F label="Vai bem em matemática?"><TI field="matematica" form={form} set={set} /></F>
        <F label="Dificuldade em leitura e escrita?"><TI field="dificuldadeLeitura" form={form} set={set} /></F>
        <F label="É irrequieta na escola?"><TI field="irrequieta" form={form} set={set} /></F>
        <F label="Em que circunstâncias?"><TI field="circunstancias" form={form} set={set} /></F>
        <div className="md:col-span-2"><F label="O que os professores acham?"><TI field="professoresAcham" form={form} set={set} /></F></div>
        <div className="md:col-span-2"><F label="Principais dificuldades na escola?"><TA field="dificuldadesEscola" form={form} set={set} rows={2} /></F></div>
        <div className="md:col-span-2"><F label="Observações"><TA field="obsEscola" form={form} set={set} rows={2} /></F></div>
      </div>
    </div>,

    // 8 — Linguagem & Sexualidade
    <div key="8" className="space-y-5">
      <div>
        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Linguagem</p>
        <div className="space-y-3">
          <F label="Descreva a comunicação atual:"><TA field="comunicacaoAtual" form={form} set={set} rows={3} /></F>
          <F label="Observações"><TA field="obsLinguagem" form={form} set={set} rows={2} /></F>
        </div>
      </div>
      <div className="border-t border-border/40 pt-4">
        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Sexualidade</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <F label="Recebeu educação sexual?"><TI field="educacaoSexual" form={form} set={set} /></F>
          <F label="De quem?"><TI field="dequemEducacaoSexual" form={form} set={set} /></F>
          <F label="Como foi?"><TI field="comoFoiSexual" form={form} set={set} /></F>
          <F label="Tem curiosidade sexual?"><TI field="curiosidadeSexual" form={form} set={set} /></F>
          <div className="md:col-span-2"><F label="Os pais conversam sobre sexualidade com a criança?"><TI field="paisConversam" form={form} set={set} /></F></div>
          <div className="md:col-span-2"><F label="Observações"><TA field="obsSexualidade" form={form} set={set} rows={2} /></F></div>
        </div>
      </div>
    </div>,

    // 9 — Ambiental
    <div key="9" className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <F label="Prefere brincar sozinha ou com amigos?"><TI field="brincaSozinha" form={form} set={set} /></F>
        <F label="Prefere crianças maiores ou menores?"><TI field="brincaComIdade" form={form} set={set} /></F>
        <F label="Faz amigos com facilidade?"><TI field="fazAmigos" form={form} set={set} /></F>
        <F label="Adapta-se facilmente ao meio?"><TI field="adaptaMeio" form={form} set={set} /></F>
        <div className="md:col-span-2"><F label="Relacionamento com os pais?"><TI field="relacaoPais" form={form} set={set} /></F></div>
        <div className="md:col-span-2"><F label="Relacionamento com os irmãos?"><TI field="relacaoIrmaos" form={form} set={set} /></F></div>
        <div className="md:col-span-2"><F label="Medidas disciplinares normalmente usadas?"><TA field="medidasDisciplinares" form={form} set={set} rows={2} /></F></div>
        <F label="Quem as usa?"><TI field="quemUsa" form={form} set={set} /></F>
        <F label="Reações da criança às medidas?"><TI field="reacoesMedidas" form={form} set={set} /></F>
        <div className="md:col-span-2"><F label="Observações"><TA field="obsAmbiental" form={form} set={set} rows={2} /></F></div>
      </div>
    </div>,

    // 10 — Emocional & Rotina
    <div key="10" className="space-y-4">
      <F label="Como é a criança sob o ponto de vista emocional?"><TA field="aspectoEmocional" form={form} set={set} rows={3} /></F>
      <div>
        <Label className="text-xs font-semibold text-slate-600 block mb-2">Características (selecione as que se enquadram)</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {CARACTERISTICAS.map(c => (
            <label key={c} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${form.caracteristicas.includes(c) ? 'border-primary bg-primary/5 text-primary' : 'border-border/60 hover:border-border'}`}>
              <input type="checkbox" checked={form.caracteristicas.includes(c)} onChange={() => toggleCarac(c)} className="w-3.5 h-3.5 accent-primary" />
              {c}
            </label>
          ))}
        </div>
      </div>
      <F label="Outros"><TI field="outrasCaracteristicas" form={form} set={set} /></F>
      <F label="Como reage quando contrariada?"><TI field="reageContrariedade" form={form} set={set} /></F>
      <F label="Atividades preferidas"><TI field="atividadesPreferidas" form={form} set={set} /></F>
      <F label="Observações"><TA field="obsEmocional" form={form} set={set} rows={2} /></F>
      <div className="border-t border-border/40 pt-4">
        <F label="Rotina diária (desde quando acorda até a hora de dormir)">
          <TA field="rotinaDiaria" form={form} set={set} rows={5} ph="Ex: Acorda às 7h, toma café..." />
        </F>
      </div>
    </div>,
  ]

  const isLegacy = selectedTemplate === 'legacy'
  const isCustom = selectedTemplate && selectedTemplate !== 'legacy'

  const hasAnyAnamnese = hasLegacyAnamnese || patientSubmissions.length > 0
  const filteredTemplates = hasAnyAnamnese
    ? templates.filter(t => patientSubmissions.some(sub => sub.templateId === t.id))
    : templates
  const showLegacyOption = !hasAnyAnamnese || hasLegacyAnamnese

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-0 flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 font-display font-bold text-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div>
              {phase === 'select' ? 'Selecionar Anamnese' : isLegacy ? 'Anamnese Infantil' : (selectedTemplate as Template).title}
              {patientName && <span className="text-sm font-normal text-muted-foreground ml-2">— {patientName}</span>}
            </div>
          </DialogTitle>
          <DialogDescription>
            {phase === 'select' ? 'Escolha o formulário para este paciente' : isLegacy ? 'Psicologia · Coleta de dados completa' : 'Formulário personalizado'}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator (only for legacy) */}
        {isLegacy && (
          <div className="px-6 pt-3 pb-2 flex-shrink-0">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {STEPS.map((s, i) => (
                <button
                  key={s}
                  onClick={() => i < step && setStep(i)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${i === step ? 'bg-primary text-white' : i < step ? 'bg-primary/15 text-primary cursor-pointer' : 'bg-muted text-muted-foreground'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-2 h-1 bg-muted rounded-full">
              <div className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Buscando anamnese existente...</p>
            </div>
          ) : phase === 'select' ? (
            <TemplateSelectorScreen
              templates={filteredTemplates}
              loadingTemplates={loadingTemplates}
              selectedTemplate={selectedTemplate}
              onSelect={t => setSelectedTemplate(t)}
              showLegacyOption={showLegacyOption}
            />
          ) : isCustom ? (
            <DynamicFormScreen
              template={selectedTemplate as Template}
              answers={dynamicAnswers}
              onChange={setDynamicAnswers}
            />
          ) : (
            <>
              <div className="text-sm font-semibold text-muted-foreground mb-4">
                {step + 1}. {STEPS[step]}
              </div>
              {steps[step]}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/40 flex items-center justify-between gap-3 flex-shrink-0 bg-card">
          <div className="flex gap-2">
            {/* Back to template selection */}
            {phase === 'fill' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSelectedTemplate(null); setStep(0) }}
                className="rounded-xl h-9 text-xs border-border/60"
              >
                Trocar formulário
              </Button>
            )}
            {isLegacy && savedAnamnese && !loadingData && (
              <AnamnesePdfButton
                anamnese={{ ...savedAnamnese, ...form, caracteristicas: JSON.stringify(form.caracteristicas) }}
                professionalName={profName || professionalName}
                crp={profCrp || crp}
              />
            )}
          </div>

          <div className="flex gap-2">
            {/* Selection screen: helper text */}
            {phase === 'select' && (
              <p className="text-xs text-muted-foreground italic">Clique em um formulário para começar</p>
            )}

            {/* Legacy navigation */}
            {isLegacy && (
              <>
                <Button variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="rounded-xl h-9 text-sm">
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Anterior
                </Button>
                {step < STEPS.length - 1 ? (
                  <Button onClick={() => setStep(s => s + 1)} className="rounded-xl h-9 text-sm bg-gradient-to-r from-primary to-orange-600 text-white">
                    Próximo <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={handleSaveLegacy} disabled={loading} className="rounded-xl h-9 text-sm bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg shadow-primary/25">
                    {loading ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Salvando...</> : <><Save className="h-3.5 w-3.5 mr-1.5" />Salvar Anamnese</>}
                  </Button>
                )}
              </>
            )}

            {/* Custom template save */}
            {isCustom && (
              <Button onClick={handleSaveDynamic} disabled={loading} className="rounded-xl h-9 text-sm bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg shadow-primary/25">
                {loading ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Salvando...</> : <><Save className="h-3.5 w-3.5 mr-1.5" />Salvar Anamnese</>}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
