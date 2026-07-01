import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/anamnese/[token] — Validate token and return professional info
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    const anamneseToken = await prisma.anamneseToken.findUnique({
      where: { token },
      include: {
        professionalProfile: {
          select: { fullName: true, specialty: true, councilType: true, councilNumber: true },
        },
      },
    })

    if (!anamneseToken) {
      return NextResponse.json({ error: 'Link inválido' }, { status: 404 })
    }

    if (new Date() > anamneseToken.expiresAt) {
      return NextResponse.json({ error: 'Link expirado' }, { status: 410 })
    }

    if (anamneseToken.usedAt) {
      return NextResponse.json({ error: 'Este link já foi utilizado' }, { status: 409 })
    }

    return NextResponse.json({
      valid: true,
      patientName: anamneseToken.patientName,
      professional: anamneseToken.professionalProfile,
      expiresAt: anamneseToken.expiresAt,
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao validar link' }, { status: 500 })
  }
}

// POST /api/anamnese/[token] — Patient submits anamnese form
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    const anamneseToken = await prisma.anamneseToken.findUnique({
      where: { token },
      include: { professionalProfile: { select: { id: true } } },
    })

    if (!anamneseToken) {
      return NextResponse.json({ error: 'Link inválido' }, { status: 404 })
    }

    if (new Date() > anamneseToken.expiresAt) {
      return NextResponse.json({ error: 'Link expirado' }, { status: 410 })
    }

    if (anamneseToken.usedAt) {
      return NextResponse.json({ error: 'Este link já foi utilizado' }, { status: 409 })
    }

    const body = await request.json()
    const { nomeCompleto, telefoneMae, telefonePai, dataNascimento, sexo, cidade, queixa, ...rest } = body

    // Create patient record
    let patientId: string | null = null
    if (nomeCompleto) {
      const nameParts = (nomeCompleto as string).trim().split(' ')
      const firstName = nameParts[0] || 'Paciente'
      const lastName = nameParts.slice(1).join(' ') || ''

      const newPatient = await prisma.patient.create({
        data: {
          professionalProfileId: anamneseToken.professionalProfileId,
          firstName,
          lastName,
          phone: telefoneMae || telefonePai || null,
          dateOfBirth: dataNascimento ? (() => { try { return new Date(dataNascimento) } catch { return null } })() : null,
          gender: sexo === 'Masculino' ? 'male' : sexo === 'Feminino' ? 'female' : null,
          city: cidade || null,
          chiefComplaint: queixa || null,
        },
      })
      patientId = newPatient.id
    }

    // Create anamnese
    const anamnese = await prisma.anamnese.create({
      data: {
        professionalProfileId: anamneseToken.professionalProfileId,
        patientId,
        tokenId: anamneseToken.id,
        preenchidoPor: 'paciente',
        nomeCompleto: nomeCompleto || null,
        dataNascimento: dataNascimento || null,
        sexo: sexo || null,
        cidade: cidade || null,
        queixa: queixa || null,
        telefoneMae: telefoneMae || null,
        telefonePai: telefonePai || null,
        ...buildRestData(rest),
      },
    })

    // Mark token as used
    await prisma.anamneseToken.update({
      where: { id: anamneseToken.id },
      data: { usedAt: new Date() },
    })

    return NextResponse.json({ success: true, anamneseId: anamnese.id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Falha ao salvar anamnese' }, { status: 500 })
  }
}

function buildRestData(data: any) {
  const fields = [
    'idade', 'escolaridade', 'endereco',
    'nomePai', 'idadePai', 'estadoCivilPai', 'rgPai', 'cpfPai', 'escolaridadePai', 'profissaoPai',
    'nomeMae', 'idadeMae', 'estadoCivilMae', 'rgMae', 'cpfMae', 'escolaridadeMae', 'profissaoMae',
    'encaminhadoPor', 'resideCom', 'irmaos', 'adotado',
    'gestacaoPlanejada', 'gestacaoDesejada', 'prenatal', 'intercorrencias', 'consumoSubstancias',
    'transfusao', 'tombo', 'condicoeNascimento',
    'acidentes', 'alergias', 'bronquiteAsma', 'visao', 'audicao', 'dorcabeca', 'desmaios',
    'convulsoes', 'historiaFamiliar', 'obsSaude',
    'amamentacao', 'alimentacao', 'forcadaAlimentar', 'comeSemDerrubar', 'ajudaAlimentacao', 'obsAlimentacao',
    'dormeBem', 'qualidadeSono', 'falaDormindo', 'sonambulo', 'rangeDentes', 'quartoSeparado',
    'comQuemDorme', 'acordaCamaPais', 'obsSono',
    'comoBebe', 'lentoTarefas', 'vesteSozinho', 'banhaSozinho', 'calcaSozinho', 'noCalcados',
    'desastrado', 'esportes', 'roiUnhas', 'chupaDedo', 'manias', 'ajudaTarefas', 'obsMotor',
    'gostaEscola', 'aceitoPelosAmigos', 'repetiu', 'motivoRepetiu', 'gostaEstudar', 'habitoLeitura',
    'fazLicoes', 'paisEstudam', 'mudouEscola', 'motivoMudou', 'matematica', 'dificuldadeLeitura',
    'irrequieta', 'circunstancias', 'dificuldadesEscola', 'professoresAcham', 'obsEscola',
    'comunicacaoAtual', 'obsLinguagem',
    'educacaoSexual', 'dequemEducacaoSexual', 'comoFoiSexual', 'curiosidadeSexual', 'paisConversam', 'obsSexualidade',
    'brincaSozinha', 'brincaComIdade', 'fazAmigos', 'adaptaMeio', 'relacaoPais', 'relacaoIrmaos',
    'medidasDisciplinares', 'quemUsa', 'reacoesMedidas', 'obsAmbiental',
    'aspectoEmocional', 'caracteristicas', 'outrasCaracteristicas', 'reageContrariedade',
    'atividadesPreferidas', 'obsEmocional', 'rotinaDiaria',
  ]
  const result: Record<string, any> = {}
  for (const field of fields) {
    if (data[field] !== undefined) result[field] = data[field] || null
  }
  return result
}
