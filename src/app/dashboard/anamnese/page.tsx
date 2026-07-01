'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Edit2, Send, Copy, Check, Loader2, ClipboardList,
  FileText, ChevronDown, ChevronUp, X, GripVertical, Link2,
  Eye, Users, AlignLeft, CircleDot, CheckSquare, ChevronDownSquare,
  AlertCircle, Upload, FileUp, Sparkles,
} from 'lucide-react'
import { DashboardHeader } from '../Header'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

// ── Types ────────────────────────────────────────────────────────────────────
type QuestionType = 'text' | 'textarea' | 'radio' | 'checkbox' | 'select'

interface Question {
  id: string
  label: string
  type: QuestionType
  options?: string[]
  required?: boolean
}

interface Template {
  id: string
  title: string
  questionsJson: string
  createdAt: string
  _count: { submissions: number }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 9)
}

const QUESTION_TYPES: { value: QuestionType; label: string; icon: React.ReactNode }[] = [
  { value: 'text', label: 'Texto curto', icon: <AlignLeft className="h-4 w-4" /> },
  { value: 'textarea', label: 'Texto longo', icon: <FileText className="h-4 w-4" /> },
  { value: 'radio', label: 'Múltipla escolha', icon: <CircleDot className="h-4 w-4" /> },
  { value: 'checkbox', label: 'Caixas de seleção', icon: <CheckSquare className="h-4 w-4" /> },
  { value: 'select', label: 'Lista suspensa', icon: <ChevronDownSquare className="h-4 w-4" /> },
]

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
})

// ── PDF Question Extractor ───────────────────────────────────────────────────
// Custom error to signal a password-protected PDF
class PdfPasswordRequiredError extends Error {
  constructor() { super('PasswordRequired') }
}

async function extractQuestionsFromPdf(file: File, password?: string): Promise<string[]> {
  // Dynamically import pdfjs-dist to avoid SSR issues
  const pdfjsLib = await import('pdfjs-dist')

  // Use local worker file (copied to /public) — pdfjs-dist v6+ uses .mjs format
  // CDN not reliable for this version, so we serve from our own domain
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

  const arrayBuffer = await file.arrayBuffer()

  // Wrap in a promise so we can reject on password prompt
  const pdf = await new Promise<any>((resolve, reject) => {
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      ...(password ? { password } : {}),
    })

    // Called when PDF needs a password
    loadingTask.onPassword = (_updatePassword: (pw: string) => void, reason: number) => {
      // reason 1 = first attempt (no password yet), reason 2 = wrong password
      if (reason === 1) {
        reject(new PdfPasswordRequiredError())
      } else {
        reject(new Error('WrongPassword'))
      }
    }

    loadingTask.promise.then(resolve).catch(reject)
  })

  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    
    let pageText = ''
    let lastY: number | null = null
    
    for (const item of content.items as any[]) {
      if (typeof item.str !== 'string') continue
      
      const currentY = item.transform?.[5]
      
      if (lastY !== null && currentY !== undefined && Math.abs(currentY - lastY) > 5) {
        pageText += '\n'
      } else if (pageText && !pageText.endsWith(' ') && !item.str.startsWith(' ')) {
        pageText += ' '
      }
      
      pageText += item.str
      if (currentY !== undefined) {
        lastY = currentY
      }
    }
    
    fullText += pageText + '\n'
  }

  // Split into lines and clean up
  const lines = fullText
    .split(/[\n\r]+/)
    .map(l => l.trim())
    .filter(l => l.length > 3)

  const questions: string[] = []
  const seen = new Set<string>()

  for (const line of lines) {
    // Heuristic 1: Line ends with "?"
    if (line.endsWith('?')) {
      const clean = line.replace(/^\d+[\.\)]\s*/, '').trim()
      if (clean.length >= 5 && !seen.has(clean.toLowerCase())) {
        questions.push(clean)
        seen.add(clean.toLowerCase())
      }
      continue
    }

    // Heuristic 2: Line starts with a number followed by . or )
    if (/^\d{1,3}[\.\)]\s+\S/.test(line)) {
      const clean = line.replace(/^\d{1,3}[\.\)]\s*/, '').trim()
      // Only if it looks like a question (has enough words and not just a title)
      if (clean.length >= 10 && clean.split(' ').length >= 3 && !seen.has(clean.toLowerCase())) {
        questions.push(clean)
        seen.add(clean.toLowerCase())
      }
      continue
    }

    // Heuristic 3: Lines with "Nome:", "Data:", "Qual", "Como", "Descreva", "Informe"
    const questionKeywords = /^(Nome|Data|Qual|Quais|Como|Quando|Onde|Por que|Descreva|Informe|Indique|Relate|Conte|Existe|Possui|Tem |Já |Há |Houve)/i
    if (questionKeywords.test(line) && line.length >= 10 && line.split(' ').length >= 3) {
      const clean = line.replace(/^\d+[\.\)]\s*/, '').trim()
      if (!seen.has(clean.toLowerCase())) {
        questions.push(clean)
        seen.add(clean.toLowerCase())
      }
    }
  }

  return questions
}

