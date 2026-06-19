'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Clock, Star, Plus, ArrowRight,
  DollarSign, CheckCircle2, XCircle, ChevronRight, Wallet,
  Activity, BarChart3, AlertCircle, Loader2,
  Calendar, Users, FileText, User, ChevronLeft,
} from 'lucide-react'
import Link from 'next/link'
import { DashboardHeader } from './Header'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { NewContentModal } from '@/components/dashboard/NewContentModal'
import { NewAppointmentModal } from '@/components/dashboard/NewAppointmentModal'
import { BirthdayReminders } from '@/components/dashboard/BirthdayReminders'
import { useToast } from '@/components/ui/use-toast'

interface DashboardData {
  stats: {
    monthAppointments: number
    completedAppointments: number
    confirmedAppointments: number
    pendingAppointments: number
    totalPatients: number
    revenue: number
    rating: number
    ratingCount: number
  }
  upcomingAppointments: Array<{
    id: string
    patient: string
    patientEmail: string
    patientPhone: string
    date: string
    time: string
    type: string
    status: string
    value: number
    notes?: string
  }>
  billingClients: Array<{
    id: string
    name: string
    specialty: string
    sessions: number
    value: number
    attended: boolean
    lastSession: string
  }>
  recentPatients: Array<{
    id: string
    name: string
    email: string
    phone: string
    lastAppointment: string
    totalAppointments: number
  }>
}

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
})

