'use client'

import { useState } from 'react'
import { Download, Loader2, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

interface PatientAnamnesePdfButtonProps {
  patientId: string
  patientName: string
  professionalName?: string
  crp?: string
}

export function PatientAnamnesePdfButton({
  patientId,
  patientName,
  professionalName,
  crp,
}: PatientAnamnesePdfButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleDownload = async () => {
    setLoading(true)
    try {
      // 1. Fetch both legacy and custom submissions
      const [legacyRes, customRes] = await Promise.all([
        fetch(`/api/professional/anamnese?patientId=${patientId}`),
        fetch(`/api/professional/custom-anamnese/submissions?patientId=${patientId}`),
      ])

      const legacyData = await legacyRes.json()
      const customData = await customRes.json()

      const legacyList = legacyData.anamneses || []
      const customList = customData.submissions || []

      if (legacyList.length === 0 && customList.length === 0) {
        toast({
          title: 'Sem anamnese',
          description: 'Este paciente ainda não possui nenhuma anamnese preenchida.',
          variant: 'destructive',
        })
        return
      }

      // Fetch professional profile for PDF name/crp if not provided
      let profName = professionalName || ''
      let profCrp = crp || ''
      if (!profName) {
        try {
          const res = await fetch('/api/professional/profile')
          const data = await res.json()
          if (data.fullName) profName = data.fullName
          if (data.councilNumber) profCrp = data.councilNumber
        } catch {}
      }

      // 2. Generate PDF
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const pageW = 210
      const pageH = 297
      const margin = 18
      const contentW = pageW - margin * 2
      let y = margin

      // Helpers
      const setFont = (size: number, style: 'normal' | 'bold' = 'normal') => {
        doc.setFontSize(size)
        doc.setFont('helvetica', style)
      }

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

      const checkNewPage = (neededH: number = 15) => {
        if (y + neededH > pageH - 30) {
          doc.addPage()
          drawFooter()
          y = margin + 10
        }
      }

      const drawHeader = (title: string, subtitle: string) => {
        setFillColor('#7c3aed')
        doc.roundedRect(margin, y, contentW, 24, 2, 2, 'F')

        setFillColor('#ffffff')
        doc.circle(margin + 12, y + 12, 8, 'F')
        setFont(8, 'bold')
        setColor('#7c3aed')
        doc.text('E', margin + 9.5, y + 13.5)

        setFont(12, 'bold')
        setColor('#ffffff')
        doc.text(title.toUpperCase(), margin + 23, y + 9)
        setFont(9)
        doc.text(subtitle.toUpperCase(), margin + 23, y + 15)

        setFont(8)
        doc.setTextColor(240, 240, 255)
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageW - margin - 2, y + 9, { align: 'right' })

        y += 28

        setFillColor('#f3e8ff')
        doc.roundedRect(margin, y, contentW, 8, 1, 1, 'F')
        setFont(8, 'bold')
        setColor('#6d28d9')
        doc.text(`Profissional: ${profName || '___________________'}`, margin + 3, y + 5.5)
        if (profCrp) {
          doc.text(`Registro/CRP: ${profCrp}`, pageW - margin - 2, y + 5.5, { align: 'right' })
        }
        y += 12
      }

      const drawSignature = () => {
        checkNewPage(30)
        y += 10
        doc.setDrawColor(180, 180, 195)
        doc.setLineWidth(0.4)
        const sigX = pageW / 2
        doc.line(sigX - 40, y, sigX + 40, y)
        setFont(8)
        setColor('#64748b')
        doc.text(profName || '___________________', sigX, y + 5, { align: 'center' })
        doc.text(`Assinatura do Profissional`, sigX, y + 10, { align: 'center' })
      }

      // Check which one to download (prefer custom submission if most recent, or legacy if available)
      const hasLegacy = legacyList.length > 0
      const hasCustom = customList.length > 0

      if (hasCustom && (!hasLegacy || new Date(customList[0].createdAt) > new Date(legacyList[0].createdAt))) {
        // ─── GENERATE CUSTOM PDF ───
        const sub = customList[0]
        const templateTitle = sub.template?.title || 'Anamnese Personalizada'
        let questions: any[] = []
        try {
          questions = JSON.parse(sub.template?.questionsJson || '[]')
        } catch {}

        let answers: Record<string, any> = {}
        try {
          answers = JSON.parse(sub.answersJson || '{}')
        } catch {}

        drawHeader('Anamnese Personalizada', templateTitle)

        // Add Patient Identity Section
        y += 3
        setFillColor('#7c3aed')
        doc.roundedRect(margin, y - 5, contentW, 8, 1, 1, 'F')
        setFont(9, 'bold')
        setColor('#ffffff')
        doc.text('IDENTIFICAÇÃO DO PACIENTE', margin + 3, y)
        y += 8

        setFont(8, 'bold')
        setColor('#374151')
        doc.text('Nome do Paciente:', margin, y)
        y += 4.5
        setFont(8)
        setColor('#1e293b')
        doc.text(patientName || sub.nomeCompleto || '—', margin + 2, y)
        y += 8

        // Add Questions
        questions.forEach((q: any, i: number) => {
          checkNewPage(20)

          setFont(8.5, 'bold')
          setColor('#374151')
          const questionText = `${i + 1}. ${q.label}`
          const qLines = doc.splitTextToSize(questionText, contentW)
          doc.text(qLines, margin, y)
          y += qLines.length * 4.5

          setFont(8)
          setColor('#1e293b')
          const val = answers[q.id]
          let ansText = '—'
          if (Array.isArray(val)) {
            ansText = val.join(', ')
          } else if (val) {
            ansText = String(val)
          }

          const ansLines = doc.splitTextToSize(ansText, contentW - 4)
          checkNewPage(ansLines.length * 4.5 + 4)
          doc.text(ansLines, margin + 2, y)
          y += ansLines.length * 4.5 + 4
        })

        drawSignature()
      } else {
        // ─── GENERATE LEGACY PDF ───
        const anamnese = legacyList[0]

        const val = (v: any) => {
          if (!v || v === 'null') return '_______________________________'
          return String(v)
        }

        const yesno = (v: any) => {
          if (!v || v === 'null') return '[ ] sim  [ ] não'
          if (v === 'Sim') return '[X] sim  [ ] não'
          if (v === 'Não') return '[ ] sim  [X] não'
          return v
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

        const formatDate = (d?: string) => {
          if (!d) return ''
          try {
            return new Date(d).toLocaleDateString('pt-BR')
          } catch { return d }
        }

        drawHeader('Coleta de Dados - Psicologia', 'Anamnese Infantil')

        // 1: Identificação
        addSection('IDENTIFICAÇÃO DO PACIENTE', '1')
        addRow([['Nome Completo', val(anamnese.nomeCompleto)]], 1)
        addRow([
          ['Data de Nascimento', formatDate(anamnese.dataNascimento)],
          ['Idade', val(anamnese.idade)],
          ['Sexo', val(anamnese.sexo)],
          ['Escolaridade', val(anamnese.escolaridade)],
        ])
        addField('Endereço Completo', val(anamnese.endereco))
        addField('Cidade', val(anamnese.cidade))

        // 2: Responsáveis
        addSection('NOME COMPLETO DOS RESPONSÁVEIS', '2')
        checkNewPage(10)
        setFont(8.5, 'bold'); setColor('#6d28d9')
        doc.text('Pai ou Responsável:', margin, y); y += 5
        addRow([['Nome Completo', val(anamnese.nomePai)]], 1)
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
        addRow([['Nome Completo', val(anamnese.nomeMae)]], 1)
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

        // 3: Queixa
        addSection('QUEIXA PRINCIPAL', '3')
        addField('Queixa', val(anamnese.queixa))
        addField('Reside com quais familiares ou responsáveis?', val(anamnese.resideCom))
        addField('Possui irmãos? Nomes, ordens de nascimento e idade?', val(anamnese.irmaos))
        addRow([['Adotado?', yesno(anamnese.adotado)]], 1)

        // 4: Gestação
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

        // 5: Saúde
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

        // 6: Alimentação
        addSection('ALIMENTAÇÃO', '6')
        addRow([
          ['Foi amamentada? Até quando?', val(anamnese.amamentacao)],
          ['É forçada a se alimentar?', val(anamnese.forcadaAlimentar)],
          ['Come sem derrubar a comida?', val(anamnese.comeSemDerrubar)],
          ['Recebe ajuda na alimentação?', val(anamnese.ajudaAlimentacao)],
        ])
        addField('Como é sua alimentação?', val(anamnese.alimentacao))
        addField('Observações', val(anamnese.obsAlimentacao))

        // 7: Sono
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

        // 8: Motor
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

        // 9: Escolaridade
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

        // 10: Linguagem
        addSection('LINGUAGEM', '10')
        addField('Descreva a comunicação atual:', val(anamnese.comunicacaoAtual))
        addField('Observações', val(anamnese.obsLinguagem))

        // 11: Sexualidade
        addSection('SEXUALIDADE', '11')
        addRow([
          ['Recebeu educação sexual?', val(anamnese.educacaoSexual)],
          ['De quem?', val(anamnese.dequemEducacaoSexual)],
          ['Como foi?', val(anamnese.comoFoiSexual)],
          ['Tem curiosidade sexual?', val(anamnese.curiosidadeSexual)],
          ['Os pais conversam sobre sexualidade?', val(anamnese.paisConversam)],
        ])
        addField('Observações', val(anamnese.obsSexualidade))

        // 12: Ambiental
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

        // 13: Emocional
        addSection('CARACTERÍSTICAS PESSOAIS E AFETIVO-EMOCIONAIS', '13')
        addField('Como é a criança sob o ponto de vista emocional?', val(anamnese.aspectoEmocional))

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

        // 14: Rotina
        addSection('ATIVIDADES DIÁRIAS DA CRIANÇA', '14')
        addField('Descreva a rotina da criança desde quando acorda até a hora de dormir:', val(anamnese.rotinaDiaria))

        drawSignature()
      }

      // Add footers
      const totalPages = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        drawFooter()
      }

      // Save
      const filename = `anamnese_${patientName.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(filename)

      toast({ title: 'PDF gerado!', description: `Arquivo "${filename}" baixado com sucesso.` })
    } catch (e) {
      console.error(e)
      toast({ title: 'Erro ao gerar PDF', description: 'Ocorreu um erro ao exportar o PDF.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDownload}
      disabled={loading}
      className="h-8 w-8 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg"
      title="Exportar PDF da Anamnese"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
    </Button>
  )
}
