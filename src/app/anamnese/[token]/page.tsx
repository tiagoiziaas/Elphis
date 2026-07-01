'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Loader2, ClipboardList, ChevronRight, ChevronLeft } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────
interface ProfessionalInfo {
  fullName: string
  specialty: string
  councilType?: string
  councilNumber?: string
}

interface FormData {
  // Identificação
  nomeCompleto: string
  dataNascimento: string
  idade: string
  sexo: string
  escolaridade: string
  endereco: string
  cidade: string
  // Responsáveis
  nomePai: string
  idadePai: string
  estadoCivilPai: string
  rgPai: string
  cpfPai: string
  escolaridadePai: string
  profissaoPai: string
  telefonePai: string
  nomeMae: string
  idadeMae: string
  estadoCivilMae: string
  rgMae: string
  cpfMae: string
  escolaridadeMae: string
  profissaoMae: string
  telefoneMae: string
  encaminhadoPor: string
  // Queixa
  queixa: string
  resideCom: string
  irmaos: string
  adotado: string
  // Gestação
  gestacaoPlanejada: string
  gestacaoDesejada: string
  prenatal: string
  intercorrencias: string
  consumoSubstancias: string
  transfusao: string
  tombo: string
  condicoeNascimento: string
  // Saúde
  acidentes: string
  alergias: string
  bronquiteAsma: string
  visao: string
  audicao: string
  dorcabeca: string
  desmaios: string
  convulsoes: string
  historiaFamiliar: string
  obsSaude: string
  // Alimentação
  amamentacao: string
  alimentacao: string
  forcadaAlimentar: string
  comeSemDerrubar: string
  ajudaAlimentacao: string
  obsAlimentacao: string
  // Sono
  dormeBem: string
  qualidadeSono: string
  falaDormindo: string
  sonambulo: string
  rangeDentes: string
  quartoSeparado: string
  comQuemDorme: string
  acordaCamaPais: string
  obsSono: string
  // Desenvolvimento psicomotor
  comoBebe: string
  lentoTarefas: string
  vesteSozinho: string
  banhaSozinho: string
  calcaSozinho: string
  noCalcados: string
  desastrado: string
  esportes: string
  roiUnhas: string
  chupaDedo: string
  manias: string
  ajudaTarefas: string
  obsMotor: string
  // Escolaridade
  gostaEscola: string
  aceitoPelosAmigos: string
  repetiu: string
  motivoRepetiu: string
  gostaEstudar: string
  habitoLeitura: string
  fazLicoes: string
  paisEstudam: string
  mudouEscola: string
  motivoMudou: string
  matematica: string
  dificuldadeLeitura: string
  irrequieta: string
  circunstancias: string
  dificuldadesEscola: string
  professoresAcham: string
  obsEscola: string
  // Linguagem
  comunicacaoAtual: string
  obsLinguagem: string
  // Sexualidade
  educacaoSexual: string
  dequemEducacaoSexual: string
  comoFoiSexual: string
  curiosidadeSexual: string
  paisConversam: string
  obsSexualidade: string
  // Aspectos ambientais
  brincaSozinha: string
  brincaComIdade: string
  fazAmigos: string
  adaptaMeio: string
  relacaoPais: string
  relacaoIrmaos: string
  medidasDisciplinares: string
  quemUsa: string
  reacoesMedidas: string
  obsAmbiental: string
  // Emocional
  aspectoEmocional: string
  caracteristicas: string[]
  outrasCaracteristicas: string
  reageContrariedade: string
  atividadesPreferidas: string
  obsEmocional: string
  // Rotina
  rotinaDiaria: string
}

const EMPTY_FORM: FormData = {
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

const CARACTERISTICAS = ['Agressiva', 'Passiva', 'Dependente', 'Irrequieta', 'Medrosa', 'Retraída', 'Excitada', 'Desligada']

// ─── Field Components ───────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder = '' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
    />
  )
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="date"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
    />
  )
}

function TextArea({ value, onChange, rows = 3, placeholder = '' }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all resize-none"
    />
  )
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
    >
      <option value="">Selecione</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function RadioGroup({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex gap-4 flex-wrap">
      {options.map(o => (
        <label key={o} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={value === o}
            onChange={() => onChange(o)}
            className="w-4 h-4 accent-violet-600"
          />
          <span className="text-sm text-slate-700">{o}</span>
        </label>
      ))}
    </div>
  )
}

