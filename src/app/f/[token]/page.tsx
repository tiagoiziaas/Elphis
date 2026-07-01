'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, Loader2, AlertCircle, ChevronRight, ChevronLeft, Send, ClipboardList, User, MapPin, Activity, DollarSign } from 'lucide-react'

interface Question {
  id: string
  label: string
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select'
  options?: string[]
  required?: boolean
}

interface TokenData {
  valid: boolean
  templateTitle: string
  questions: Question[]
  patientName: string | null
  professional: {
    fullName: string
    specialty: string
    councilType?: string
    councilNumber?: string
    profileImageUrl?: string
  }
  expiresAt: string
}

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

function DynamicQuestion({
  question,
  value,
  onChange,
}: {
  question: Question
  value: any
  onChange: (val: any) => void
}) {
  const inputClass = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
  const textareaClass = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all resize-none"

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
      <div className="flex flex-col gap-2">
        {opts.map(opt => (
          <label key={opt} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm ${value === opt ? 'border-violet-400 bg-violet-50 text-violet-700 font-medium' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}>
            <input type="radio" checked={value === opt} onChange={() => onChange(opt)} className="w-4 h-4 accent-violet-500" />
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
      <div className="flex flex-col gap-2">
        {opts.map(opt => {
          const checked = selected.includes(opt)
          return (
            <label key={opt} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm ${checked ? 'border-violet-400 bg-violet-50 text-violet-700 font-medium' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  if (checked) onChange(selected.filter(s => s !== opt))
                  else onChange([...selected, opt])
                }}
                className="w-4 h-4 accent-violet-500"
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
        className={inputClass}
      >
        <option value="">Selecione...</option>
        {opts.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    )
  }

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

const STEPS = [
  'Informações Pessoais',
  'Endereço',
  'Informações de Saúde',
  'Configurações da Consulta',
  'Questionário da Anamnese'
]

export default function CustomAnamneseFormPage() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [step, setStep] = useState(0)

  // Standard patient fields state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    whatsapp: '',
    dateOfBirth: '',
    gender: '',
    age: '',
    address: '',
    addressNumber: '',
    addressComplement: '',
    neighborhood: '',
    zipCode: '',
    city: '',
    state: '',
    chiefComplaint: '',
    medicalHistory: '',
    notes: '',
    defaultConsultationType: '',
    defaultConsultationValue: '',
  })

  // Custom answers state
  const [answers, setAnswers] = useState<Record<string, any>>({})

  useEffect(() => {
    if (token) {
      fetch(`/api/f/${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error)
          } else {
            setTokenData(data)
            if (data.patientName) {
              const parts = (data.patientName as string).split(' ')
              setFormData(prev => ({
                ...prev,
                firstName: parts[0] || '',
                lastName: parts.slice(1).join(' ') || '',
              }))
            }
          }
        })
        .catch(() => setError('Erro ao carregar formulário. Tente novamente.'))
        .finally(() => setLoading(false))
    }
  }, [token])

  const handleFieldChange = (field: string, val: string) => {
    setFormData(prev => ({ ...prev, [field]: val }))
  }

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName) {
      alert('Por favor, informe seu nome e sobrenome.')
      return
    }

    // Validate required custom questions in step 5
    const questions = tokenData?.questions || []
    const missing = questions.filter(q => q.required && !answers[q.id])
    if (missing.length > 0) {
      alert(`Por favor, responda a pergunta obrigatória: ${missing[0].label}`)
      setStep(4)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/f/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          age: formData.age ? parseInt(formData.age) : null,
          defaultConsultationValue: formData.defaultConsultationValue ? parseFloat(formData.defaultConsultationValue) : null,
          answersJson: JSON.stringify(answers)
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar')
      setSubmitted(true)
    } catch (e: any) {
      alert(e.message || 'Erro ao enviar formulário. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/30 animate-pulse">
            <ClipboardList className="h-8 w-8 text-white" />
          </div>
          <p className="text-slate-600 text-sm">Carregando formulário...</p>
        </div>
      </div>
    )
  }

  if (error) {
    const iconMap: Record<string, string> = {
      'Link expirado': '⏰',
      'Este link já foi utilizado': '✅',
      'Link inválido': '❌',
    }
    const icon = iconMap[error] || '⚠️'
    const isUsed = error === 'Este link já foi utilizado'

    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-slate-100">
          <div className="text-5xl mb-4">{icon}</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            {isUsed ? 'Formulário já respondido' : 'Link indisponível'}
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">{error}</p>
          {isUsed && (
            <p className="mt-3 text-xs text-slate-400">
              Obrigado! Suas respostas já foram recebidas pelo profissional.
            </p>
          )}
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-slate-100">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Formulário enviado!</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Suas respostas foram recebidas com sucesso. O cadastro e a anamnese foram registrados.
          </p>
          {tokenData?.professional && (
            <div className="mt-6 p-4 bg-violet-50 rounded-2xl border border-violet-100">
              <p className="text-xs text-violet-600 font-semibold">{tokenData.professional.fullName}</p>
              <p className="text-xs text-violet-400">{tokenData.professional.specialty}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!tokenData) return null

  const inputClass = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
  const textareaClass = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all resize-none"

  const stepContent = [
    // 0: Informações Pessoais
    <div key="0" className="space-y-4">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
        <User className="h-5 w-5 text-violet-600" />
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">1. Informações Pessoais</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Nome *</label>
          <input type="text" value={formData.firstName} onChange={e => handleFieldChange('firstName', e.target.value)} placeholder="Nome" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Sobrenome *</label>
          <input type="text" value={formData.lastName} onChange={e => handleFieldChange('lastName', e.target.value)} placeholder="Sobrenome" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Email</label>
          <input type="email" value={formData.email} onChange={e => handleFieldChange('email', e.target.value)} placeholder="email@exemplo.com" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Telefone</label>
          <input type="text" value={formData.phone} onChange={e => handleFieldChange('phone', e.target.value)} placeholder="(00) 00000-0000" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">WhatsApp</label>
          <input type="text" value={formData.whatsapp} onChange={e => handleFieldChange('whatsapp', e.target.value)} placeholder="(00) 00000-0000" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Data de Nascimento</label>
          <input type="date" value={formData.dateOfBirth} onChange={e => handleFieldChange('dateOfBirth', e.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Gênero</label>
          <select value={formData.gender} onChange={e => handleFieldChange('gender', e.target.value)} className={inputClass}>
            <option value="">Selecione</option>
            <option value="male">Masculino</option>
            <option value="female">Feminino</option>
            <option value="other">Outro</option>
            <option value="prefer-not">Prefiro não informar</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Idade</label>
          <input type="number" value={formData.age} onChange={e => handleFieldChange('age', e.target.value)} placeholder="00" className={inputClass} />
        </div>
      </div>
    </div>,

    // 1: Endereço
    <div key="1" className="space-y-4">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
        <MapPin className="h-5 w-5 text-violet-600" />
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">2. Endereço</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Logradouro</label>
          <input type="text" value={formData.address} onChange={e => handleFieldChange('address', e.target.value)} placeholder="Rua, Avenida, etc." className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Número</label>
          <input type="text" value={formData.addressNumber} onChange={e => handleFieldChange('addressNumber', e.target.value)} placeholder="123" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Complemento</label>
          <input type="text" value={formData.addressComplement} onChange={e => handleFieldChange('addressComplement', e.target.value)} placeholder="Apto, Sala, etc." className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Bairro</label>
          <input type="text" value={formData.neighborhood} onChange={e => handleFieldChange('neighborhood', e.target.value)} placeholder="Seu bairro" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">CEP</label>
          <input type="text" value={formData.zipCode} onChange={e => handleFieldChange('zipCode', e.target.value)} placeholder="00000-000" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Cidade</label>
          <input type="text" value={formData.city} onChange={e => handleFieldChange('city', e.target.value)} placeholder="Sua cidade" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Estado</label>
          <select value={formData.state} onChange={e => handleFieldChange('state', e.target.value)} className={inputClass}>
            <option value="">UF</option>
            {brazilianStates.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>
    </div>,

    // 2: Informações de Saúde
    <div key="2" className="space-y-4">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
        <Activity className="h-5 w-5 text-violet-600" />
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">3. Informações de Saúde</h3>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Queixa Principal</label>
          <textarea value={formData.chiefComplaint} onChange={e => handleFieldChange('chiefComplaint', e.target.value)} rows={3} placeholder="Descreva a queixa principal..." className={textareaClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Histórico Médico Resumido</label>
          <textarea value={formData.medicalHistory} onChange={e => handleFieldChange('medicalHistory', e.target.value)} rows={3} placeholder="Descreva o histórico médico relevante..." className={textareaClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Observações Adicionais</label>
          <textarea value={formData.notes} onChange={e => handleFieldChange('notes', e.target.value)} rows={3} placeholder="Outras observações importantes..." className={textareaClass} />
        </div>
      </div>
    </div>,

    // 3: Configurações da Consulta
    <div key="3" className="space-y-4">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
        <DollarSign className="h-5 w-5 text-violet-600" />
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">4. Configurações Padrão da Consulta</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Tipo de Consulta Padrão</label>
          <select value={formData.defaultConsultationType} onChange={e => handleFieldChange('defaultConsultationType', e.target.value)} className={inputClass}>
            <option value="">Selecione o tipo...</option>
            <option value="Consulta Inicial">Consulta Inicial</option>
            <option value="Consulta de Retorno">Consulta de Retorno</option>
            <option value="Sessão de Acompanhamento">Sessão de Acompanhamento</option>
            <option value="Teleconsulta">Teleconsulta</option>
            <option value="Avaliação Nutricional">Avaliação Nutricional</option>
            <option value="Acompanhamento Psicológico">Acompanhamento Psicológico</option>
            <option value="Outro">Outro</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Valor Padrão (R$)</label>
          <input type="number" step="0.01" value={formData.defaultConsultationValue} onChange={e => handleFieldChange('defaultConsultationValue', e.target.value)} placeholder="0,00" className={inputClass} />
        </div>
      </div>
    </div>,

    // 4: Questionário Customizado
    <div key="4" className="space-y-4">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
        <ClipboardList className="h-5 w-5 text-violet-600" />
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">5. Questionário da Anamnese</h3>
      </div>
      <div className="space-y-4">
        {(tokenData?.questions || []).map((q, i) => (
          <div key={q.id} className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              {i + 1}. {q.label}
              {q.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <DynamicQuestion
              question={q}
              value={answers[q.id]}
              onChange={val => setAnswers(prev => ({ ...prev, [q.id]: val }))}
            />
          </div>
        ))}
        {(tokenData?.questions || []).length === 0 && (
          <p className="text-sm text-slate-500 italic text-center py-6">Este questionário não possui perguntas customizadas. Clique em Enviar para finalizar.</p>
        )}
      </div>
    </div>
  ]

  const isLast = step === STEPS.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm leading-none">Anamnese Personalizada & Cadastro</p>
              {tokenData.professional && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {tokenData.professional.fullName}
                  {tokenData.professional.councilType && tokenData.professional.councilNumber ? ` · ${tokenData.professional.councilType} ${tokenData.professional.councilNumber}` : ''}
                </p>
              )}
            </div>
          </div>
          <span className="text-xs text-slate-400 font-medium">{step + 1} / {STEPS.length}</span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps Navigation Bar */}
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => i <= step && setStep(i)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${i === step ? 'bg-violet-600 text-white shadow' : i < step ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-400'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
          {stepContent[step]}
        </div>

        {/* Buttons */}
        <div className="flex justify-between mt-6 gap-4">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30 disabled:opacity-60 transition-all"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><Send className="w-4 h-4" /> Enviar Formulário</>}
            </button>
          ) : (
            <button
              onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
              className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30 transition-all"
            >
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          Suas informações são confidenciais e protegidas. · Powered by{' '}
          <span className="font-semibold text-violet-500">Elphis</span>
        </p>
      </div>
    </div>
  )
}
