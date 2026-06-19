'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle,
  XCircle, Loader2, TrendingUp, TrendingDown, Plus, Trash2,
  ArrowUpRight, ArrowDownLeft, Users, BarChart3, Filter, X,
  DollarSign, Calendar,
} from 'lucide-react'
import { DashboardHeader } from '../Header'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Movement {
  id: string; date: string; time: string; patient: string; patientEmail: string
  service: string; status: string; value: number; attendanceType: string; notes?: string | null
}
interface Patient {
  name: string; email: string; phone: string
  confirmed: number; pending: number; cancelled: number; completed: number
  revenue: number; pending_revenue: number
}
interface Summary {
  totalRevenue: number; pendingRevenue: number; cancelledRevenue: number
  confirmedCount: number; completedCount: number; pendingCount: number; cancelledCount: number
  totalCount: number
}
interface Aporte {
  id: string; description: string; value: number; date: string; type: 'entrada' | 'saida'
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const statusCfg: Record<string, { label: string; cls: string; dot: string }> = {
  confirmed: { label: 'Confirmado', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800', dot: 'bg-emerald-500' },
  completed: { label: 'Concluído',  cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800', dot: 'bg-blue-500' },
  pending:   { label: 'Pendente',   cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800', dot: 'bg-amber-400' },
  cancelled: { label: 'Cancelado',  cls: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800', dot: 'bg-red-500' },
  no_show:   { label: 'Faltou',     cls: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800', dot: 'bg-gray-400' },
}

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
})

// ── Component ─────────────────────────────────────────────────────────────────
export default function FinanceiroPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()

  const today = new Date()
  const [navMonth, setNavMonth] = useState(today.getMonth())
  const [navYear,  setNavYear]  = useState(today.getFullYear())
  const isCurrentMonth = navMonth === today.getMonth() && navYear === today.getFullYear()

  const [loading, setLoading]       = useState(true)
  const [summary, setSummary]       = useState<Summary | null>(null)
  const [movements, setMovements]   = useState<Movement[]>([])
  const [patients, setPatients]     = useState<Patient[]>([])
  const [aportes, setAportes]       = useState<Aporte[]>([])
  const [activeTab, setActiveTab]   = useState<'movimentos' | 'pacientes' | 'aportes'>('movimentos')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Aporte modal
  const [aporteOpen, setAporteOpen]   = useState(false)
  const [aporteForm, setAporteForm]   = useState({ description: '', value: '', date: today.toISOString().split('T')[0], type: 'entrada' as 'entrada' | 'saida' })
  const [savingAporte, setSavingAporte] = useState(false)

  useEffect(() => { if (status === 'authenticated') { fetchFinance(); fetchAportes() } }, [status, navMonth, navYear])

  const fetchFinance = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/financeiro?month=${navMonth}&year=${navYear}`)
      if (res.ok) {
        const d = await res.json()
        setSummary(d.summary); setMovements(d.movements); setPatients(d.patients)
      }
    } finally { setLoading(false) }
  }

  const fetchAportes = async () => {
    const res = await fetch('/api/financeiro/aportes')
    if (res.ok) setAportes((await res.json()).aportes)
  }

  const saveAporte = async () => {
    if (!aporteForm.description || !aporteForm.value) {
      toast({ title: 'Preencha descrição e valor', variant: 'destructive' }); return
    }
    setSavingAporte(true)
    const res = await fetch('/api/financeiro/aportes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aporteForm),
    })
    if (res.ok) {
      await fetchAportes()
      setAporteOpen(false)
      setAporteForm({ description: '', value: '', date: today.toISOString().split('T')[0], type: 'entrada' })
      toast({ title: 'Aporte registrado!' })
    }
    setSavingAporte(false)
  }

  const deleteAporte = async (id: string) => {
    if (!confirm('Remover este aporte?')) return
    await fetch(`/api/financeiro/aportes?id=${id}`, { method: 'DELETE' })
    setAportes(prev => prev.filter(a => a.id !== id))
    toast({ title: 'Aporte removido' })
  }

  const goToPrev = () => { if (navMonth === 0) { setNavMonth(11); setNavYear(y => y - 1) } else setNavMonth(m => m - 1) }
  const goToNext = () => { if (isCurrentMonth) return; if (navMonth === 11) { setNavMonth(0); setNavYear(y => y + 1) } else setNavMonth(m => m + 1) }

  const filteredMovements = useMemo(() =>
    filterStatus === 'all' ? movements : movements.filter(m => m.status === filterStatus),
    [movements, filterStatus]
  )

  // Aportes totals
  const aporteEntrada  = aportes.filter(a => a.type === 'entrada').reduce((s, a) => s + a.value, 0)
  const aporteSaida    = aportes.filter(a => a.type === 'saida').reduce((s, a) => s + a.value, 0)
  const aporteSaldo    = aporteEntrada - aporteSaida
  const receitaLiquida = (summary?.totalRevenue ?? 0) + aporteSaldo

  if (status === 'unauthenticated') redirect('/login')

  const currentMonthLabel = `${monthNames[navMonth]} ${navYear}`

  return (
    <>
      <DashboardHeader />
      <DashboardLayout>

        {/* ── Page Header ── */}
        <motion.div {...stagger(0)} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-1 flex items-center gap-3">
              <span className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/25 flex-shrink-0">
                <Wallet className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </span>
              Financeiro
            </h1>
            <p className="text-muted-foreground text-sm ml-[48px] md:ml-[52px]">
              Movimentações de <span className="font-semibold text-foreground capitalize">{currentMonthLabel}</span>
              {!isCurrentMonth && (
                <button onClick={() => { setNavMonth(today.getMonth()); setNavYear(today.getFullYear()) }} className="ml-2 text-xs text-primary hover:underline font-semibold">
                  Mês atual
                </button>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Month navigator */}
            <div className="flex items-center gap-1 bg-muted/50 border border-border/60 rounded-xl px-1 py-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={goToPrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold text-foreground min-w-[110px] sm:min-w-[130px] text-center capitalize">
                {currentMonthLabel}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={goToNext} disabled={isCurrentMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={() => setAporteOpen(true)}
              className="rounded-xl h-10 bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all text-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Novo Aporte
            </Button>
          </div>
        </motion.div>

        {/* ── Summary Cards ── */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
            {Array(5).fill(0).map((_, i) => <div key={i} className="dash-card p-5 skeleton h-28" />)}
          </div>
        ) : (
          <motion.div {...stagger(1)} className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
            {[
              { label: 'Receita Confirmada', value: fmt(summary?.totalRevenue ?? 0),    icon: TrendingUp,   bg: 'from-emerald-500 to-green-600',  glow: 'shadow-emerald-500/25', sub: `${(summary?.confirmedCount ?? 0) + (summary?.completedCount ?? 0)} atendimentos` },
              { label: 'Receita Pendente',   value: fmt(summary?.pendingRevenue ?? 0),  icon: AlertCircle,  bg: 'from-amber-500 to-orange-500',   glow: 'shadow-amber-500/25',   sub: `${summary?.pendingCount ?? 0} aguardando` },
              { label: 'Cancelamentos',      value: fmt(summary?.cancelledRevenue ?? 0),icon: XCircle,      bg: 'from-red-500 to-rose-600',       glow: 'shadow-red-500/25',     sub: `${summary?.cancelledCount ?? 0} cancelados` },
              { label: 'Saldo de Aportes',   value: fmt(aporteSaldo),                  icon: Wallet,       bg: 'from-primary to-orange-600',     glow: 'shadow-primary/25',     sub: `${aportes.length} moviment.` },
              { label: 'Receita Líquida',    value: fmt(receitaLiquida),               icon: receitaLiquida >= 0 ? TrendingUp : TrendingDown, bg: receitaLiquida >= 0 ? 'from-violet-500 to-purple-600' : 'from-red-500 to-rose-600', glow: receitaLiquida >= 0 ? 'shadow-violet-500/25' : 'shadow-red-500/25', sub: 'Confirmada − Aportes' },
            ].map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.07 }}>
                <div className={`dash-card p-5 ${i === 4 ? 'ring-2 ring-violet-500/20 dark:ring-violet-400/15' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-11 h-11 bg-gradient-to-br ${c.bg} rounded-xl flex items-center justify-center shadow-lg ${c.glow}`}>
                      <c.icon className="h-5 w-5 text-white" />
                    </div>
                    {i === 4 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                        Líquida
                      </span>
                    )}
                  </div>
                  <p className="font-display font-bold text-xl text-foreground mb-0.5">{c.value}</p>
                  <p className="text-sm text-muted-foreground font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">{c.sub}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── Tabs ── */}
        <motion.div {...stagger(2)} className="mb-5 overflow-x-auto">
          <div className="flex items-center gap-1.5 bg-muted/40 border border-border/50 rounded-xl p-1 w-fit min-w-full sm:min-w-0">
          {([
            { key: 'movimentos', label: 'Movimentações', icon: BarChart3 },
            { key: 'pacientes',  label: 'Por Paciente',  icon: Users },
            { key: 'aportes',    label: 'Aportes',       icon: Wallet },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-primary to-orange-600 text-white shadow-md shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <tab.icon className="h-4 w-4 flex-shrink-0" />
              {tab.label}
            </button>
          ))}
          </div>
        </motion.div>

        {/* ── TAB: Movimentações ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'movimentos' && (
            <motion.div key="movimentos" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
              <div className="dash-card overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="font-display font-bold text-lg text-foreground">Movimentações por Consulta</h2>
                  </div>
                  {/* Status filter */}
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="h-9 w-44 rounded-lg text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="confirmed">Confirmados</SelectItem>
                        <SelectItem value="completed">Concluídos</SelectItem>
                        <SelectItem value="pending">Pendentes</SelectItem>
                        <SelectItem value="cancelled">Cancelados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                ) : filteredMovements.length === 0 ? (
                  <div className="px-6 py-14 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-muted mx-auto mb-3 flex items-center justify-center">
                      <Wallet className="h-7 w-7 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">Nenhuma movimentação neste período</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/40 bg-muted/30">
                          {['Data / Hora','Paciente','Serviço','Status','Valor'].map((h, i) => (
                            <th key={h} className={cn('px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider', i === 0 || i === 1 ? 'text-left' : i === 4 ? 'text-right' : 'text-center', i === 2 ? 'hidden sm:table-cell' : '')}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {filteredMovements.map((m, i) => {
                          const sc = statusCfg[m.status] ?? statusCfg['pending']
                          const isBillable = m.status === 'confirmed' || m.status === 'completed'
                          return (
                            <motion.tr key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-muted/30 transition-colors">
                              <td className="px-5 py-3.5 text-sm">
                                <p className="font-medium text-foreground">{new Date(m.date).toLocaleDateString('pt-BR')}</p>
                                <p className="text-xs text-muted-foreground">{m.time}</p>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <Avatar className="h-8 w-8 border border-primary/20 flex-shrink-0">
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                      {m.patient.charAt(0)}{m.patient.split(' ').pop()?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <p className="text-sm font-semibold text-foreground truncate max-w-[140px]">{m.patient}</p>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-center hidden sm:table-cell">
                                <span className="text-sm text-muted-foreground">{m.service}</span>
                              </td>
                              <td className="px-5 py-3.5 text-center">
                                <Badge className={cn('text-xs px-2.5 py-1 rounded-full font-semibold border', sc.cls)} variant="outline">
                                  <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5 inline-block', sc.dot)} />
                                  {sc.label}
                                </Badge>
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <span className={cn('text-sm font-bold', isBillable ? 'text-emerald-600 dark:text-emerald-400' : m.status === 'pending' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground line-through')}>
                                  {fmt(m.value)}
                                </span>
                              </td>
                            </motion.tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="border-t-2 border-border/60 bg-muted/20">
                        <tr>
                          <td colSpan={3} className="px-5 py-3 text-sm font-bold text-foreground">Total confirmado</td>
                          <td />
                          <td className="px-5 py-3 text-right text-base font-bold text-emerald-600 dark:text-emerald-400">
                            {fmt(filteredMovements.filter(m => m.status === 'confirmed' || m.status === 'completed').reduce((s, m) => s + m.value, 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── TAB: Por Paciente ── */}
          {activeTab === 'pacientes' && (
            <motion.div key="pacientes" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
              <div className="dash-card overflow-hidden">
                <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border/50">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="font-display font-bold text-lg text-foreground">Resumo por Paciente</h2>
                  <Badge variant="outline" className="ml-auto text-muted-foreground rounded-xl border-border/60">
                    {patients.length} pacientes
                  </Badge>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
                ) : patients.length === 0 ? (
                  <div className="px-6 py-14 text-center">
                    <p className="text-sm text-muted-foreground">Nenhum paciente neste período</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {patients.map((p, i) => (
                      <motion.div key={p.email} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                              {p.name.charAt(0)}{p.name.split(' ').pop()?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-foreground">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.phone || p.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          {p.confirmed > 0 && <div className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-emerald-600 dark:text-emerald-400 font-semibold">{p.confirmed} confirm.</span></div>}
                          {p.completed > 0 && <div className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-blue-600 dark:text-blue-400 font-semibold">{p.completed} concluído</span></div>}
                          {p.pending > 0   && <div className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-amber-600 dark:text-amber-400 font-semibold">{p.pending} pendente</span></div>}
                          {p.cancelled > 0 && <div className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-red-600 dark:text-red-400 font-semibold">{p.cancelled} cancelado</span></div>}
                          <div className="text-right min-w-[100px]">
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{fmt(p.revenue)}</p>
                            {p.pending_revenue > 0 && <p className="text-xs text-amber-600 dark:text-amber-400">+{fmt(p.pending_revenue)} pend.</p>}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── TAB: Aportes ── */}
          {activeTab === 'aportes' && (
            <motion.div key="aportes" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>

              {/* Aportes summary */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                  { label: 'Entradas', value: fmt(aporteEntrada), icon: ArrowUpRight, cls: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: 'Saídas',   value: fmt(aporteSaida),   icon: ArrowDownLeft, cls: 'text-red-600 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-900/20' },
                  { label: 'Saldo',    value: fmt(aporteSaldo),   icon: Wallet,        cls: aporteSaldo >= 0 ? 'text-primary' : 'text-red-600 dark:text-red-400', bg: 'bg-primary/8' },
                ].map((c, i) => (
                  <div key={i} className="dash-card p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
                      <c.icon className={`h-5 w-5 ${c.cls}`} />
                    </div>
                    <div>
                      <p className={`font-bold text-lg ${c.cls}`}>{c.value}</p>
                      <p className="text-xs text-muted-foreground">{c.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="dash-card overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="font-display font-bold text-lg text-foreground">Aportes Administrativos</h2>
                  </div>
                  <Button onClick={() => setAporteOpen(true)} size="sm" className="rounded-xl bg-gradient-to-r from-primary to-orange-600 text-white h-9">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />Adicionar
                  </Button>
                </div>

                {aportes.length === 0 ? (
                  <div className="px-6 py-14 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-muted mx-auto mb-3 flex items-center justify-center">
                      <Wallet className="h-7 w-7 text-muted-foreground/40" />
                    </div>
                    <p className="font-semibold text-foreground mb-1">Nenhum aporte registrado</p>
                    <p className="text-sm text-muted-foreground">Registre entradas e saídas administrativas aqui</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {aportes.map((a, i) => (
                      <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', a.type === 'entrada' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20')}>
                            {a.type === 'entrada'
                              ? <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              : <ArrowDownLeft className="h-4 w-4 text-red-600 dark:text-red-400" />}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{a.description}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{new Date(a.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                              <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 rounded-full border ml-1', a.type === 'entrada' ? 'border-emerald-200 text-emerald-700 dark:text-emerald-400 dark:border-emerald-800' : 'border-red-200 text-red-700 dark:text-red-400 dark:border-red-800')}>
                                {a.type === 'entrada' ? 'Entrada' : 'Saída'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn('font-bold text-base', a.type === 'entrada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                            {a.type === 'saida' ? '- ' : '+ '}{fmt(a.value)}
                          </span>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                            onClick={() => deleteAporte(a.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Aporte Modal ── */}
        <Dialog open={aporteOpen} onOpenChange={setAporteOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display font-bold text-xl flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Novo Aporte
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={aporteForm.type} onValueChange={(v: 'entrada' | 'saida') => setAporteForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">↑ Entrada</SelectItem>
                    <SelectItem value="saida">↓ Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  placeholder="Ex: Aluguel da sala, Material, etc."
                  value={aporteForm.description}
                  onChange={e => setAporteForm(p => ({ ...p, description: e.target.value }))}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number" min="0" step="0.01" placeholder="0,00"
                    value={aporteForm.value}
                    onChange={e => setAporteForm(p => ({ ...p, value: e.target.value }))}
                    className="pl-10 rounded-lg"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={aporteForm.date}
                  onChange={e => setAporteForm(p => ({ ...p, date: e.target.value }))}
                  className="rounded-lg"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setAporteOpen(false)}>Cancelar</Button>
              <Button onClick={saveAporte} disabled={savingAporte}
                className="rounded-xl bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg shadow-primary/25">
                {savingAporte ? 'Salvando...' : 'Salvar Aporte'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </DashboardLayout>
    </>
  )
}