// Skeleton card
function SkeletonCard() {
  return (
    <div className="dash-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="skeleton w-12 h-12 rounded-xl" />
        <div className="skeleton w-12 h-5 rounded-full" />
      </div>
      <div className="skeleton w-20 h-7 rounded-lg mb-1" />
      <div className="skeleton w-28 h-4 rounded mb-2" />
      <div className="skeleton w-24 h-3 rounded" />
    </div>
  )
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [billingTab, setBillingTab] = useState<'all' | 'attended' | 'missed'>('all')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isNewContentOpen, setIsNewContentOpen] = useState(false)
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false)

  // Month navigation
  const today = new Date()
  const [navMonth, setNavMonth] = useState(today.getMonth())
  const [navYear, setNavYear]   = useState(today.getFullYear())
  const isCurrentMonth = navMonth === today.getMonth() && navYear === today.getFullYear()

  useEffect(() => {
    if (status === 'authenticated') fetchDashboardData(navMonth, navYear)
  }, [status, navMonth, navYear])

  const fetchDashboardData = async (month = navMonth, year = navYear) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard?month=${month}&year=${year}`)
      if (response.ok) setDashboardData(await response.json())
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const goToPrevMonth = () => {
    if (navMonth === 0) { setNavMonth(11); setNavYear(y => y - 1) }
    else setNavMonth(m => m - 1)
  }
  const goToNextMonth = () => {
    if (isCurrentMonth) return
    if (navMonth === 11) { setNavMonth(0); setNavYear(y => y + 1) }
    else setNavMonth(m => m + 1)
  }
  const goToCurrentMonth = () => { setNavMonth(today.getMonth()); setNavYear(today.getFullYear()) }

  if (status === 'unauthenticated') redirect('/login')

  const stats = dashboardData?.stats
  const statsCards = [
    {
      title: 'Consultas no Mês',
      value: stats?.monthAppointments?.toString() ?? '0',
      change: `+${stats?.completedAppointments ?? 0} realizadas`,
      trend: 'up' as const,
      icon: Calendar,
      gradient: 'from-blue-500 to-blue-600',
      glow: 'shadow-blue-500/25',
      lightBg: 'bg-blue-50 dark:bg-blue-900/20',
      lightText: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Pacientes Ativos',
      value: stats?.totalPatients?.toString() ?? '0',
      change: `${stats?.confirmedAppointments ?? 0} confirmadas`,
      trend: 'up' as const,
      icon: Users,
      gradient: 'from-emerald-500 to-green-600',
      glow: 'shadow-emerald-500/25',
      lightBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      lightText: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Faturamento Mensal',
      value: formatCurrency(stats?.revenue),
      change: '+12% vs mês anterior',
      trend: 'up' as const,
      icon: Wallet,
      gradient: 'from-orange-500 to-orange-600',
      glow: 'shadow-orange-500/25',
      lightBg: 'bg-orange-50 dark:bg-orange-900/20',
      lightText: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Avaliação Média',
      value: stats?.rating?.toString() ?? 'N/A',
      change: `${stats?.ratingCount ?? 0} avaliações`,
      trend: 'up' as const,
      icon: Star,
      gradient: 'from-amber-500 to-yellow-500',
      glow: 'shadow-amber-500/25',
      lightBg: 'bg-amber-50 dark:bg-amber-900/20',
      lightText: 'text-amber-600 dark:text-amber-400',
    },
  ]

  const upcomingAppointments = dashboardData?.upcomingAppointments ?? []
  const billingClients = dashboardData?.billingClients ?? []
  const totalAttended = billingClients.filter(c => c.attended)
  const totalNotAttended = billingClients.filter(c => !c.attended)
  const revenueAttended = totalAttended.reduce((s, c) => s + c.value * c.sessions, 0)
  const revenueNotAttended = totalNotAttended.reduce((s, c) => s + c.value * c.sessions, 0)
  const totalRevenue = revenueAttended + revenueNotAttended

  const filtered = billingTab === 'all'
    ? billingClients
    : billingTab === 'attended'
    ? billingClients.filter(c => c.attended)
    : billingClients.filter(c => !c.attended)

  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const currentMonth = `${monthNames[navMonth]} ${navYear}`
  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <>
      <DashboardHeader />
      <DashboardLayout>

        {/* ── Page Header ── */}
        <motion.div {...stagger(0)} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-1">
              {greeting()}, {session?.user?.name?.split(' ')[0] ?? 'Profissional'}! 👋
            </h1>
            <p className="text-muted-foreground text-sm">
              Resumo — <span className="capitalize font-medium text-foreground/70">{currentMonth}</span>
              {!isCurrentMonth && (
                <button onClick={goToCurrentMonth} className="ml-2 text-xs text-primary hover:underline font-semibold">
                  Voltar ao mês atual
                </button>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Month Navigator */}
            <div className="flex items-center gap-1 bg-muted/50 border border-border/60 rounded-xl px-1 py-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={goToPrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold text-foreground min-w-[100px] sm:min-w-[120px] text-center capitalize">
                {currentMonth}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={goToNextMonth}
                disabled={isCurrentMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Link href="/dashboard/agenda">
              <Button variant="outline" className="rounded-xl h-10 border-border/60 hover:border-primary/40 transition-colors text-sm">
                <Calendar className="h-4 w-4 mr-1.5" />
                Agenda
              </Button>
            </Link>
            <Button
              onClick={() => setIsNewAppointmentOpen(true)}
              className="rounded-xl h-10 bg-gradient-to-r from-primary to-orange-600 hover:from-orange-600 hover:to-primary text-white shadow-lg shadow-primary/25 transition-all duration-300 text-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              <span className="hidden xs:inline">Novo </span>Agendamento
            </Button>
          </div>
        </motion.div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {loading
            ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : statsCards.map((stat, i) => (
              <motion.div key={stat.title} {...stagger(0.1 + i * 0.07)}>
                <div className="dash-card p-5 group cursor-default">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg ${stat.glow} group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${stat.lightBg} ${stat.lightText}`}>
                      {stat.trend === 'up'
                        ? <TrendingUp className="h-3 w-3" />
                        : <TrendingDown className="h-3 w-3" />}
                    </div>
                  </div>
                  <p className="font-display font-bold text-2xl text-foreground mb-0.5 stat-value">{stat.value}</p>
                  <p className="text-sm font-medium text-muted-foreground mb-2">{stat.title}</p>
                  <p className={`text-xs font-semibold ${stat.lightText}`}>{stat.change}</p>
                </div>
              </motion.div>
            ))
          }
        </div>

        {/* ── Birthday Reminders ── */}
        <div className="mb-8">
          <BirthdayReminders />
        </div>

        {/* ── Appointments + Quick Actions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Upcoming appointments */}
          <motion.div {...stagger(0.3)} className="lg:col-span-2">
            <div className="dash-card overflow-hidden h-full">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="font-display font-bold text-lg text-foreground">Próximos Atendimentos</h2>
                </div>
                <Link href="/dashboard/agenda" className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                  Ver todos <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="divide-y divide-border/40">
                {upcomingAppointments.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-3 flex items-center justify-center">
                      <Calendar className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">Nenhum agendamento nos próximos 7 dias</p>
                  </div>
                ) : (
                  upcomingAppointments.map((appt, i) => (
                    <motion.div
                      key={appt.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.06 }}
                      className="flex items-center justify-between px-6 py-4 hover:bg-muted/40 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border border-border/60">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                            {appt.patient.charAt(0)}{appt.patient.split(' ').pop()?.charAt(0) ?? ''}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{appt.patient}</p>
                          <p className="text-xs text-muted-foreground">{appt.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs font-semibold text-foreground">
                            {new Date(appt.date).toLocaleDateString('pt-BR')} · {appt.time}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            {formatCurrency(appt.value)}
                          </p>
                        </div>
                        <Badge
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                            appt.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                              : appt.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}
                          variant="outline"
                        >
                          {appt.status === 'confirmed' ? 'Confirmado' : appt.status === 'pending' ? 'Pendente' : appt.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div {...stagger(0.35)}>
            <div className="dash-card p-6 h-full flex flex-col">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <h2 className="font-display font-bold text-lg text-foreground">Ações Rápidas</h2>
              </div>
              <div className="space-y-2 flex-1">
                {[
                  { onClick: () => setIsNewContentOpen(true), icon: FileText, label: 'Novo Conteúdo',  color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
                  { href: '/dashboard/agenda',    icon: Calendar, label: 'Ver Agenda',    color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  { href: '/dashboard/pacientes', icon: Users,    label: 'Ver Pacientes', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { href: '/dashboard/perfil',    icon: User,     label: 'Editar Perfil', color: 'text-primary',                         bg: 'bg-primary/8 dark:bg-primary/15' },
                ].map((action, i) => {
                  const inner = (
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/60 transition-all duration-200 group cursor-pointer border border-transparent hover:border-border/60">
                      <div className={`w-9 h-9 ${action.bg} rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-200`}>
                        <action.icon className={`h-4 w-4 ${action.color}`} />
                      </div>
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{action.label}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )
                  return action.href
                    ? <Link key={i} href={action.href}>{inner}</Link>
                    : <button key={i} onClick={action.onClick} className="w-full">{inner}</button>
                })}
              </div>

              {/* Revenue summary */}
              <div className="mt-5 p-4 bg-gradient-to-br from-primary to-orange-600 rounded-2xl text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.08]" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-white/80" />
                    <span className="text-xs font-semibold text-white/80">Faturamento {currentMonth.split(' ')[0]}</span>
                  </div>
                  <p className="font-display font-bold text-2xl text-white mb-0.5">{formatCurrency(revenueAttended)}</p>
                  <p className="text-xs text-white/70">+ {formatCurrency(revenueNotAttended)} a receber</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Billing / Faturamento ── */}
        <motion.div {...stagger(0.4)}>
          <div className="dash-card overflow-hidden">

            {/* Billing Header */}
            <div className="px-6 py-5 border-b border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-xl text-foreground">Faturamento por Cliente</h2>
                    <p className="text-xs text-muted-foreground">{currentMonth} · Atendidos e não atendidos</p>
                  </div>
                </div>

                {/* Summary pills */}
                <div className="flex items-center gap-3 flex-wrap">
                  {[
                    { icon: CheckCircle2, label: 'Atendidos',      value: formatCurrency(revenueAttended),    color: 'emerald', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
                    { icon: AlertCircle,  label: 'Não Atendidos',  value: formatCurrency(revenueNotAttended), color: 'red',     bg: 'bg-red-50 dark:bg-red-900/20',         text: 'text-red-700 dark:text-red-400',         border: 'border-red-200 dark:border-red-800' },
                    { icon: Wallet,       label: 'Total Potencial', value: formatCurrency(totalRevenue),       color: 'gray',    bg: 'bg-muted',                              text: 'text-muted-foreground',                 border: 'border-border' },
                  ].map((pill, i) => (
                    <div key={i} className={`flex items-center gap-2 px-4 py-2 ${pill.bg} border ${pill.border} rounded-xl`}>
                      <pill.icon className={`h-4 w-4 ${pill.text}`} />
                      <div>
                        <p className={`text-xs font-semibold ${pill.text}`}>{pill.label}</p>
                        <p className={`text-sm font-bold ${pill.text}`}>{pill.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress bars */}
            <div className="px-6 py-4 bg-muted/30 border-b border-border/40">
              {[
                { label: 'Realizado', value: revenueAttended, color: 'from-emerald-500 to-emerald-400', textColor: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'A recuperar', value: revenueNotAttended, color: 'from-rose-500 to-red-400', textColor: 'text-rose-600 dark:text-rose-400' },
              ].map((bar, i) => (
                <div key={i} className={`flex items-center gap-3 ${i > 0 ? 'mt-2.5' : ''}`}>
                  <span className="text-xs text-muted-foreground w-24 text-right">{bar.label}</span>
                  <div className="flex-1 h-2.5 bg-border/40 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${totalRevenue > 0 ? Math.round((bar.value / totalRevenue) * 100) : 0}%` }}
                      transition={{ duration: 1.2, delay: 0.5 + i * 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className={`h-full bg-gradient-to-r ${bar.color} rounded-full`}
                    />
                  </div>
                  <span className={`text-xs font-bold ${bar.textColor} w-10`}>
                    {totalRevenue > 0 ? Math.round((bar.value / totalRevenue) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1.5 px-6 py-3 border-b border-border/40 bg-background">
              {[
                { key: 'all',      label: 'Todos',              count: billingClients.length },
                { key: 'attended', label: 'Atendidos',          count: totalAttended.length },
                { key: 'missed',   label: 'Não atendidos',      count: totalNotAttended.length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setBillingTab(tab.key as typeof billingTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    billingTab === tab.key
                      ? 'bg-gradient-to-r from-primary to-orange-600 text-white shadow-md shadow-primary/25'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    billingTab === tab.key ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30">
                    {['Paciente','Serviço','Sessões','Valor/Sessão','Total','Última Consulta','Status'].map((h, i) => (
                      <th key={h} className={`px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${
                        i === 0 ? 'text-left' : i >= 6 ? 'text-center' : i >= 4 ? 'text-right' : i === 1 ? 'text-left hidden sm:table-cell' : i === 2 ? 'text-center' : i >= 3 ? 'text-right' : 'text-center hidden md:table-cell'
                      } ${i === 1 ? 'hidden sm:table-cell' : ''} ${i === 5 ? 'hidden md:table-cell' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground text-sm">
                        Nenhum cliente encontrado nesta categoria
                      </td>
                    </tr>
                  ) : (
                    filtered.map((client, i) => (
                      <motion.tr
                        key={client.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 + i * 0.04 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-border/60">
                              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                {client.name.charAt(0)}{client.name.split(' ').pop()?.charAt(0) ?? ''}
                              </AvatarFallback>
                            </Avatar>
                            <p className="font-semibold text-sm text-foreground">{client.name}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell">
                          <span className="text-sm text-muted-foreground">{client.specialty}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-semibold text-foreground">{client.sessions}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-sm text-muted-foreground">{formatCurrency(client.value)}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-sm font-bold text-foreground">{formatCurrency(client.value * client.sessions)}</span>
                        </td>
                        <td className="px-5 py-4 text-center hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {new Date(client.lastSession).toLocaleDateString('pt-BR')}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <Badge
                            className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                              client.attended
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                            }`}
                            variant="outline"
                          >
                            {client.attended ? 'Atendido' : 'Não atendido'}
                          </Badge>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </DashboardLayout>

      <NewContentModal
        open={isNewContentOpen}
        onOpenChange={setIsNewContentOpen}
        onSuccess={() => toast({ title: 'Conteúdo criado!', description: 'Seu conteúdo foi salvo com sucesso.' })}
      />
      <NewAppointmentModal
        open={isNewAppointmentOpen}
        onOpenChange={setIsNewAppointmentOpen}
        onSuccess={fetchDashboardData}
      />
    </>
  )
}
