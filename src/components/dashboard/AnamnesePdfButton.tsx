'use client'

import { useState, useRef } from 'react'
import { X, Download, Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

interface AnamnesePdfButtonProps {
  anamnese: Record<string, any>
  professionalName?: string
  crp?: string
}

const CARACTERISTICAS_LABELS: Record<string, string> = {
  Agressiva: 'Agressiva', Passiva: 'Passiva', Dependente: 'Dependente',
  Irrequieta: 'Irrequieta', Medrosa: 'Medrosa', Retraída: 'Retraída',
  Excitada: 'Excitada', Desligada: 'Desligada',
}

function formatDate(d?: string) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('pt-BR')
  } catch { return d }
}

function val(v: any) {
  if (!v || v === 'null') return '_______________________________'
  return String(v)
}

function yesno(v: any) {
  if (!v || v === 'null') return '[ ] sim  [ ] não'
  if (v === 'Sim') return '[X] sim  [ ] não'
  if (v === 'Não') return '[ ] sim  [X] não'
  return v
}

export function AnamnesePdfButton({ anamnese, professionalName, crp }: AnamnesePdfButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const generatePdf = async () => {
    setLoading(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const pageW = 210
      const pageH = 297
      const margin = 18
      const contentW = pageW - margin * 2
      let y = margin

      // Font helper
      const setFont = (size: number, style: 'normal' | 'bold' = 'normal') => {
        doc.setFontSize(size)
        doc.setFont('helvetica', style)
      }

      // Color helpers
      const setColor = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        doc.setTextColor(r, g, b)
      }

      const setFillColor = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        doc.setFillColor(r, g, b)
      }

      const checkNewPage = (neededH: number = 15) => {
        if (y + neededH > pageH - 30) {
          doc.addPage()
          drawFooter()
          y = margin + 10
        }
      }

      const drawFooter = () => {
        const footerY = pageH - 14
        doc.setDrawColor(220, 220, 230)
        doc.setLineWidth(0.3)
        doc.line(margin, footerY - 4, pageW - margin, footerY - 4)
        setFont(7)
        setColor('#7c3aed')
        doc.text('Elphis - Plataforma de Saúde', margin, footerY)
        setColor('#64748b')
        doc.text(`São Paulo - ${new Date().toLocaleDateString('pt-BR')}`, pageW / 2, footerY, { align: 'center' })
        doc.text(`Pág. ${(doc as any).internal.getCurrentPageInfo().pageNumber}`, pageW - margin, footerY, { align: 'right' })
      }

      const addText = (text: string, x: number, maxW: number, lineH: number = 5) => {
        const lines = doc.splitTextToSize(text || '-', maxW)
        checkNewPage(lines.length * lineH + 2)
        doc.text(lines, x, y)
        y += lines.length * lineH
      }

      const addField = (label: string, value: string, indent: number = 0) => {
        checkNewPage(12)
        const x = margin + indent
        const w = contentW - indent
        setFont(8, 'bold')
        setColor('#374151')
        doc.text(label, x, y)
        y += 4.5
        setFont(8)
        setColor('#1e293b')
        addText(value || '—', x + 2, w - 2, 4.5)
        y += 1
      }

      const addSection = (title: string, num: string) => {
        checkNewPage(18)
        y += 5
        setFillColor('#7c3aed')
        doc.roundedRect(margin, y - 5, contentW, 9, 1.5, 1.5, 'F')
        setFont(10, 'bold')
        setColor('#ffffff')
        doc.text(`${num}. ${title}`, margin + 3, y)
        y += 7
        setColor('#1e293b')
      }

      const addRow = (pairs: [string, string][], cols: number = 2) => {
        checkNewPage(14)
        const colW = contentW / cols
        const startY = y
        let maxY = y
        pairs.forEach(([label, value], i) => {
          const colX = margin + (i % cols) * colW
          const colY = startY + Math.floor(i / cols) * 14
          doc.setFontSize(7.5)
          doc.setFont('helvetica', 'bold')
          setColor('#374151')
          doc.text(label, colX, colY)
          doc.setFont('helvetica', 'normal')
          setColor('#1e293b')
          const lines = doc.splitTextToSize(value || '—', colW - 2)
          doc.text(lines.slice(0, 2), colX + 1, colY + 4)
          const afterY = colY + 4 + Math.min(lines.length, 2) * 4
          if (afterY > maxY) maxY = afterY
        })
        y = maxY + 3
      }

      // ─── HEADER ─────────────────────────────────────────────────
      // Logo area - gradient rectangle
      setFillColor('#7c3aed')
      doc.roundedRect(margin, y, contentW, 24, 2, 2, 'F')

      // Logo circle
      setFillColor('#ffffff')
      doc.circle(margin + 12, y + 12, 8, 'F')
      setFont(8, 'bold')
      setColor('#7c3aed')
      doc.text('E', margin + 9.5, y + 13.5)

      // Title
      setFont(14, 'bold')
      setColor('#ffffff')
      doc.text('COLETA DE DADOS - PSICOLOGIA', margin + 23, y + 8)
      setFont(10)
      doc.text('ANAMNESE INFANTIL', margin + 23, y + 15)

      // Date top right
      setFont(8)
      doc.setTextColor(240, 240, 255)
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageW - margin - 2, y + 8, { align: 'right' })

      y += 28

      // Professional info bar
      setFillColor('#f3e8ff')
      doc.roundedRect(margin, y, contentW, 8, 1, 1, 'F')
      setFont(8, 'bold')
      setColor('#6d28d9')
      doc.text(`Psicóloga: ${professionalName || anamnese.professionalProfile?.fullName || '___________________'}`, margin + 3, y + 5.5)
      if (crp || anamnese.professionalProfile?.councilNumber) {
        doc.text(`CRP: ${crp || anamnese.professionalProfile?.councilNumber || '___________'}`, pageW - margin - 2, y + 5.5, { align: 'right' })
      }
      y += 12

      // ─── SEÇÃO 1: IDENTIFICAÇÃO ─────────────────────────────────
      addSection('IDENTIFICAÇÃO DO PACIENTE', '1')

      addRow([
        ['Nome Completo', val(anamnese.nomeCompleto)],
      ], 1)
      addRow([
        ['Data de Nascimento', formatDate(anamnese.dataNascimento)],
        ['Idade', val(anamnese.idade)],
        ['Sexo', val(anamnese.sexo)],
        ['Escolaridade', val(anamnese.escolaridade)],
      ])
      addField('Endereço Completo', val(anamnese.endereco))
      addField('Cidade', val(anamnese.cidade))

      // ─── SEÇÃO 2: RESPONSÁVEIS ────────────────────────────────────
      addSection('NOME COMPLETO DOS RESPONSÁVEIS', '2')

      checkNewPage(10)
      setFont(8.5, 'bold'); setColor('#6d28d9')
      doc.text('Pai ou Responsável:', margin, y); y += 5

      addRow([
        ['Nome Completo', val(anamnese.nomePai)],
      ], 1)
      addRow([
        ['Idade', val(anamnese.idadePai)],
        ['Estado Civil', val(anamnese.estadoCivilPai)],
        ['RG', val(anamnese.rgPai)],
        ['CPF', val(anamnese.cpfPai)],
        ['Escolaridade', val(anamnese.escolaridadePai)],
        ['Profissão', val(anamnese.profissaoPai)],
        ['Telefone', val(anamnese.telefonePai)],
      ])

      checkNewPage(10)
      setFont(8.5, 'bold'); setColor('#6d28d9')
      doc.text('Mãe ou Responsável:', margin, y); y += 5

      addRow([
        ['Nome Completo', val(anamnese.nomeMae)],
      ], 1)
      addRow([
        ['Idade', val(anamnese.idadeMae)],
        ['Estado Civil', val(anamnese.estadoCivilMae)],
        ['RG', val(anamnese.rgMae)],
        ['CPF', val(anamnese.cpfMae)],
        ['Escolaridade', val(anamnese.escolaridadeMae)],
        ['Profissão', val(anamnese.profissaoMae)],
        ['Telefone', val(anamnese.telefoneMae)],
      ])

      addField('Encaminhado por', val(anamnese.encaminhadoPor))

      // ─── SEÇÃO 3: QUEIXA ─────────────────────────────────────────
      addSection('QUEIXA PRINCIPAL', '3')
      addField('Queixa', val(anamnese.queixa))
      addField('Reside com quais familiares ou responsáveis?', val(anamnese.resideCom))
      addField('Possui irmãos? Nomes, ordens de nascimento e idade?', val(anamnese.irmaos))
      addRow([
        ['Adotado?', yesno(anamnese.adotado)],
      ], 1)

      // ─── SEÇÃO 4: GESTAÇÃO ──────────────────────────────────────
      addSection('GESTAÇÃO', '4')
      addRow([
        ['Gestação planejada?', val(anamnese.gestacaoPlanejada)],
        ['Gestação desejada?', val(anamnese.gestacaoDesejada)],
        ['Realizou pré-natal?', val(anamnese.prenatal)],
      ])
      addField('Intercorrências durante a gestação (doenças, separação, conflitos)?', val(anamnese.intercorrencias))
      addField('Consumo de medicações, cigarros, álcool ou drogas durante a gestação?', val(anamnese.consumoSubstancias))
      addRow([
        ['Transfusão durante a gravidez?', val(anamnese.transfusao)],
        ['Levou algum tombo?', val(anamnese.tombo)],
      ])
      addField('Condições de nascimento', val(anamnese.condicoeNascimento))

      // ─── SEÇÃO 5: SAÚDE ─────────────────────────────────────────
      addSection('SAÚDE', '5')
      addField('Acidentes ou cirurgias?', val(anamnese.acidentes))
      addRow([
        ['Reações alérgicas?', val(anamnese.alergias)],
        ['Bronquite ou asma?', val(anamnese.bronquiteAsma)],
        ['Problemas de visão?', val(anamnese.visao)],
        ['Problemas de audição?', val(anamnese.audicao)],
        ['Dor de cabeça?', val(anamnese.dorcabeca)],
        ['Já desmaiou?', val(anamnese.desmaios)],
        ['Convulsões?', val(anamnese.convulsoes)],
        ['Histórico familiar (desmaios, ataques)?', val(anamnese.historiaFamiliar)],
      ])
      addField('Observações', val(anamnese.obsSaude))

      // ─── SEÇÃO 6: ALIMENTAÇÃO ───────────────────────────────────
      addSection('ALIMENTAÇÃO', '6')
      addRow([
        ['Foi amamentada? Até quando?', val(anamnese.amamentacao)],
        ['É forçada a se alimentar?', val(anamnese.forcadaAlimentar)],
        ['Come sem derrubar a comida?', val(anamnese.comeSemDerrubar)],
        ['Recebe ajuda na alimentação?', val(anamnese.ajudaAlimentacao)],
      ])
      addField('Como é sua alimentação?', val(anamnese.alimentacao))
      addField('Observações', val(anamnese.obsAlimentacao))

      // ─── SEÇÃO 7: SONO ──────────────────────────────────────────
      addSection('SONO', '7')
      addRow([
        ['A criança dorme bem?', val(anamnese.dormeBem)],
        ['Como é seu sono?', val(anamnese.qualidadeSono)],
        ['Fala dormindo?', val(anamnese.falaDormindo)],
        ['É sonâmbulo?', val(anamnese.sonambulo)],
        ['Range os dentes?', val(anamnese.rangeDentes)],
        ['Quarto separado dos pais?', val(anamnese.quartoSeparado)],
        ['Com quem dorme?', val(anamnese.comQuemDorme)],
        ['Acorda e vai para cama dos pais?', val(anamnese.acordaCamaPais)],
      ])
      addField('Observações', val(anamnese.obsSono))

      // ─── SEÇÃO 8: DESENVOLVIMENTO PSICOMOTOR ────────────────────
      addSection('DESENVOLVIMENTO PSICOMOTOR', '8')
      addRow([
        ['Como era como bebê?', val(anamnese.comoBebe)],
        ['É lento para realizar tarefas?', val(anamnese.lentoTarefas)],
        ['Veste-se sozinho?', val(anamnese.vesteSozinho)],
        ['Toma banho sozinho?', val(anamnese.banhaSozinho)],
        ['Calça-se sozinho?', val(anamnese.calcaSozinho)],
        ['Sabe dar nó nos calçados?', val(anamnese.noCalcados)],
        ['É desastrado?', val(anamnese.desastrado)],
        ['Pratica esportes? Quais?', val(anamnese.esportes)],
        ['Rói unhas?', val(anamnese.roiUnhas)],
        ['Chupa o dedo?', val(anamnese.chupaDedo)],
        ['Tem mania ou tic?', val(anamnese.manias)],
        ['Precisa de ajuda para alguma coisa?', val(anamnese.ajudaTarefas)],
      ])
      addField('Observações', val(anamnese.obsMotor))

      // ─── SEÇÃO 9: ESCOLARIDADE ──────────────────────────────────
      addSection('ESCOLARIDADE', '9')
      addRow([
        ['Gosta de ir à escola?', val(anamnese.gostaEscola)],
        ['É aceita pelos amigos ou isolada?', val(anamnese.aceitoPelosAmigos)],
        ['Já repetiu a série?', val(anamnese.repetiu)],
        ['Por quê repetiu?', val(anamnese.motivoRepetiu)],
        ['Gosta de estudar?', val(anamnese.gostaEstudar)],
        ['Tem hábito de leitura?', val(anamnese.habitoLeitura)],
        ['Faz as lições?', val(anamnese.fazLicoes)],
        ['Os pais estudam com ela?', val(anamnese.paisEstudam)],
        ['Mudou muitas vezes de escola?', val(anamnese.mudouEscola)],
        ['Por quê mudou?', val(anamnese.motivoMudou)],
        ['Vai bem em matemática?', val(anamnese.matematica)],
        ['Dificuldade em leitura e escrita?', val(anamnese.dificuldadeLeitura)],
        ['É irrequieta na escola?', val(anamnese.irrequieta)],
        ['Em que circunstâncias?', val(anamnese.circunstancias)],
        ['O que os professores acham?', val(anamnese.professoresAcham)],
      ])
      addField('Principais dificuldades na escola?', val(anamnese.dificuldadesEscola))
      addField('Observações', val(anamnese.obsEscola))

      // ─── SEÇÃO 10: LINGUAGEM ─────────────────────────────────────
      addSection('LINGUAGEM', '10')
      addField('Descreva a comunicação atual:', val(anamnese.comunicacaoAtual))
      addField('Observações', val(anamnese.obsLinguagem))

      // ─── SEÇÃO 11: SEXUALIDADE ────────────────────────────────────
      addSection('SEXUALIDADE', '11')
      addRow([
        ['Recebeu educação sexual?', val(anamnese.educacaoSexual)],
        ['De quem?', val(anamnese.dequemEducacaoSexual)],
        ['Como foi?', val(anamnese.comoFoiSexual)],
        ['Tem curiosidade sexual?', val(anamnese.curiosidadeSexual)],
        ['Os pais conversam sobre sexualidade?', val(anamnese.paisConversam)],
      ])
      addField('Observações', val(anamnese.obsSexualidade))

      // ─── SEÇÃO 12: ASPECTOS AMBIENTAIS ───────────────────────────
      addSection('ASPECTOS AMBIENTAIS', '12')
      addRow([
        ['Prefere brincar sozinha ou com amigos?', val(anamnese.brincaSozinha)],
        ['Prefere crianças maiores ou menores?', val(anamnese.brincaComIdade)],
        ['Faz amigos com facilidade?', val(anamnese.fazAmigos)],
        ['Adapta-se facilmente ao meio?', val(anamnese.adaptaMeio)],
        ['Relacionamento com os pais?', val(anamnese.relacaoPais)],
        ['Relacionamento com os irmãos?', val(anamnese.relacaoIrmaos)],
        ['Quem usa as medidas disciplinares?', val(anamnese.quemUsa)],
        ['Reações da criança às medidas?', val(anamnese.reacoesMedidas)],
      ])
      addField('Medidas disciplinares normalmente usadas:', val(anamnese.medidasDisciplinares))
      addField('Observações', val(anamnese.obsAmbiental))

      // ─── SEÇÃO 13: CARACTERÍSTICAS EMOCIONAL ─────────────────────
      addSection('CARACTERÍSTICAS PESSOAIS E AFETIVO-EMOCIONAIS', '13')
      addField('Como é a criança sob o ponto de vista emocional?', val(anamnese.aspectoEmocional))

      // Characteristics checkboxes
      checkNewPage(20)
      setFont(8, 'bold'); setColor('#374151')
      doc.text('Características:', margin, y); y += 5
      const caracList = (() => {
        try {
          const raw = anamnese.caracteristicas
          if (!raw) return []
          if (Array.isArray(raw)) return raw
          return JSON.parse(raw)
        } catch { return [] }
      })()

      const CARAC_ALL = ['Agressiva', 'Passiva', 'Dependente', 'Irrequieta', 'Medrosa', 'Retraída', 'Excitada', 'Desligada']
      setFont(8)
      CARAC_ALL.forEach((c, i) => {
        const checked = caracList.includes(c)
        const xPos = margin + (i % 4) * (contentW / 4)
        const yPos = y + Math.floor(i / 4) * 7
        setColor('#374151')
        doc.text(`${checked ? '[X]' : '[ ]'} ${c}`, xPos, yPos)
      })
      y += Math.ceil(CARAC_ALL.length / 4) * 7 + 3

      addField('Outros:', val(anamnese.outrasCaracteristicas))
      addField('Como reage quando contrariada?', val(anamnese.reageContrariedade))
      addField('Atividades preferidas:', val(anamnese.atividadesPreferidas))
      addField('Observações', val(anamnese.obsEmocional))

      // ─── SEÇÃO 14: ROTINA DIÁRIA ──────────────────────────────────
      addSection('ATIVIDADES DIÁRIAS DA CRIANÇA', '14')
      addField('Descreva a rotina da criança desde quando acorda até a hora de dormir:', val(anamnese.rotinaDiaria))

      // ─── ASSINATURA ──────────────────────────────────────────────
      checkNewPage(30)
      y += 10
      doc.setDrawColor(180, 180, 195)
      doc.setLineWidth(0.4)
      const sigX = pageW / 2
      doc.line(sigX - 40, y, sigX + 40, y)
      setFont(8)
      setColor('#64748b')
      doc.text(professionalName || anamnese.professionalProfile?.fullName || '___________________', sigX, y + 5, { align: 'center' })
      doc.text(`Psicóloga${crp ? ' - CRP: ' + crp : ''}`, sigX, y + 10, { align: 'center' })

      // Draw footer on all pages
      const totalPages = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        drawFooter()
      }

      // Save
      const filename = `anamnese_${(anamnese.nomeCompleto || 'paciente').replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(filename)

      toast({ title: 'PDF gerado!', description: `Arquivo "${filename}" baixado com sucesso.` })
    } catch (e) {
      console.error(e)
      toast({ title: 'Erro ao gerar PDF', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={generatePdf}
      disabled={loading}
      variant="outline"
      size="sm"
      className="rounded-lg border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-400"
    >
      {loading
        ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Gerando...</>
        : <><Download className="h-3.5 w-3.5 mr-1.5" />Exportar PDF</>
      }
    </Button>
  )
}
