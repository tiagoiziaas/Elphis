'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Loader2, RefreshCw, UserPlus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

interface AnamneseLinkModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AnamneseLinkModal({ open, onOpenChange }: AnamneseLinkModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  // Carrega os templates ao abrir o modal
  useEffect(() => {
    if (open) {
      setLoadingTemplates(true)
      setLink('')
      setExpiresAt('')
      setCopied(false)
      setErrorMsg('')
      setSelectedTemplateId('')
      fetch('/api/professional/custom-anamnese/templates')
        .then(res => res.json())
        .then(data => setTemplates(data.templates || []))
        .catch(() => setTemplates([]))
        .finally(() => setLoadingTemplates(false))
    }
  }, [open])

  const generateLink = async () => {
    if (!selectedTemplateId) return
    setLoading(true)
    setLink('')
    setExpiresAt('')
    setCopied(false)
    setErrorMsg('')
    try {
      const res = await fetch('/api/professional/custom-anamnese/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: selectedTemplateId }),
      })

      let data: any = {}
      try {
        data = await res.json()
      } catch {
        // body não é JSON
      }

      if (!res.ok) {
        const msg = data?.error || `Erro ${res.status}: falha ao gerar link`
        setErrorMsg(msg)
        toast({ title: 'Erro ao gerar link', description: msg, variant: 'destructive' })
        return
      }

      setLink(data.link)
      setExpiresAt(data.expiresAt)
    } catch (e: any) {
      const msg = e?.message || 'Erro de conexão. Verifique sua internet.'
      setErrorMsg(msg)
      toast({ title: 'Erro ao gerar link', description: msg, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: 'Link copiado!', description: 'Agora envie para o responsável pelo paciente.' })
  }

  const handleClose = () => {
    setLink('')
    setExpiresAt('')
    setCopied(false)
    setErrorMsg('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display font-bold">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-violet-600" />
            </div>
            Cadastrar Paciente via Link
          </DialogTitle>
          <DialogDescription>
            Envie este link para o responsável preencher a anamnese infantil.
            O cadastro do paciente é criado automaticamente ao submeter o formulário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">

          {/* Indicador de como funciona */}
          <div className="flex items-start gap-3 p-3 bg-violet-50 border border-violet-200 rounded-xl">
            <UserPlus className="h-4 w-4 text-violet-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-violet-800 leading-relaxed">
              <p className="font-semibold mb-0.5">Como funciona</p>
              <p>O link não está vinculado a nenhum cadastro. O responsável preenche as informações padrão (pessoais, endereço, etc.) e as perguntas da anamnese. Ao enviar, <strong>o paciente é cadastrado automaticamente</strong> com as respostas vinculadas.</p>
            </div>
          </div>

          {/* Seleção do Modelo */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-600">Modelo de Anamnese</Label>
            {loadingTemplates ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="h-4 w-4 text-violet-600 animate-spin" />
                <span className="text-xs text-muted-foreground">Carregando modelos...</span>
              </div>
            ) : (
              <Select
                value={selectedTemplateId}
                onValueChange={(val) => {
                  setSelectedTemplateId(val)
                  setLink('')
                  setExpiresAt('')
                  setErrorMsg('')
                }}
              >
                <SelectTrigger className="rounded-lg h-10 border border-slate-200 bg-white">
                  <SelectValue placeholder="Selecione o modelo de anamnese..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Botão de gerar link quando ainda não gerou */}
          {!link && !loading && !errorMsg && (
            <Button
              onClick={generateLink}
              disabled={!selectedTemplateId}
              className="w-full rounded-xl h-10 text-sm bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 disabled:opacity-50"
            >
              Gerar Link de Cadastro
            </Button>
          )}

          {/* Carregando */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-8 w-8 text-violet-600 animate-spin" />
              <p className="text-sm text-muted-foreground">Gerando link exclusivo...</p>
            </div>
          )}

          {/* Erro */}
          {!loading && errorMsg && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-1">Não foi possível gerar o link</p>
                  <p className="text-xs">{errorMsg}</p>
                </div>
              </div>
              <Button
                onClick={generateLink}
                disabled={loading}
                className="w-full rounded-xl h-10 text-sm bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          )}

          {/* Link gerado */}
          {!loading && !errorMsg && link && (
            <div className="space-y-3">
              {/* Exibição do link */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Link gerado:</p>
                  <p className="text-sm text-slate-800 break-all font-mono bg-white rounded-lg px-3 py-2 border border-slate-200 select-all">
                    {link}
                  </p>
                </div>
                <Button
                  onClick={copyLink}
                  className={`w-full rounded-xl h-10 text-sm transition-all ${
                    copied
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25'
                  } text-white`}
                >
                  {copied
                    ? <><Check className="h-4 w-4 mr-2" />Copiado!</>
                    : <><Copy className="h-4 w-4 mr-2" />Copiar Link</>
                  }
                </Button>
              </div>

              {/* Validade */}
              {expiresAt && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-800">
                    Expira em: <strong>{new Date(expiresAt).toLocaleString('pt-BR')}</strong>
                    {' '}· uso único
                  </p>
                </div>
              )}

              {/* Instruções */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <p className="text-xs font-semibold text-slate-700">Como enviar:</p>
                <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
                  <li>Copie o link acima</li>
                  <li>Envie por WhatsApp, e-mail ou SMS para o responsável</li>
                  <li>O responsável preenche o formulário sem precisar de login</li>
                  <li>O paciente é cadastrado automaticamente ao finalizar</li>
                </ol>
              </div>

              {/* Gerar novo link */}
              <Button
                variant="outline"
                onClick={generateLink}
                disabled={loading || !selectedTemplateId}
                className="w-full rounded-xl h-9 text-sm border-dashed"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Gerar novo link
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
