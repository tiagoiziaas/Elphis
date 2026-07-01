'use client'

import { useState, useEffect } from 'react'
import { X, Save, Upload, Image as ImageIcon, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PatientAnamnesePdfButton } from './PatientAnamnesePdfButton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { ToastAction } from '@/components/ui/toast'

interface Question {
  id: string
  label: string
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select'
  options?: string[]
  required?: boolean
}

function DynamicQuestion({
  question,
  value,
  onChange,
}: {
  question: Question
  value: any
  onChange: (val: any) => void
}) {
  const inputClass = "rounded-lg text-sm h-9 border border-border/60 focus:border-primary/40 bg-background w-full px-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
  const textareaClass = "rounded-lg text-sm border border-border/60 focus:border-primary/40 bg-background resize-none w-full px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 transition-all"

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
      <div className="flex flex-wrap gap-2.5 pt-1">
        {opts.map(opt => (
          <label key={opt} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-all ${value === opt ? 'border-primary bg-primary/8 text-primary font-medium' : 'border-border/60 text-foreground hover:border-border'}`}>
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
            <label key={opt} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-all ${checked ? 'border-primary bg-primary/8 text-primary font-medium' : 'border-border/60 text-foreground hover:border-border'}`}>
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

interface Patient {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  dateOfBirth?: string | null
  gender?: string | null
  age?: number | null
  address?: string | null
  addressNumber?: string | null
  addressComplement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  chiefComplaint?: string | null
  medicalHistory?: string | null
  notes?: string | null
  defaultConsultationType?: string | null
  defaultConsultationValue?: number | string | null
}

interface PatientFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  whatsapp: string
  dateOfBirth: string
  gender: string
  age: string
  address: string
  addressNumber: string
  addressComplement: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  chiefComplaint: string
  medicalHistory: string
  notes: string
  defaultConsultationType: string
  defaultConsultationValue: string
}

interface NewPatientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  patientToEdit?: Patient | null
}

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export function NewPatientModal({ open, onOpenChange, onSuccess, patientToEdit }: NewPatientModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<PatientFormData>({
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
    city: '',
    state: '',
    zipCode: '',
    chiefComplaint: '',
    medicalHistory: '',
    notes: '',
    defaultConsultationType: '',
    defaultConsultationValue: '',
  })
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({})
  const [customSubmissionId, setCustomSubmissionId] = useState<string | null>(null)
  const [patientSubmissions, setPatientSubmissions] = useState<any[]>([])
  const [profProfile, setProfProfile] = useState<any>(null)

  // Load patient data when editing
  useEffect(() => {
    if (patientToEdit && open) {
      setFormData({
        firstName: patientToEdit.firstName || '',
        lastName: patientToEdit.lastName || '',
        email: patientToEdit.email || '',
        phone: patientToEdit.phone || '',
        whatsapp: patientToEdit.whatsapp || '',
        dateOfBirth: patientToEdit.dateOfBirth ? new Date(patientToEdit.dateOfBirth).toISOString().split('T')[0] : '',
        gender: patientToEdit.gender || '',
        age: patientToEdit.age?.toString() || '',
        address: patientToEdit.address || '',
        addressNumber: patientToEdit.addressNumber || '',
        addressComplement: patientToEdit.addressComplement || '',
        neighborhood: patientToEdit.neighborhood || '',
        city: patientToEdit.city || '',
        state: patientToEdit.state || '',
        zipCode: patientToEdit.zipCode || '',
        chiefComplaint: patientToEdit.chiefComplaint || '',
        medicalHistory: patientToEdit.medicalHistory || '',
        notes: patientToEdit.notes || '',
        defaultConsultationType: patientToEdit.defaultConsultationType || '',
        defaultConsultationValue: patientToEdit.defaultConsultationValue?.toString() || '',
      })

      // Fetch custom submissions
      fetch(`/api/professional/custom-anamnese/submissions?patientId=${patientToEdit.id}`)
        .then(res => res.json())
        .then(data => {
          const list = data.submissions || []
          setPatientSubmissions(list)
          if (list.length > 0) {
            const sub = list[0]
            setSelectedTemplateId(sub.templateId)
            setCustomAnswers(JSON.parse(sub.answersJson || '{}'))
            setCustomSubmissionId(sub.id)
          } else {
            setSelectedTemplateId('')
            setCustomAnswers({})
            setCustomSubmissionId(null)
          }
        })
        .catch(() => {
          setPatientSubmissions([])
          setSelectedTemplateId('')
          setCustomAnswers({})
          setCustomSubmissionId(null)
        })

      // Fetch professional profile for PDF name/crp
      fetch('/api/professional/profile')
        .then(res => res.json())
        .then(data => {
          setProfProfile(data)
        })
        .catch(() => {})
    } else if (!patientToEdit) {
      // Reset form when creating new patient
      setFormData({
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
        city: '',
        state: '',
        zipCode: '',
        chiefComplaint: '',
        medicalHistory: '',
        notes: '',
        defaultConsultationType: '',
        defaultConsultationValue: '',
      })
      setSelectedTemplateId('')
      setCustomAnswers({})
      setCustomSubmissionId(null)
      setPatientSubmissions([])
    }
  }, [patientToEdit, open])

  // Fetch templates when modal opens
  useEffect(() => {
    if (open) {
      fetch('/api/professional/custom-anamnese/templates')
        .then(res => res.json())
        .then(data => setTemplates(data.templates || []))
        .catch(() => setTemplates([]))
    }
  }, [open])

  const handleChange = (field: keyof PatientFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    // Validation
    if (!formData.firstName || !formData.lastName) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Nome e sobrenome são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      let savedPatient: any = null
      
      if (patientToEdit) {
        // Update existing patient
        const response = await fetch('/api/professional/patients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: patientToEdit.id,
            ...formData,
            age: formData.age ? parseInt(formData.age) : null,
            dateOfBirth: formData.dateOfBirth || null,
          }),
        })

        if (response.ok) {
          savedPatient = await response.json()
        } else {
          throw new Error('Failed to update patient')
        }
      } else {
        // Create new patient
        const response = await fetch('/api/professional/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            age: formData.age ? parseInt(formData.age) : null,
            dateOfBirth: formData.dateOfBirth || null,
          }),
        })

        if (response.ok) {
          savedPatient = await response.json()
        } else {
          throw new Error('Failed to create patient')
        }
      }

      // If a template is selected, save the custom anamnese answers
      if (savedPatient && selectedTemplateId && selectedTemplateId !== 'none') {
        const subRes = await fetch('/api/professional/custom-anamnese/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: selectedTemplateId,
            patientId: savedPatient.id,
            nomeCompleto: `${savedPatient.firstName} ${savedPatient.lastName}`,
            answersJson: JSON.stringify(customAnswers),
            submissionId: customSubmissionId || undefined,
          }),
        })
        if (!subRes.ok) {
          throw new Error('Failed to save anamnese answers')
        }
      }

      toast({
        title: patientToEdit ? 'Paciente atualizado!' : 'Paciente cadastrado!',
        description: `${formData.firstName} ${formData.lastName} foi salvo com sucesso.`,
      })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save patient:', error)
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o paciente.',
        variant: 'destructive',
        action: <ToastAction altText="Try again">Tentar novamente</ToastAction>,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold">
            {patientToEdit ? 'Editar Paciente' : 'Novo Paciente'}
          </DialogTitle>
          <DialogDescription>
            {patientToEdit 
              ? 'Edite as informações do paciente' 
              : 'Cadastre um novo paciente com suas informações completas'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Photo Section */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {formData.firstName?.charAt(0)}{formData.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/80 transition-colors">
                <Upload className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Foto do Paciente</h4>
              <p className="text-sm text-muted-foreground">
                Adicione uma foto para identificar o paciente
              </p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
              Informações Pessoais
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="Nome"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Sobrenome"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="email@exemplo.com"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => handleChange('whatsapp', e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gênero</Label>
                <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                    <SelectItem value="prefer-not">Prefiro não informar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Idade</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                  placeholder="00"
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
              Endereço
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Logradouro</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Rua, Avenida, etc."
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressNumber">Número</Label>
                <Input
                  id="addressNumber"
                  value={formData.addressNumber}
                  onChange={(e) => handleChange('addressNumber', e.target.value)}
                  placeholder="123"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressComplement">Complemento</Label>
                <Input
                  id="addressComplement"
                  value={formData.addressComplement}
                  onChange={(e) => handleChange('addressComplement', e.target.value)}
                  placeholder="Apto, Sala, etc."
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => handleChange('neighborhood', e.target.value)}
                  placeholder="Seu bairro"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                  placeholder="00000-000"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Sua cidade"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Select value={formData.state} onValueChange={(value) => handleChange('state', value)}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {brazilianStates.map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Health Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
              Informações de Saúde
            </h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chiefComplaint">Queixa Principal</Label>
                <Textarea
                  id="chiefComplaint"
                  value={formData.chiefComplaint}
                  onChange={(e) => handleChange('chiefComplaint', e.target.value)}
                  placeholder="Descreva a queixa principal do paciente..."
                  className="rounded-lg min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicalHistory">Histórico Médico Resumido</Label>
                <Textarea
                  id="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={(e) => handleChange('medicalHistory', e.target.value)}
                  placeholder="Descreva o histórico médico relevante..."
                  className="rounded-lg min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações Adicionais</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Outras observações importantes..."
                  className="rounded-lg min-h-[80px]"
                />
              </div>
            </div>
          </div>

          {/* Default Consultation Settings */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">4</span>
              Configurações Padrão da Consulta
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultConsultationType">Tipo de Consulta Padrão</Label>
                <Select value={formData.defaultConsultationType} onValueChange={(value) => handleChange('defaultConsultationType', value)}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Selecione o tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consulta Inicial">Consulta Inicial</SelectItem>
                    <SelectItem value="Consulta de Retorno">Consulta de Retorno</SelectItem>
                    <SelectItem value="Sessão de Acompanhamento">Sessão de Acompanhamento</SelectItem>
                    <SelectItem value="Teleconsulta">Teleconsulta</SelectItem>
                    <SelectItem value="Avaliação Nutricional">Avaliação Nutricional</SelectItem>
                    <SelectItem value="Acompanhamento Psicológico">Acompanhamento Psicológico</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultConsultationValue">Valor Padrão (R$)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="defaultConsultationValue"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.defaultConsultationValue}
                    onChange={(e) => handleChange('defaultConsultationValue', e.target.value)}
                    placeholder="0,00"
                    className="pl-10 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Anamnese Personalizada */}
          <div className="space-y-4 border-t border-border/40 pt-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">5</span>
              Anamnese Personalizada
            </h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="anamneseTemplate">Modelo de Anamnese Vinculado</Label>
                <Select
                  value={selectedTemplateId || 'none'}
                  onValueChange={(val) => {
                    if (val === 'none') {
                      setSelectedTemplateId('')
                      setCustomAnswers({})
                      setCustomSubmissionId(null)
                    } else {
                      setSelectedTemplateId(val)
                      const existingSub = patientSubmissions.find(s => s.templateId === val)
                      if (existingSub) {
                        setCustomAnswers(JSON.parse(existingSub.answersJson || '{}'))
                        setCustomSubmissionId(existingSub.id)
                      } else {
                        setCustomAnswers({})
                        setCustomSubmissionId(null)
                      }
                    }
                  }}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Selecione o modelo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplateId && selectedTemplateId !== 'none' && (() => {
                const selectedTemplate = templates.find(t => t.id === selectedTemplateId)
                let questionsList: Question[] = []
                if (selectedTemplate) {
                  try {
                    questionsList = JSON.parse(selectedTemplate.questionsJson)
                  } catch {}
                }
                return (
                  <div className="space-y-4 bg-muted/30 border border-border/40 rounded-xl p-4 mt-2">
                    {questionsList.map((q, i) => (
                      <div key={q.id} className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">
                          {i + 1}. {q.label}
                          {q.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <DynamicQuestion
                          question={q}
                          value={customAnswers[q.id]}
                          onChange={(val) => setCustomAnswers(prev => ({ ...prev, [q.id]: val }))}
                        />
                      </div>
                    ))}
                    {questionsList.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">Este modelo de anamnese não possui perguntas.</p>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 flex items-center justify-between sm:justify-between w-full">
          <div className="flex-1 flex justify-start">
            {patientToEdit && (
              <PatientAnamnesePdfButton
                patientId={patientToEdit.id}
                patientName={`${formData.firstName} ${formData.lastName}`}
              />
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading} className="rounded-xl bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
              {loading ? 'Salvando...' : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Paciente
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
