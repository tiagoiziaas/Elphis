'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, User, FileText, Calendar, Users, Settings,
  CreditCard, ChevronRight, Sparkles, LogOut, Sun, Moon, Monitor, Wallet,
  ClipboardList,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/perfil', label: 'Meu Perfil', icon: User },
  { href: '/dashboard/conteudos', label: 'Conteúdos', icon: FileText },
  { href: '/dashboard/agenda', label: 'Agenda', icon: Calendar },
  { href: '/dashboard/pacientes', label: 'Pacientes', icon: Users },
  { href: '/dashboard/anamnese', label: 'Anamnese', icon: ClipboardList },
  { href: '/dashboard/financeiro', label: 'Financeiro', icon: Wallet },
  { href: '/dashboard/cartao-visitas', label: 'Cartão de Visitas', icon: CreditCard },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

// ── Sidebar (shared between layout and standalone) ─────────────────────────
export function DashboardSidebarNew() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <aside className="w-full md:w-64 xl:w-72 flex-shrink-0 flex flex-col h-full">
      {/* Profile */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3 mb-6 p-3 rounded-2xl bg-muted/60 border border-border/50"
      >
        <Avatar className="h-11 w-11 border-2 border-primary/30 shadow-sm">
          <AvatarImage src={session?.user?.professionalProfile?.profileImageUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
            {session?.user?.name?.charAt(0) || 'P'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground text-sm truncate">
            {session?.user?.name || 'Profissional'}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
      </motion.div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-3 mb-3">
          Menu Principal
        </p>
        {menuItems.map((item, i) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link
                href={item.href}
                className={cn(
                  'nav-item group',
                  isActive && 'active'
                )}
              >
                <item.icon className="nav-icon" />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <ChevronRight className="h-4 w-4 text-white/70" />
                  </motion.div>
                )}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Theme quick-toggle */}
      {mounted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-5 p-3 rounded-2xl border border-border/60 bg-muted/40"
        >
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-2.5">
            Aparência
          </p>
          <div className="flex items-center gap-1.5">
            {[
              { value: 'light', icon: Sun, label: 'Claro' },
              { value: 'dark', icon: Moon, label: 'Escuro' },
              { value: 'system', icon: Monitor, label: 'Auto' },
            ].map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                title={label}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs font-medium transition-all duration-200',
                  theme === value
                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[9px] leading-none">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Pro tip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-4 p-4 bg-gradient-to-br from-primary/12 to-primary/5 rounded-2xl border border-primary/15"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-primary">Dica Pro</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Mantenha seu perfil atualizado para atrair mais pacientes e aumentar seu faturamento.
        </p>
      </motion.div>

      {/* Sign out */}
      <button
        onClick={() => signOut()}
        className="mt-4 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all duration-200 w-full group"
      >
        <LogOut className="h-4 w-4 group-hover:text-destructive transition-colors" />
        <span className="font-medium">Sair da conta</span>
      </button>
    </aside>
  )
}

// ── Full-page Dashboard Layout ─────────────────────────────────────────────
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* pt-[68px] = fixed header height; extra pb for iPhone home indicator */}
      <div className="pt-[68px] flex">
        {/* Fixed Sidebar — desktop only */}
        <aside className="hidden md:flex w-64 xl:w-72 flex-shrink-0 flex-col fixed left-0 top-[68px] bottom-0 sidebar-bg border-r border-border/60 px-4 py-6 overflow-y-auto z-40">
          <DashboardSidebarNew />
        </aside>

        {/* Main content */}
        <main className="flex-1 md:ml-64 xl:ml-72 min-w-0 overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="px-3 sm:px-5 md:px-8 py-5 md:py-8 pb-safe"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
