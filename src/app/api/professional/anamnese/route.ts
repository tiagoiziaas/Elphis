import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

async function getProfessional(userId: string) {
  return prisma.professionalProfile.findUnique({ where: { userId } })
}

// GET /api/professional/anamnese?patientId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const professional = await getProfessional(session.user.id)
    if (!professional) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    const where: any = { professionalProfileId: professional.id }
    if (patientId) where.patientId = patientId

    const anamneses = await prisma.anamnese.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { patient: { select: { firstName: true, lastName: true } } },
    })

    return NextResponse.json({ anamneses })
  } catch {
    return NextResponse.json({ error: 'Falha ao buscar anamneses' }, { status: 500 })
  }
}

// POST /api/professional/anamnese — Create anamnese + patient record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const professional = await getProfessional(session.user.id)
    if (!professional) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

    const body = await request.json()
    const { patientId: existingPatientId, ...anamneseData } = body

    let patientId = existingPatientId

    // If no existing patientId, create a Patient from the anamnese data
    if (!patientId && anamneseData.nomeCompleto) {
      const nameParts = (anamneseData.nomeCompleto as string).trim().split(' ')
      const firstName = nameParts[0] || 'Paciente'
      const lastName = nameParts.slice(1).join(' ') || 'Sem sobrenome'

      const newPatient = await prisma.patient.create({
        data: {
          professionalProfileId: professional.id,
          firstName,
          lastName,
          phone: anamneseData.telefoneMae || anamneseData.telefonePai || null,
          dateOfBirth: anamneseData.dataNascimento ? new Date(anamneseData.dataNascimento) : null,
          gender: anamneseData.sexo === 'Masculino' ? 'male' : anamneseData.sexo === 'Feminino' ? 'female' : null,
          city: anamneseData.cidade || null,
          chiefComplaint: anamneseData.queixa || null,
        },
      })
      patientId = newPatient.id
    }

    const anamnese = await prisma.anamnese.create({
      data: {
        professionalProfileId: professional.id,
        patientId: patientId || null,
        preenchidoPor: 'profissional',
        ...buildAnamneseData(anamneseData),
      },
    })

    return NextResponse.json({ anamnese, patientId })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Falha ao criar anamnese' }, { status: 500 })
  }
}

// PUT /api/professional/anamnese — Update anamnese
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const professional = await getProfessional(session.user.id)
    if (!professional) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

    const body = await request.json()
    const { id, ...anamneseData } = body

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const existing = await prisma.anamnese.findUnique({ where: { id } })
    if (!existing || existing.professionalProfileId !== professional.id) {
      return NextResponse.json({ error: 'Anamnese não encontrada' }, { status: 404 })
    }

    const anamnese = await prisma.anamnese.update({
      where: { id },
      data: buildAnamneseData(anamneseData),
    })

    return NextResponse.json({ anamnese })
  } catch {
    return NextResponse.json({ error: 'Falha ao atualizar anamnese' }, { status: 500 })
  }
}

function buildAnamneseData(data: any) {
  const fields = [
    'nomeCompleto', 'dataNascimento', 'idade', 'sexo', 'escolaridade', 'endereco', 'cidade',
    'nomePai', 'idadePai', 'estadoCivilPai', 'rgPai', 'cpfPai', 'escolaridadePai', 'profissaoPai', 'telefonePai',
    'nomeMae', 'idadeMae', 'estadoCivilMae', 'rgMae', 'cpfMae', 'escolaridadeMae', 'profissaoMae', 'telefoneMae',
    'encaminhadoPor', 'queixa', 'resideCom', 'irmaos', 'adotado',
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
    if (data[field] !== undefined) {
      result[field] = data[field] || null
    }
  }
  return result
}