function SectionHeader({ number, title, color = 'violet' }: { number: number; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-100">
      <div className={`w-8 h-8 rounded-xl bg-violet-100 text-violet-700 text-sm font-bold flex items-center justify-center`}>
        {number}
      </div>
      <h2 className="font-bold text-lg text-slate-800">{title}</h2>
    </div>
  )
}

const STEPS = [
  'Identificação',
  'Responsáveis',
  'Queixa & Família',
  'Gestação & Nascimento',
  'Saúde',
  'Alimentação & Sono',
  'Desenvolvimento',
  'Escolaridade',
  'Linguagem & Sexualidade',
  'Aspectos Ambientais',
  'Emocional & Rotina',
]

// ─── Main Page ──────────────────────────────────────────────────────
export default function AnamnesePublicPage() {
  const params = useParams()
  const token = params.token as string

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'expired' | 'used' | 'success'>('loading')
  const [professional, setProfessional] = useState<ProfessionalInfo | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetch(`/api/anamnese/${token}`)
      .then(async r => {
        const d = await r.json()
        if (r.status === 404) setStatus('invalid')
        else if (r.status === 410) setStatus('expired')
        else if (r.status === 409) setStatus('used')
        else if (r.ok) { setProfessional(d.professional); setStatus('valid') }
        else setStatus('invalid')
      })
      .catch(() => setStatus('invalid'))
  }, [token])

  const set = (field: keyof FormData, value: string) => setForm(p => ({ ...p, [field]: value }))

  const toggleCarac = (c: string) => {
    setForm(p => ({
      ...p,
      caracteristicas: p.caracteristicas.includes(c)
        ? p.caracteristicas.filter(x => x !== c)
        : [...p.caracteristicas, c],
    }))
  }

  const handleSubmit = async () => {
    if (!form.nomeCompleto.trim()) {
      setErrorMsg('Por favor, preencha o nome completo do paciente.')
      return
    }
    setSubmitting(true)
    setErrorMsg('')
    try {
      const payload = { ...form, caracteristicas: JSON.stringify(form.caracteristicas) }
      const r = await fetch(`/api/anamnese/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (r.ok) setStatus('success')
      else {
        const d = await r.json()
        setErrorMsg(d.error || 'Erro ao enviar formulário.')
      }
    } catch {
      setErrorMsg('Erro de conexão. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Status screens ──────────────────────────────────────────────
  if (status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-100">
      <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
    </div>
  )

  if (status === 'success') return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-100 p-4">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-3">Cadastro realizado!</h1>
        <p className="text-slate-500">O formulário foi enviado com sucesso. O paciente foi cadastrado e as informações estão disponíveis para o profissional. Obrigado pelo preenchimento!</p>
        <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 text-xs">
          <span>Powered by</span>
          <span className="font-bold text-violet-600">Elphis</span>
        </div>
      </motion.div>
    </div>
  )

  if (status === 'invalid' || status === 'expired' || status === 'used') {
    const msgs: Record<string, { title: string; body: string }> = {
      invalid: { title: 'Link inválido', body: 'Este link de cadastro não é válido. Por favor, solicite um novo link ao profissional.' },
      expired: { title: 'Link expirado', body: 'Este link expirou após 24 horas. Solicite um novo link ao profissional responsável.' },
      used: { title: 'Link já utilizado', body: 'Este formulário já foi preenchido. Caso precise de alterações, entre em contato com o profissional.' },
    }
    const msg = msgs[status]
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-100 p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-3">{msg.title}</h1>
          <p className="text-slate-500">{msg.body}</p>
        </div>
      </div>
    )
  }

  // ─── Steps ───────────────────────────────────────────────────────
  const stepContent = [
    // 0 — Identificação
    <div key="0">
      <SectionHeader number={1} title="Identificação do Paciente" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <Field label="Nome completo do paciente *">
            <TextInput value={form.nomeCompleto} onChange={v => set('nomeCompleto', v)} placeholder="Nome completo" />
          </Field>
        </div>
        <Field label="Data de nascimento">
          <DateInput value={form.dataNascimento} onChange={v => set('dataNascimento', v)} />
        </Field>
        <Field label="Idade">
          <TextInput value={form.idade} onChange={v => set('idade', v)} placeholder="Ex: 7 anos" />
        </Field>
        <Field label="Sexo">
          <RadioGroup value={form.sexo} onChange={v => set('sexo', v)} options={['Masculino', 'Feminino']} />
        </Field>
        <Field label="Escolaridade">
          <SelectInput value={form.escolaridade} onChange={v => set('escolaridade', v)}
            options={['Educação Infantil', '1º ano', '2º ano', '3º ano', '4º ano', '5º ano', '6º ano', '7º ano', '8º ano', '9º ano', '1º EM', '2º EM', '3º EM', 'Sem escolaridade']} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Endereço completo">
            <TextArea value={form.endereco} onChange={v => set('endereco', v)} rows={2} placeholder="Rua, número, bairro, CEP" />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Cidade">
            <TextInput value={form.cidade} onChange={v => set('cidade', v)} placeholder="Cidade" />
          </Field>
        </div>
      </div>
    </div>,

    // 1 — Responsáveis
    <div key="1">
      <SectionHeader number={2} title="Responsáveis" />
      <div className="space-y-8">
        <div>
          <h3 className="font-semibold text-slate-600 mb-4 text-sm uppercase tracking-wider">Pai ou Responsável</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <Field label="Nome completo"><TextInput value={form.nomePai} onChange={v => set('nomePai', v)} /></Field>
            </div>
            <Field label="Idade"><TextInput value={form.idadePai} onChange={v => set('idadePai', v)} /></Field>
            <Field label="Estado civil"><TextInput value={form.estadoCivilPai} onChange={v => set('estadoCivilPai', v)} /></Field>
            <Field label="RG"><TextInput value={form.rgPai} onChange={v => set('rgPai', v)} /></Field>
            <Field label="CPF"><TextInput value={form.cpfPai} onChange={v => set('cpfPai', v)} /></Field>
            <Field label="Escolaridade"><TextInput value={form.escolaridadePai} onChange={v => set('escolaridadePai', v)} /></Field>
            <Field label="Profissão"><TextInput value={form.profissaoPai} onChange={v => set('profissaoPai', v)} /></Field>
            <Field label="Telefone"><TextInput value={form.telefonePai} onChange={v => set('telefonePai', v)} placeholder="(11) 99999-9999" /></Field>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-6">
          <h3 className="font-semibold text-slate-600 mb-4 text-sm uppercase tracking-wider">Mãe ou Responsável</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <Field label="Nome completo"><TextInput value={form.nomeMae} onChange={v => set('nomeMae', v)} /></Field>
            </div>
            <Field label="Idade"><TextInput value={form.idadeMae} onChange={v => set('idadeMae', v)} /></Field>
            <Field label="Estado civil"><TextInput value={form.estadoCivilMae} onChange={v => set('estadoCivilMae', v)} /></Field>
            <Field label="RG"><TextInput value={form.rgMae} onChange={v => set('rgMae', v)} /></Field>
            <Field label="CPF"><TextInput value={form.cpfMae} onChange={v => set('cpfMae', v)} /></Field>
            <Field label="Escolaridade"><TextInput value={form.escolaridadeMae} onChange={v => set('escolaridadeMae', v)} /></Field>
            <Field label="Profissão"><TextInput value={form.profissaoMae} onChange={v => set('profissaoMae', v)} /></Field>
            <Field label="Telefone"><TextInput value={form.telefoneMae} onChange={v => set('telefoneMae', v)} placeholder="(11) 99999-9999" /></Field>
          </div>
        </div>
        <Field label="Encaminhado por">
          <TextInput value={form.encaminhadoPor} onChange={v => set('encaminhadoPor', v)} />
        </Field>
      </div>
    </div>,

    // 2 — Queixa & Família
    <div key="2">
      <SectionHeader number={3} title="Queixa Principal & Família" />
      <div className="space-y-5">
        <Field label="Queixa (motivo da consulta)">
          <TextArea value={form.queixa} onChange={v => set('queixa', v)} rows={4} placeholder="Descreva a queixa principal..." />
        </Field>
        <Field label="Reside com quais familiares ou responsáveis?">
          <TextArea value={form.resideCom} onChange={v => set('resideCom', v)} rows={2} />
        </Field>
        <Field label="Possui irmãos? Quais os nomes, ordens de nascimento e idade?">
          <TextArea value={form.irmaos} onChange={v => set('irmaos', v)} rows={2} />
        </Field>
        <Field label="Adotado?">
          <RadioGroup value={form.adotado} onChange={v => set('adotado', v)} options={['Sim', 'Não']} />
        </Field>
      </div>
    </div>,

    // 3 — Gestação & Nascimento
    <div key="3">
      <SectionHeader number={4} title="Gestação & Condições de Nascimento" />
      <div className="space-y-5">
        <Field label="Gestação planejada?"><TextInput value={form.gestacaoPlanejada} onChange={v => set('gestacaoPlanejada', v)} /></Field>
        <Field label="Gestação desejada?"><TextInput value={form.gestacaoDesejada} onChange={v => set('gestacaoDesejada', v)} /></Field>
        <Field label="Realizou algum pré-natal?"><TextInput value={form.prenatal} onChange={v => set('prenatal', v)} /></Field>
        <Field label="Houve alguma intercorrência durante a gestação? (doenças, separação, conflitos)">
          <TextArea value={form.intercorrencias} onChange={v => set('intercorrencias', v)} rows={3} />
        </Field>
        <Field label="Durante a gestação houve consumo de medicações, cigarros, álcool ou drogas? Se sim, por quanto tempo?">
          <TextArea value={form.consumoSubstancias} onChange={v => set('consumoSubstancias', v)} rows={2} />
        </Field>
        <Field label="Fez alguma transfusão durante a gravidez?"><TextInput value={form.transfusao} onChange={v => set('transfusao', v)} /></Field>
        <Field label="Levou algum tombo?"><TextArea value={form.tombo} onChange={v => set('tombo', v)} rows={2} /></Field>
        <Field label="Condições de nascimento">
          <TextArea value={form.condicoeNascimento} onChange={v => set('condicoeNascimento', v)} rows={3} placeholder="Parto normal, cesárea, peso, APGAR..." />
        </Field>
      </div>
    </div>,

    // 4 — Saúde
    <div key="4">
      <SectionHeader number={5} title="Saúde" />
      <div className="space-y-5">
        <Field label="A criança sofreu algum acidente ou se submeteu a alguma cirurgia?">
          <TextArea value={form.acidentes} onChange={v => set('acidentes', v)} rows={2} />
        </Field>
        <Field label="Possui reações alérgicas?"><TextInput value={form.alergias} onChange={v => set('alergias', v)} /></Field>
        <Field label="Tem bronquite ou asma?"><TextInput value={form.bronquiteAsma} onChange={v => set('bronquiteAsma', v)} /></Field>
        <Field label="Apresenta problemas de visão?"><TextInput value={form.visao} onChange={v => set('visao', v)} /></Field>
        <Field label="E de audição?"><TextInput value={form.audicao} onChange={v => set('audicao', v)} /></Field>
        <Field label="Dor de cabeça?"><TextInput value={form.dorcabeca} onChange={v => set('dorcabeca', v)} /></Field>
        <Field label="Já desmaiou alguma vez? Quando? Como foi?">
          <TextArea value={form.desmaios} onChange={v => set('desmaios', v)} rows={2} />
        </Field>
        <Field label="Teve ou tem convulsões?"><TextInput value={form.convulsoes} onChange={v => set('convulsoes', v)} /></Field>
        <Field label="Há alguém na família que apresenta desmaios, convulsões, ataques?">
          <TextInput value={form.historiaFamiliar} onChange={v => set('historiaFamiliar', v)} />
        </Field>
        <Field label="Observações"><TextArea value={form.obsSaude} onChange={v => set('obsSaude', v)} rows={2} /></Field>
      </div>
    </div>,

    // 5 — Alimentação & Sono
    <div key="5">
      <SectionHeader number={6} title="Alimentação & Sono" />
      <div className="space-y-5">
        <h3 className="font-semibold text-slate-600 text-sm uppercase tracking-wider">Alimentação</h3>
        <Field label="A criança foi amamentada? Até quando?"><TextInput value={form.amamentacao} onChange={v => set('amamentacao', v)} /></Field>
        <Field label="Como é sua alimentação?"><TextArea value={form.alimentacao} onChange={v => set('alimentacao', v)} rows={2} /></Field>
        <Field label="É forçada a se alimentar?"><TextInput value={form.forcadaAlimentar} onChange={v => set('forcadaAlimentar', v)} /></Field>
        <Field label="Come sem derrubar a comida?"><TextInput value={form.comeSemDerrubar} onChange={v => set('comeSemDerrubar', v)} /></Field>
        <Field label="Recebe ajuda na alimentação?"><TextInput value={form.ajudaAlimentacao} onChange={v => set('ajudaAlimentacao', v)} /></Field>
        <Field label="Observações"><TextArea value={form.obsAlimentacao} onChange={v => set('obsAlimentacao', v)} rows={2} /></Field>

        <div className="border-t border-slate-100 pt-5">
          <h3 className="font-semibold text-slate-600 text-sm uppercase tracking-wider mb-4">Sono</h3>
          <div className="space-y-4">
            <Field label="A criança dorme bem?"><TextInput value={form.dormeBem} onChange={v => set('dormeBem', v)} /></Field>
            <Field label="Como é seu sono? (agitado, tranquilo)"><TextInput value={form.qualidadeSono} onChange={v => set('qualidadeSono', v)} /></Field>
            <Field label="Fala dormindo?"><TextInput value={form.falaDormindo} onChange={v => set('falaDormindo', v)} /></Field>
            <Field label="É sonâmbulo?"><TextInput value={form.sonambulo} onChange={v => set('sonambulo', v)} /></Field>
            <Field label="Range os dentes?"><TextInput value={form.rangeDentes} onChange={v => set('rangeDentes', v)} /></Field>
            <Field label="Dorme em quarto separado dos pais?"><TextInput value={form.quartoSeparado} onChange={v => set('quartoSeparado', v)} /></Field>
            <Field label="Com quem dorme?"><TextInput value={form.comQuemDorme} onChange={v => set('comQuemDorme', v)} /></Field>
            <Field label="A criança acorda e vai para a cama dos pais?"><TextInput value={form.acordaCamaPais} onChange={v => set('acordaCamaPais', v)} /></Field>
            <Field label="Observações"><TextArea value={form.obsSono} onChange={v => set('obsSono', v)} rows={2} /></Field>
          </div>
        </div>
      </div>
    </div>,

    // 6 — Desenvolvimento psicomotor
    <div key="6">
      <SectionHeader number={7} title="Desenvolvimento Psicomotor" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2"><Field label="Como era como bebê?"><TextInput value={form.comoBebe} onChange={v => set('comoBebe', v)} /></Field></div>
        <Field label="É lento para realizar alguma tarefa?"><TextInput value={form.lentoTarefas} onChange={v => set('lentoTarefas', v)} /></Field>
        <Field label="Veste-se sozinho?"><TextInput value={form.vesteSozinho} onChange={v => set('vesteSozinho', v)} /></Field>
        <Field label="Toma banho sozinho?"><TextInput value={form.banhaSozinho} onChange={v => set('banhaSozinho', v)} /></Field>
        <Field label="Calça-se sozinho?"><TextInput value={form.calcaSozinho} onChange={v => set('calcaSozinho', v)} /></Field>
        <Field label="Sabe dar nó nos calçados?"><TextInput value={form.noCalcados} onChange={v => set('noCalcados', v)} /></Field>
        <Field label="É desastrado?"><TextInput value={form.desastrado} onChange={v => set('desastrado', v)} /></Field>
        <Field label="Pratica esportes? Quais?"><TextInput value={form.esportes} onChange={v => set('esportes', v)} /></Field>
        <Field label="Rói unhas?"><TextInput value={form.roiUnhas} onChange={v => set('roiUnhas', v)} /></Field>
        <Field label="Chupa o dedo?"><TextInput value={form.chupaDedo} onChange={v => set('chupaDedo', v)} /></Field>
        <div className="md:col-span-2"><Field label="Tem outra mania ou tic? Qual?"><TextInput value={form.manias} onChange={v => set('manias', v)} /></Field></div>
        <div className="md:col-span-2"><Field label="Precisa de ajuda para fazer alguma coisa?"><TextInput value={form.ajudaTarefas} onChange={v => set('ajudaTarefas', v)} /></Field></div>
        <div className="md:col-span-2"><Field label="Observações"><TextArea value={form.obsMotor} onChange={v => set('obsMotor', v)} rows={2} /></Field></div>
      </div>
    </div>,

    // 7 — Escolaridade
    <div key="7">
      <SectionHeader number={8} title="Escolaridade" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="A criança gosta de ir à escola?"><TextInput value={form.gostaEscola} onChange={v => set('gostaEscola', v)} /></Field>
        <Field label="É bem aceita pelos amigos ou é isolada?"><TextInput value={form.aceitoPelosAmigos} onChange={v => set('aceitoPelosAmigos', v)} /></Field>
        <Field label="Já repetiu alguma série?"><TextInput value={form.repetiu} onChange={v => set('repetiu', v)} /></Field>
        <Field label="Por quê repetiu?"><TextInput value={form.motivoRepetiu} onChange={v => set('motivoRepetiu', v)} /></Field>
        <Field label="Gosta de estudar?"><TextInput value={form.gostaEstudar} onChange={v => set('gostaEstudar', v)} /></Field>
        <Field label="Tem hábito de leitura?"><TextInput value={form.habitoLeitura} onChange={v => set('habitoLeitura', v)} /></Field>
        <Field label="Faz as lições que os professores passam?"><TextInput value={form.fazLicoes} onChange={v => set('fazLicoes', v)} /></Field>
        <Field label="Os pais estudam com a criança?"><TextInput value={form.paisEstudam} onChange={v => set('paisEstudam', v)} /></Field>
        <Field label="Mudou muitas vezes de escola?"><TextInput value={form.mudouEscola} onChange={v => set('mudouEscola', v)} /></Field>
        <Field label="Por quê mudou?"><TextInput value={form.motivoMudou} onChange={v => set('motivoMudou', v)} /></Field>
        <Field label="Vai bem em matemática?"><TextInput value={form.matematica} onChange={v => set('matematica', v)} /></Field>
        <Field label="Tem dificuldade em leitura e escrita?"><TextInput value={form.dificuldadeLeitura} onChange={v => set('dificuldadeLeitura', v)} /></Field>
        <Field label="É irrequieta na escola?"><TextInput value={form.irrequieta} onChange={v => set('irrequieta', v)} /></Field>
        <Field label="Em que circunstâncias?"><TextInput value={form.circunstancias} onChange={v => set('circunstancias', v)} /></Field>
        <div className="md:col-span-2"><Field label="Quais as principais dificuldades encontradas na escola?"><TextArea value={form.dificuldadesEscola} onChange={v => set('dificuldadesEscola', v)} rows={2} /></Field></div>
        <div className="md:col-span-2"><Field label="O que os professores acham dela?"><TextInput value={form.professoresAcham} onChange={v => set('professoresAcham', v)} /></Field></div>
        <div className="md:col-span-2"><Field label="Observações"><TextArea value={form.obsEscola} onChange={v => set('obsEscola', v)} rows={2} /></Field></div>
      </div>
    </div>,

    // 8 — Linguagem & Sexualidade
    <div key="8">
      <SectionHeader number={9} title="Linguagem & Sexualidade" />
      <div className="space-y-5">
        <h3 className="font-semibold text-slate-600 text-sm uppercase tracking-wider">Linguagem</h3>
        <Field label="Descreva a comunicação atual:"><TextArea value={form.comunicacaoAtual} onChange={v => set('comunicacaoAtual', v)} rows={3} /></Field>
        <Field label="Observações"><TextArea value={form.obsLinguagem} onChange={v => set('obsLinguagem', v)} rows={2} /></Field>

        <div className="border-t border-slate-100 pt-5">
          <h3 className="font-semibold text-slate-600 text-sm uppercase tracking-wider mb-4">Sexualidade</h3>
          <div className="space-y-4">
            <Field label="Recebeu alguma educação sexual?"><TextInput value={form.educacaoSexual} onChange={v => set('educacaoSexual', v)} /></Field>
            <Field label="De quem?"><TextInput value={form.dequemEducacaoSexual} onChange={v => set('dequemEducacaoSexual', v)} /></Field>
            <Field label="Como foi?"><TextInput value={form.comoFoiSexual} onChange={v => set('comoFoiSexual', v)} /></Field>
            <Field label="Tem curiosidade sexual?"><TextInput value={form.curiosidadeSexual} onChange={v => set('curiosidadeSexual', v)} /></Field>
            <Field label="Os pais conversam sobre sexualidade com a criança?"><TextInput value={form.paisConversam} onChange={v => set('paisConversam', v)} /></Field>
            <Field label="Observações"><TextArea value={form.obsSexualidade} onChange={v => set('obsSexualidade', v)} rows={2} /></Field>
          </div>
        </div>
      </div>
    </div>,

    // 9 — Aspectos ambientais
    <div key="9">
      <SectionHeader number={10} title="Aspectos Ambientais" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Prefere brincar sozinha ou com amigos?"><TextInput value={form.brincaSozinha} onChange={v => set('brincaSozinha', v)} /></Field>
        <Field label="Prefere brincar com crianças maiores ou menores?"><TextInput value={form.brincaComIdade} onChange={v => set('brincaComIdade', v)} /></Field>
        <Field label="Faz amigos com facilidade?"><TextInput value={form.fazAmigos} onChange={v => set('fazAmigos', v)} /></Field>
        <Field label="Adapta-se facilmente ao meio?"><TextInput value={form.adaptaMeio} onChange={v => set('adaptaMeio', v)} /></Field>
        <div className="md:col-span-2"><Field label="Como é o relacionamento da criança com os pais?"><TextInput value={form.relacaoPais} onChange={v => set('relacaoPais', v)} /></Field></div>
        <div className="md:col-span-2"><Field label="E com os irmãos?"><TextInput value={form.relacaoIrmaos} onChange={v => set('relacaoIrmaos', v)} /></Field></div>
        <div className="md:col-span-2"><Field label="Quais as medidas disciplinares normalmente usadas?"><TextArea value={form.medidasDisciplinares} onChange={v => set('medidasDisciplinares', v)} rows={2} /></Field></div>
        <Field label="Quem as usa?"><TextInput value={form.quemUsa} onChange={v => set('quemUsa', v)} /></Field>
        <Field label="Quais as reações da criança frente a essas medidas?"><TextInput value={form.reacoesMedidas} onChange={v => set('reacoesMedidas', v)} /></Field>
        <div className="md:col-span-2"><Field label="Observações"><TextArea value={form.obsAmbiental} onChange={v => set('obsAmbiental', v)} rows={2} /></Field></div>
      </div>
    </div>,

    // 10 — Emocional & Rotina
    <div key="10">
      <SectionHeader number={11} title="Características Emocional & Rotina Diária" />
      <div className="space-y-5">
        <Field label="Como é a criança sob o ponto de vista emocional?">
          <TextArea value={form.aspectoEmocional} onChange={v => set('aspectoEmocional', v)} rows={3} />
        </Field>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Dentre as características abaixo, em quais ela se enquadra mais?
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CARACTERISTICAS.map(c => (
              <label key={c} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${form.caracteristicas.includes(c) ? 'border-violet-400 bg-violet-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <input type="checkbox" checked={form.caracteristicas.includes(c)} onChange={() => toggleCarac(c)} className="w-4 h-4 accent-violet-600" />
                <span className="text-sm text-slate-700">{c}</span>
              </label>
            ))}
          </div>
        </div>
        <Field label="Outros"><TextInput value={form.outrasCaracteristicas} onChange={v => set('outrasCaracteristicas', v)} /></Field>
        <Field label="Como reage quando contrariada?"><TextInput value={form.reageContrariedade} onChange={v => set('reageContrariedade', v)} /></Field>
        <Field label="Atividades preferidas"><TextInput value={form.atividadesPreferidas} onChange={v => set('atividadesPreferidas', v)} /></Field>
        <Field label="Observações"><TextArea value={form.obsEmocional} onChange={v => set('obsEmocional', v)} rows={2} /></Field>

        <div className="border-t border-slate-100 pt-5">
          <Field label="Descreva a rotina da criança desde quando acorda até a hora de dormir">
            <TextArea value={form.rotinaDiaria} onChange={v => set('rotinaDiaria', v)} rows={5} placeholder="Ex: Acorda às 7h, toma café..." />
          </Field>
        </div>
      </div>
    </div>,
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
              <p className="font-bold text-slate-800 text-sm leading-none">Anamnese Infantil · Cadastro do Paciente</p>
              {professional && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {professional.fullName}
                  {professional.councilType && professional.councilNumber ? ` · ${professional.councilType} ${professional.councilNumber}` : ''}
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

      {/* Steps nav */}
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => i <= step && setStep(i)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${i === step ? 'bg-violet-600 text-white' : i < step ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-400'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8"
          >
            {stepContent[step]}
          </motion.div>
        </AnimatePresence>

        {errorMsg && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {errorMsg}
          </div>
        )}

        {/* Navigation buttons */}
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
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><CheckCircle2 className="w-4 h-4" /> Enviar Formulário</>}
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

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-8">
          Suas informações são confidenciais e protegidas. · Powered by{' '}
          <span className="font-semibold text-violet-500">Elphis</span>
        </p>
      </div>
    </div>
  )
}
