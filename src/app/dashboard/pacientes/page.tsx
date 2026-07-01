'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Users, Mail, Phone, Search, Loader2, Plus, Edit, Trash2,
  MapPin, ClipboardList, Send,
} from 'lucide-react'
import { DashboardHeader } from '../Header'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { NewPatientModal } from '@/components/dashboard/NewPatientModal'

import { AnamneseLinkModal } from '@/components/dashboard/AnamneseLinkModal'
import { PatientAnamnesePdfButton } from '@/components/dashboard/PatientAnamnesePdfButton'
import { useToast } from '@/components/ui/use-toast'

interface Patient {
  id: string; firstName: string; lastName: string; email?: string | null
  phone?: string | null; whatsapp?: string | null; dateOfBirth?: string | null
  gender?: string | null; age?: number | null; address?: string | null
  city?: string | null; state?: string | null; profileImageUrl?: string | null
}
interface PatientStats { total: number; appointmentsThisMonth: number; newPatientsThisMonth: number }

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: i * 0.07, ease: [0.22,1,0.36,1] },
})

const COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-blue-600',
  'from-emerald-500 to-green-600',
  'from-orange-500 to-orange-600',
  'from-rose-500 to-pink-600',
]

function patientColor(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % COLORS.length
  return COLORS[h]
}

export default function PatientsPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState<Patient[]>([])
  const [stats, setStats] = useState<PatientStats>({ total: 0, appointmentsThisMonth: 0, newPatientsThisMonth: 0 })
  const [searchTerm, setSearchTerm] = useState('')
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)

  useEffect(() => { if (status === 'authenticated') fetchPatients() }, [status])
  useEffect(() => {
    const t = setTimeout(() => { if (status === 'authenticated') fetchPatients() }, 500)
    return () => clearTimeout(t)
  }, [searchTerm, status])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const q = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''
      const res = await fetch(`/api/professional/patients${q}`)
      if (res.ok) { const d = await res.json(); setPatients(d.patients); setStats(d.stats) }
    } catch { } finally { setLoading(false) }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir paciente "${name}"? Esta ação não pode ser desfeita.`)) return
    try {
      const res = await fetch(`/api/professional/patients?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'Paciente excluído!', description: `${name} foi removido.` }); fetchPatients() }
      else throw new Error()
    } catch { toast({ title: 'Erro ao excluir', variant: 'destructive' }) }
  }

  if (status === 'unauthenticated') redirect('/login')

  if (loading) {
    return (
      <>
        <DashboardHeader />
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando pacientes...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader />
      <DashboardLayout>

        {/* Header */}
        <motion.div {...stagger(0)} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-1">Pacientes</h1>
            <p className="text-muted-foreground text-sm">Gerencie seus pacientes e histórico de atendimentos</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsLinkModalOpen(true)}
              className="rounded-xl border-violet-300 text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 h-10 text-sm gap-1.5"
            >
              <Send className="h-4 w-4" />
              Enviar Anamnese por Link
            </Button>
            <Button
              onClick={() => setIsNewPatientModalOpen(true)}
              className="rounded-xl bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg shadow-primary/25 h-10 text-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Novo Paciente
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div {...stagger(1)} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Users,     label: 'Total',          value: stats?.total ?? 0,                              gradient: 'from-blue-500 to-blue-600',    glow: 'shadow-blue-500/25' },
            { icon: Mail,      label: 'Com Email',      value: patients.filter(p => p.email).length,           gradient: 'from-emerald-500 to-green-600', glow: 'shadow-emerald-500/25' },
            { icon: Phone,     label: 'Com Telefone',   value: patients.filter(p => p.phone).length,           gradient: 'from-orange-500 to-orange-600', glow: 'shadow-orange-500/25' },
            { icon: MapPin,    label: 'Com Localização', value: patients.filter(p => p.city && p.state).length, gradient: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/25' },
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

        {/* Search */}
        <motion.div {...stagger(2)} className="mb-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              className="pl-12 rounded-xl h-11 bg-card border-border/60 focus:border-primary/40"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Table */}
        <motion.div {...stagger(3)}>
          <div className="dash-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30">
                    <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Paciente</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Contato</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Localização</th>
                    <th className="text-center px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Idade</th>
                    <th className="text-center px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Gênero</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {patients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
                          <Users className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <p className="font-semibold text-foreground mb-1">Nenhum paciente encontrado</p>
                        <p className="text-sm text-muted-foreground">Adicione seu primeiro paciente clicando no botão acima</p>
                      </td>
                    </tr>
                  ) : (
                    patients.map((patient, i) => (
                      <motion.tr
                        key={patient.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${patientColor(`${patient.firstName}${patient.lastName}`)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                              <span className="text-white font-bold text-sm">
                                {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-foreground text-sm">{patient.firstName} {patient.lastName}</p>
                              <p className="text-xs text-muted-foreground md:hidden">{patient.email ?? patient.phone ?? '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <div className="space-y-0.5">
                            {patient.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span className="text-muted-foreground text-xs truncate max-w-[160px]">{patient.email}</span>
                              </div>
                            )}
                            {patient.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span className="text-muted-foreground text-xs">{patient.phone}</span>
                              </div>
                            )}
                            {!patient.email && !patient.phone && <span className="text-muted-foreground text-sm">—</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          {patient.city && patient.state
                            ? <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{patient.city} - {patient.state}</div>
                            : <span className="text-muted-foreground text-sm">—</span>}
                        </td>
                        <td className="px-5 py-4 text-center hidden lg:table-cell">
                          {patient.age
                            ? <Badge variant="outline" className="rounded-lg text-xs border-border/60">{patient.age} anos</Badge>
                            : <span className="text-muted-foreground text-sm">—</span>}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <Badge variant="outline" className={`rounded-lg text-xs border ${patient.gender === 'male' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' : patient.gender === 'female' ? 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800' : 'border-border/60 text-muted-foreground'}`}>
                            {patient.gender === 'male' ? 'Masc.' : patient.gender === 'female' ? 'Fem.' : '—'}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm"
                              onClick={() => { setSelectedPatient(patient); setIsEditModalOpen(true) }}
                              className="h-8 px-2.5 text-xs text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg gap-1.5 font-medium"
                            >
                              <ClipboardList className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Anamnese</span>
                            </Button>
                            <PatientAnamnesePdfButton
                              patientId={patient.id}
                              patientName={`${patient.firstName} ${patient.lastName}`}
                            />
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedPatient(patient); setIsEditModalOpen(true) }}
                              className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(patient.id, `${patient.firstName} ${patient.lastName}`)}
                              className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        <NewPatientModal open={isNewPatientModalOpen} onOpenChange={setIsNewPatientModalOpen} onSuccess={fetchPatients} />
        <NewPatientModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} onSuccess={fetchPatients} patientToEdit={selectedPatient} />

        {/* Link de anamnese genérico — cria cadastro automaticamente ao ser preenchido */}
        <AnamneseLinkModal
          open={isLinkModalOpen}
          onOpenChange={setIsLinkModalOpen}
        />
      </DashboardLayout>
    </>
  )
}