// ── Question Editor ───────────────────────────────────────────────────────────
function QuestionEditor({
  question,
  index,
  onChange,
  onRemove,
}: {
  question: Question
  index: number
  onChange: (q: Question) => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const needsOptions = ['radio', 'checkbox', 'select'].includes(question.type)
  const options = question.options || []

  const updateOption = (i: number, val: string) => {
    const next = [...options]
    next[i] = val
    onChange({ ...question, options: next })
  }

  const addOption = () => onChange({ ...question, options: [...options, ''] })

  const removeOption = (i: number) =>
    onChange({ ...question, options: options.filter((_, idx) => idx !== i) })

  return (
    <div className="border border-border/60 rounded-2xl overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
          {index + 1}
        </span>
        <p className="flex-1 text-sm font-medium text-foreground truncate">
          {question.label || <span className="text-muted-foreground italic">Sem título</span>}
        </p>
        <Badge variant="outline" className="text-xs hidden sm:flex">
          {QUESTION_TYPES.find(t => t.value === question.type)?.label}
        </Badge>
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <button
          onClick={onRemove}
          className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center text-red-500 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Label */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Pergunta *</Label>
                <Input
                  value={question.label}
                  onChange={e => onChange({ ...question, label: e.target.value })}
                  placeholder="Ex: Qual o motivo da consulta?"
                  className="h-9 rounded-xl text-sm border-border/60"
                />
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Tipo de resposta</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {QUESTION_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => onChange({ ...question, type: t.value, options: needsOptions && t.value !== question.type ? ['', ''] : question.options })}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        question.type === t.value
                          ? 'border-primary bg-primary/8 text-primary'
                          : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
                      }`}
                    >
                      {t.icon}
                      <span className="text-center leading-tight">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Options (for radio/checkbox/select) */}
              {needsOptions && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Opções</Label>
                  <div className="space-y-2">
                    {options.map((opt, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={opt}
                          onChange={e => updateOption(i, e.target.value)}
                          placeholder={`Opção ${i + 1}`}
                          className="h-8 rounded-xl text-sm border-border/60 flex-1"
                        />
                        <button
                          onClick={() => removeOption(i)}
                          disabled={options.length <= 1}
                          className="w-8 h-8 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center text-red-400 disabled:opacity-30 transition-colors flex-shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      className="rounded-xl h-8 text-xs border-dashed"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar opção
                    </Button>
                  </div>
                </div>
              )}

              {/* Required */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!question.required}
                  onChange={e => onChange({ ...question, required: e.target.checked })}
                  className="w-4 h-4 accent-primary rounded"
                />
                <span className="text-xs text-muted-foreground">Resposta obrigatória</span>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── PDF Import Modal ──────────────────────────────────────────────────────────
function PdfImportModal({
  open,
  onClose,
  onImport,
}: {
  open: boolean
  onClose: () => void
  onImport: (title: string, questions: Question[]) => void
}) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [extractedQuestions, setExtractedQuestions] = useState<Question[]>([])
  const [suggestedTitle, setSuggestedTitle] = useState('')
  const [phase, setPhase] = useState<'upload' | 'password' | 'review'>('upload')
  const [pdfPassword, setPdfPassword] = useState('')
  const [wrongPassword, setWrongPassword] = useState(false)

  const reset = () => {
    setProcessing(false)
    setDragOver(false)
    setFileName('')
    setPendingFile(null)
    setExtractedQuestions([])
    setSuggestedTitle('')
    setPhase('upload')
    setPdfPassword('')
    setWrongPassword(false)
  }

  useEffect(() => {
    if (!open) reset()
  }, [open])

  const processFile = async (file: File, password?: string) => {
    if (!file.name.endsWith('.pdf')) {
      toast({ title: 'Formato inválido', description: 'Por favor, selecione um arquivo PDF.', variant: 'destructive' })
      return
    }

    setFileName(file.name)
    setProcessing(true)
    setWrongPassword(false)

    try {
      const rawQuestions = await extractQuestionsFromPdf(file, password)

      if (rawQuestions.length === 0) {
        toast({
          title: 'Nenhuma pergunta encontrada',
          description: 'Não foi possível identificar perguntas no PDF. Tente criar manualmente ou use um PDF com perguntas mais explícitas.',
          variant: 'destructive',
        })
        setProcessing(false)
        return
      }

      // Convert raw strings to Question objects
      const questions: Question[] = rawQuestions.map(label => ({
        id: uid(),
        label,
        type: 'text' as QuestionType,
        required: false,
      }))

      // Suggest title from filename
      const titleFromFile = file.name
        .replace(/\.pdf$/i, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())

      setExtractedQuestions(questions)
      setSuggestedTitle(titleFromFile)
      setPdfPassword('')
      setPhase('review')
    } catch (err: any) {
      console.error(err)
      if (err instanceof PdfPasswordRequiredError) {
        // PDF is password-protected — ask user for password
        setPendingFile(file)
        setPdfPassword('')
        setPhase('password')
      } else if (err?.message === 'WrongPassword') {
        setWrongPassword(true)
      } else {
        toast({
          title: 'Erro ao processar PDF',
          description: 'Não foi possível ler o arquivo. Certifique-se que é um PDF válido com texto selecionável.',
          variant: 'destructive',
        })
      }
    } finally {
      setProcessing(false)
    }
  }

  const handlePasswordSubmit = async () => {
    if (!pendingFile || !pdfPassword) return
    await processFile(pendingFile, pdfPassword)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const removeQuestion = (id: string) => {
    setExtractedQuestions(prev => prev.filter(q => q.id !== id))
  }

  const updateQuestion = (id: string, label: string) => {
    setExtractedQuestions(prev => prev.map(q => q.id === id ? { ...q, label } : q))
  }

  const handleConfirmImport = () => {
    const validQuestions = extractedQuestions.filter(q => q.label.trim())
    if (validQuestions.length === 0) {
      toast({ title: 'Sem perguntas válidas', variant: 'destructive' })
      return
    }
    onImport(suggestedTitle, validQuestions)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 font-display font-bold">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <FileUp className="h-4 w-4 text-white" />
            </div>
            Importar PDF
          </DialogTitle>
          <DialogDescription>
            {phase === 'upload'
              ? 'Envie um arquivo PDF com as perguntas da sua anamnese'
              : phase === 'password'
              ? `O arquivo "${fileName}" está protegido — insira a senha para continuar`
              : `${extractedQuestions.length} perguntas encontradas — revise antes de criar`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-4 min-h-0">
          {phase === 'upload' && (
            <div className="py-4">
              {/* Drop Zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !processing && fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-all ${
                  dragOver
                    ? 'border-primary bg-primary/5 scale-[1.01]'
                    : 'border-border/60 hover:border-primary/40 hover:bg-muted/30'
                } ${processing ? 'pointer-events-none opacity-60' : ''}`}
              >
                {processing ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-foreground mb-1">Processando PDF...</p>
                      <p className="text-sm text-muted-foreground">{fileName}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${dragOver ? 'bg-gradient-to-br from-primary to-orange-600 shadow-lg shadow-primary/25' : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25'}`}>
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-foreground mb-1">
                        {dragOver ? 'Solte o arquivo aqui' : 'Arraste um PDF ou clique para selecionar'}
                      </p>
                      <p className="text-sm text-muted-foreground">O sistema irá extrair as perguntas automaticamente</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-xl border border-border/60">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Apenas arquivos .PDF</span>
                    </div>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Tips */}
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">Dicas para melhor extração:</p>
                </div>
                <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside pl-1">
                  <li>PDFs com texto selecionável funcionam melhor</li>
                  <li>Perguntas terminadas com &quot;?&quot; são detectadas automaticamente</li>
                  <li>Listas numeradas (1. 2. 3.) também são reconhecidas</li>
                  <li>Você poderá revisar e editar as perguntas antes de salvar</li>
                </ul>
              </div>
            </div>
          )}

          {phase === 'password' && (
            <div className="py-6 flex flex-col items-center gap-6">
              {/* Lock icon */}
              <div className="w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>

              <div className="w-full max-w-sm space-y-3">
                <div className="text-center space-y-1">
                  <p className="font-semibold text-foreground text-sm">{fileName}</p>
                  <p className="text-xs text-muted-foreground">Este PDF está protegido por senha. Insira a senha para extrair as perguntas.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">Senha do PDF</Label>
                  <div className="relative">
                    <Input
                      type="password"
                      value={pdfPassword}
                      onChange={e => { setPdfPassword(e.target.value); setWrongPassword(false) }}
                      onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
                      placeholder="Digite a senha do arquivo"
                      className={`h-10 rounded-xl pr-10 ${
                        wrongPassword
                          ? 'border-red-400 focus:border-red-500 bg-red-50/30 dark:bg-red-900/10'
                          : 'border-border/60'
                      }`}
                      autoFocus
                    />
                    {processing && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  {wrongPassword && (
                    <p className="text-xs text-red-500 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      Senha incorreta. Tente novamente.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {phase === 'review' && (
            <div className="py-2 space-y-4">
              {/* Title input */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Título da anamnese</Label>
                <Input
                  value={suggestedTitle}
                  onChange={e => setSuggestedTitle(e.target.value)}
                  placeholder="Ex: Anamnese Inicial, Triagem..."
                  className="h-10 rounded-xl border-border/60"
                />
              </div>

              {/* Questions list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Perguntas extraídas ({extractedQuestions.filter(q => q.label.trim()).length} válidas)
                  </Label>
                  <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Extraído do PDF
                  </Badge>
                </div>

                <div className="space-y-2">
                  {extractedQuestions.map((q, i) => (
                    <div key={q.id} className="flex items-center gap-2 p-3 rounded-xl border border-border/60 bg-card hover:border-border transition-colors">
                      <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <input
                        type="text"
                        value={q.label}
                        onChange={e => updateQuestion(q.id, e.target.value)}
                        className="flex-1 text-sm bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                      />
                      <button
                        onClick={() => removeQuestion(q.id)}
                        className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center text-red-400 transition-colors flex-shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {extractedQuestions.length === 0 && (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    Todas as perguntas foram removidas. Volte e tente novamente.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/40 flex justify-between gap-3 flex-shrink-0 bg-card">
          <Button
            variant="outline"
            onClick={phase === 'review' ? reset : phase === 'password' ? reset : onClose}
            className="rounded-xl h-9 text-sm"
          >
            {phase === 'review' ? 'Novo PDF' : phase === 'password' ? 'Voltar' : 'Cancelar'}
          </Button>
          {phase === 'password' && (
            <Button
              onClick={handlePasswordSubmit}
              disabled={!pdfPassword || processing}
              className="rounded-xl h-9 text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25"
            >
              {processing ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Verificando...</>
              ) : (
                <>Desbloquear PDF</>
              )}
            </Button>
          )}
          {phase === 'review' && (
            <Button
              onClick={handleConfirmImport}
              disabled={extractedQuestions.filter(q => q.label.trim()).length === 0}
              className="rounded-xl h-9 text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
            >
              <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
              Criar Anamnese com {extractedQuestions.filter(q => q.label.trim()).length} perguntas
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Template Editor Modal ─────────────────────────────────────────────────────
function TemplateEditorModal({
  open,
  onClose,
  onSave,
  editTemplate,
  initialQuestions,
  initialTitle,
}: {
  open: boolean
  onClose: () => void
  onSave: () => void
  editTemplate: Template | null
  initialQuestions?: Question[]
  initialTitle?: string
}) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (editTemplate) {
        setTitle(editTemplate.title)
        try {
          setQuestions(JSON.parse(editTemplate.questionsJson))
        } catch {
          setQuestions([])
        }
      } else if (initialQuestions && initialQuestions.length > 0) {
        // Pre-populate from PDF import
        setTitle(initialTitle || '')
        setQuestions(initialQuestions)
      } else {
        setTitle('')
        setQuestions([{ id: uid(), label: '', type: 'text', required: false }])
      }
    }
  }, [open, editTemplate, initialQuestions, initialTitle])

  const addQuestion = () =>
    setQuestions(prev => [...prev, { id: uid(), label: '', type: 'text', required: false }])

  const updateQuestion = (index: number, q: Question) =>
    setQuestions(prev => prev.map((p, i) => (i === index ? q : p)))

  const removeQuestion = (index: number) =>
    setQuestions(prev => prev.filter((_, i) => i !== index))

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Título obrigatório', variant: 'destructive' })
      return
    }
    const validQuestions = questions.filter(q => q.label.trim())
    if (validQuestions.length === 0) {
      toast({ title: 'Adicione pelo menos uma pergunta', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const method = editTemplate ? 'PUT' : 'POST'
      const body: any = { title, questionsJson: JSON.stringify(validQuestions) }
      if (editTemplate) body.id = editTemplate.id

      const res = await fetch('/api/professional/custom-anamnese/templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error()
      toast({ title: editTemplate ? 'Anamnese atualizada!' : 'Anamnese criada!', description: `"${title}" foi ${editTemplate ? 'atualizada' : 'criada'} com sucesso.` })
      onSave()
      onClose()
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 font-display font-bold">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <ClipboardList className="h-4 w-4 text-white" />
            </div>
            {editTemplate ? 'Editar Anamnese' : 'Nova Anamnese'}
          </DialogTitle>
          <DialogDescription>
            Crie seu formulário personalizado com as perguntas que desejar
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 min-h-0">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Título do formulário *</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Anamnese Infantil, Avaliação Inicial, Triagem..."
              className="h-10 rounded-xl border-border/60"
            />
          </div>

          {/* Questions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground">
                Perguntas ({questions.filter(q => q.label.trim()).length} válidas)
              </Label>
            </div>

            <AnimatePresence>
              {questions.map((q, i) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <QuestionEditor
                    question={q}
                    index={i}
                    onChange={updated => updateQuestion(i, updated)}
                    onRemove={() => removeQuestion(i)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            <Button
              variant="outline"
              onClick={addQuestion}
              className="w-full rounded-xl h-11 border-dashed border-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar pergunta
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/40 flex justify-end gap-3 flex-shrink-0 bg-card">
          <Button variant="outline" onClick={onClose} className="rounded-xl h-9 text-sm">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl h-9 text-sm bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg shadow-primary/25"
          >
            {saving ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Salvando...</> : 'Salvar Anamnese'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnamnesePage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<Template[]>([])
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editTemplate, setEditTemplate] = useState<Template | null>(null)
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)
  const [pdfImportedQuestions, setPdfImportedQuestions] = useState<Question[]>([])
  const [pdfImportedTitle, setPdfImportedTitle] = useState('')

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/professional/custom-anamnese/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
      }
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') fetchTemplates()
  }, [status, fetchTemplates])

  if (status === 'unauthenticated') redirect('/login')

  const handleDelete = async (template: Template) => {
    if (!confirm(`Excluir "${template.title}"? Esta ação não pode ser desfeita.`)) return
    try {
      const res = await fetch(`/api/professional/custom-anamnese/templates?id=${template.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Anamnese excluída', description: `"${template.title}" foi removida.` })
        fetchTemplates()
      } else throw new Error()
    } catch {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  const handlePdfImport = (title: string, questions: Question[]) => {
    setPdfImportedTitle(title)
    setPdfImportedQuestions(questions)
    setEditTemplate(null)
    setIsPdfModalOpen(false)
    setIsEditorOpen(true)
  }

  return (
    <>
      <DashboardHeader />
      <DashboardLayout>
        {/* Header */}
        <motion.div {...stagger(0)} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-1">Anamneses</h1>
            <p className="text-muted-foreground text-sm">Crie formulários personalizados e envie por link para seus pacientes</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* PDF Import Button */}
            <Button
              onClick={() => setIsPdfModalOpen(true)}
              variant="outline"
              className="rounded-xl border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 h-10 text-sm gap-1.5"
            >
              <FileUp className="h-4 w-4" />
              Importar PDF
            </Button>
            <Button
              onClick={() => { setEditTemplate(null); setPdfImportedQuestions([]); setPdfImportedTitle(''); setIsEditorOpen(true) }}
              className="rounded-xl bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg shadow-primary/25 h-10 text-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Nova Anamnese
            </Button>
          </div>
        </motion.div>

        <motion.div {...stagger(1)} className="grid grid-cols-2 gap-4 mb-6">
          {[
            { icon: ClipboardList, label: 'Formulários', value: templates.length, gradient: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/25' },
            { icon: Send, label: 'Prontos para Envio', value: templates.length, gradient: 'from-emerald-500 to-green-600', glow: 'shadow-emerald-500/25' },
          ].map((s, i) => (
            <div key={i} className="dash-card p-4 flex items-center gap-3 group">
              <div className={`w-11 h-11 bg-gradient-to-br ${s.gradient} rounded-xl flex items-center justify-center shadow-lg ${s.glow} group-hover:scale-110 transition-transform duration-200`}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-xl text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Templates List */}
        <motion.div {...stagger(2)}>
          {loading ? (
            <div className="dash-card p-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : templates.length === 0 ? (
            <div className="dash-card p-12 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-xl shadow-violet-500/30">
                <ClipboardList className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Crie sua primeira anamnese</h2>
              <p className="text-muted-foreground text-sm max-w-md mb-6">
                Monte formulários personalizados com suas próprias perguntas e envie por link para que os pacientes preencham antes da consulta.
                <br /><br />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Dica: use o botão &quot;Importar PDF&quot; para criar uma anamnese automaticamente a partir de um documento existente!</span>
              </p>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setIsPdfModalOpen(true)}
                  variant="outline"
                  className="rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 h-10 text-sm gap-1.5"
                >
                  <FileUp className="h-4 w-4" />
                  Importar PDF
                </Button>
                <Button
                  onClick={() => { setEditTemplate(null); setPdfImportedQuestions([]); setPdfImportedTitle(''); setIsEditorOpen(true) }}
                  className="rounded-xl bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg shadow-primary/25 h-10 text-sm"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Criar Anamnese
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template, i) => {
                let questionCount = 0
                try { questionCount = JSON.parse(template.questionsJson).length } catch {}

                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="dash-card p-5 flex flex-col gap-4 hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25 flex-shrink-0">
                        <ClipboardList className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground text-sm leading-tight truncate">{template.title}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs rounded-lg border-border/60">
                            {questionCount} pergunta{questionCount !== 1 ? 's' : ''}
                          </Badge>
                          <Badge variant="outline" className="text-xs rounded-lg border-border/60 text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800">
                            {template._count?.submissions ?? 0} resposta{(template._count?.submissions ?? 0) !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Criado em {new Date(template.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>

                    <div className="flex gap-2 pt-1 border-t border-border/40 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setEditTemplate(template); setPdfImportedQuestions([]); setPdfImportedTitle(''); setIsEditorOpen(true) }}
                        className="rounded-xl h-8 text-xs text-foreground hover:bg-muted gap-1.5"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template)}
                        className="rounded-xl h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir
                      </Button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </DashboardLayout>

      {/* Modals */}
      <PdfImportModal
        open={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onImport={handlePdfImport}
      />
      <TemplateEditorModal
        open={isEditorOpen}
        onClose={() => { setIsEditorOpen(false); setPdfImportedQuestions([]); setPdfImportedTitle('') }}
        onSave={fetchTemplates}
        editTemplate={editTemplate}
        initialQuestions={pdfImportedQuestions}
        initialTitle={pdfImportedTitle}
      />

    </>
  )
}
