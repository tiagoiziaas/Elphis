'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cake, Gift, PartyPopper, ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface BirthdayPatient {
  id: string
  name: string
  profileImageUrl: string | null
  dateOfBirth: string
  daysUntilBirthday: number
  birthdayThisYear: string
  age: number
  isToday: boolean
}

export function BirthdayReminders() {
  const [birthdays, setBirthdays] = useState<BirthdayPatient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/professional/birthdays')
      .then((r) => r.json())
      .then((data) => {
        if (data.birthdays) setBirthdays(data.birthdays)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!loading && birthdays.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="dash-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border/50 bg-gradient-to-r from-pink-500/5 via-rose-500/5 to-orange-500/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/25">
            <Cake className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-foreground leading-tight">
              Aniversários da Semana
            </h2>
            <p className="text-xs text-muted-foreground">
              {birthdays.length} paciente{birthdays.length !== 1 ? 's' : ''} próximos
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/pacientes"
          className="flex items-center gap-1 text-xs font-semibold text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
        >
          Ver pacientes <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Body */}
      <div className="divide-y divide-border/40">
        {loading ? (
          Array(2).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="skeleton w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton w-32 h-4 rounded" />
                <div className="skeleton w-20 h-3 rounded" />
              </div>
              <div className="skeleton w-16 h-6 rounded-full" />
            </div>
          ))
        ) : (
          <AnimatePresence>
            {birthdays.map((patient, i) => {
              const initials = patient.name
                .split(' ')
                .filter(Boolean)
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()

              const birthdayDate = new Date(patient.birthdayThisYear)
              const dateStr = birthdayDate.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
              })

              return (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.4 }}
                  className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/40 group ${
                    patient.isToday
                      ? 'bg-gradient-to-r from-pink-50/80 via-rose-50/50 to-transparent dark:from-pink-900/15 dark:via-rose-900/10 dark:to-transparent'
                      : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10 border-2 border-pink-200 dark:border-pink-800">
                      {patient.profileImageUrl && (
                        <AvatarImage src={patient.profileImageUrl} alt={patient.name} />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40 text-pink-700 dark:text-pink-300 font-bold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {patient.isToday && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm">
                        <PartyPopper className="h-2.5 w-2.5 text-yellow-900" />
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate flex items-center gap-1.5">
                      {patient.name}
                      {patient.isToday && (
                        <span className="text-yellow-500 text-base leading-none">🎂</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dateStr} · {patient.age} anos
                    </p>
                  </div>

                  {/* Countdown chip */}
                  <div className="flex-shrink-0">
                    {patient.isToday ? (
                      <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-md shadow-pink-500/25 text-xs px-3 py-1 font-bold animate-pulse">
                        🎉 Hoje!
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className={`text-xs px-2.5 py-1 font-semibold border rounded-full ${
                          patient.daysUntilBirthday <= 3
                            ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
                            : 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800'
                        }`}
                      >
                        <Gift className="h-3 w-3 mr-1 inline" />
                        {patient.daysUntilBirthday}d
                      </Badge>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  )
}
