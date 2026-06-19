'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  X, MessageCircle, Calendar, Loader2, CheckCircle2,
  MapPin, Monitor, Phone, Mail, Instagram, Linkedin,
  Brain, Heart, Leaf, Laptop, Smartphone, ChevronRight,
  Mic, Video, PhoneOff, MessageSquare, User, Star,
} from 'lucide-react'

/* ─── PALETA ─── */
const WINE  = '#8B1A35'
const WINE2 = '#B52247'
const WINE3 = '#5C0F21'
const BLACK = '#0d0608'
const DARK  = '#120609'
const DARK2 = '#1a0a0d'
const GOLD  = '#c47a8a'
const WHITE = '#ffffff'

import BrainSvg from './BrainSvg'

/* ─── SVG BRAIN — Cerebro.svg real ─── */
function BrainSketch() {
  return (
    <BrainSvg />
  )
}

/* ─── (unused placeholder — kept for type safety) ─── */
function _BrainSketchOld_UNUSED() {
  return (
    <svg
      viewBox="0 0 430 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 430 }}
    >
      {/* subtle fill */}
      <path
        d="M72,152 C69,128 72,96 87,70 C104,42 136,24 175,18
           C208,13 246,16 278,28 C314,42 344,66 362,98
           C380,128 384,162 378,190 C370,216 350,232 326,236
           C310,238 295,234 278,238 C262,242 250,252 240,260
           C224,274 204,284 182,284 C166,284 152,280 140,272
           C122,260 110,242 97,228 C82,212 70,194 70,174 Z"
        fill={WINE3} fillOpacity="0.1"
      />

      {/* ── CEREBELLUM (posterior-inferior) ── */}
      <path
        d="M308,232 C332,237 356,250 368,272
           C377,290 372,312 357,324
           C340,337 316,340 294,333
           C272,326 258,306 258,286
           C258,266 272,248 288,240 C296,236 302,234 308,232 Z"
        stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" opacity="0.72"
      />
      <path d="M270,254 C290,248 312,247 332,254" stroke={GOLD} strokeWidth="0.9" strokeLinecap="round" opacity="0.55"/>
      <path d="M262,270 C284,263 310,262 330,270" stroke={GOLD} strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
      <path d="M260,285 C282,278 308,277 328,285" stroke={GOLD} strokeWidth="0.9" strokeLinecap="round" opacity="0.45"/>
      <path d="M264,300 C284,294 306,293 323,299" stroke={GOLD} strokeWidth="0.8" strokeLinecap="round" opacity="0.4"/>
      <path d="M274,314 C290,309 308,308 322,314" stroke={GOLD} strokeWidth="0.8" strokeLinecap="round" opacity="0.35"/>
      {/* cerebellum midline */}
      <path d="M313,234 C311,260 311,288 312,318" stroke={GOLD} strokeWidth="0.7" strokeLinecap="round" strokeDasharray="4 3" opacity="0.38"/>

      {/* ── BRAINSTEM ── */}
      <path
        d="M182,278 C179,296 176,315 177,330
           C178,340 183,346 190,346
           C197,346 202,340 204,330
           C206,318 204,300 202,282"
        stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" opacity="0.65"
      />
      {/* pons */}
      <path d="M177,306 C168,310 163,320 168,330 C172,338 183,340 192,336"
            stroke={GOLD} strokeWidth="1" strokeLinecap="round" opacity="0.48"/>
      {/* medulla lines */}
      <path d="M179,318 C174,320 172,326 175,332" stroke={GOLD} strokeWidth="0.8" strokeLinecap="round" opacity="0.35"/>

      {/* ── MAIN CORTEX OUTLINE ── */}
      <path
        d="M72,152
           C69,128 72,96 87,70
           C104,42 136,24 175,18
           C208,13 246,16 278,28
           C314,42 344,66 362,98
           C380,128 384,162 378,190
           C370,216 350,232 326,236
           C310,238 295,234 278,238
           C262,242 250,252 240,260
           C224,274 204,284 182,284
           C166,284 152,280 140,272
           C122,260 110,242 97,228
           C82,212 70,194 70,174
           C70,164 72,157 72,152 Z"
        stroke={GOLD} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.96"
      />

      {/* ── SYLVIAN FISSURE (lateral sulcus) — most prominent landmark ── */}
      {/* main trunk */}
      <path
        d="M118,182 C152,170 196,164 244,168 C278,171 312,184 332,200"
        stroke={GOLD} strokeWidth="2.1" strokeLinecap="round" opacity="0.92"
      />
      {/* ascending ramus */}
      <path
        d="M142,176 C135,158 128,136 132,114"
        stroke={GOLD} strokeWidth="1.7" strokeLinecap="round" opacity="0.78"
      />
      {/* anterior horizontal ramus */}
      <path
        d="M118,182 C104,178 90,172 80,162"
        stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" opacity="0.68"
      />

      {/* ── CENTRAL SULCUS (Rolando) ── */}
      <path
        d="M224,22 C218,48 212,82 208,116 C204,144 202,164 204,178"
        stroke={GOLD} strokeWidth="1.7" strokeLinecap="round" opacity="0.82"
      />

      {/* ── FRONTAL LOBE ── */}
      {/* precentral sulcus */}
      <path d="M204,26 C198,52 192,88 190,120 C188,146 190,164 193,176"
            stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" opacity="0.67"/>
      {/* superior frontal sulcus */}
      <path d="M82,90 C108,78 146,74 178,80 C196,83 208,90 212,97"
            stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" opacity="0.62"/>
      {/* inferior frontal sulcus */}
      <path d="M88,124 C114,114 148,112 172,119 C187,124 196,132 198,142"
            stroke={GOLD} strokeWidth="1.1" strokeLinecap="round" opacity="0.58"/>
      {/* frontal gyri — small undulations */}
      <path d="M78,64 C96,55 118,53 138,58 C148,61 155,66 157,72"
            stroke={GOLD} strokeWidth="0.9" strokeLinecap="round" opacity="0.48"/>
      <path d="M80,104 C96,96 116,95 134,100"
            stroke={GOLD} strokeWidth="0.9" strokeLinecap="round" opacity="0.44"/>
      <path d="M86,136 C100,130 118,129 134,134"
            stroke={GOLD} strokeWidth="0.9" strokeLinecap="round" opacity="0.42"/>
      <path d="M84,158 C98,153 116,153 130,157"
            stroke={GOLD} strokeWidth="0.8" strokeLinecap="round" opacity="0.38"/>
      {/* frontomarginal */}
      <path d="M74,144 C82,136 94,132 108,134"
            stroke={GOLD} strokeWidth="0.9" strokeLinecap="round" opacity="0.42"/>

      {/* ── PARIETAL LOBE ── */}
      {/* postcentral sulcus */}
      <path d="M248,20 C244,48 240,84 238,116 C236,144 238,164 242,178"
            stroke={GOLD} strokeWidth="1.4" strokeLinecap="round" opacity="0.72"/>
      {/* intraparietal sulcus — roughly horizontal */}
      <path d="M244,76 C268,66 296,62 322,68 C344,74 364,88 376,106"
            stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" opacity="0.63"/>
      {/* superior parietal lobule gyri */}
      <path d="M256,30 C272,24 295,24 316,32"
            stroke={GOLD} strokeWidth="0.9" strokeLinecap="round" opacity="0.46"/>
      <path d="M260,54 C278,46 302,46 322,55"
            stroke={GOLD} strokeWidth="0.9" strokeLinecap="round" opacity="0.44"/>
      {/* inferior parietal */}
      <path d="M 246,130 C 268,122 292,120 314,128"
            stroke={GOLD} strokeWidth="0.9" strokeLinecap="round" opacity="0.42"/>
      <path d="M 244,154 C 265,148 290,148 312,156"
            stroke={GOLD} strokeWidth="0.9" strokeLinecap="round" opacity="0.4"/>

      {/* ── TEMPORAL LOBE ── */}
      {/* superior temporal sulcus */}
      <path d="M126,206 C164,196 208,194 252,198 C284,202 314,214 332,228"
            stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" opacity="0.64"/>
      {/* inferior temporal sulcus */}
      <path d="M128,228 C164,222 208,221 248,226 C272,230 294,238 308,248"
            stroke={GOLD} strokeWidth="1.1" strokeLinecap="round" opacity="0.54"/>
      {/* temporal gyri undulations */}
      <path d="M112,216 C132,210 154,208 172,212"
            stroke={GOLD} strokeWidth="0.9" strokeLinecap="round" opacity="0.46"/>
      <path d="M114,238 C134,232 158,231 176,235"
            stroke={GOLD} strokeWidth="0.9" strokeLinecap="round" opacity="0.42"/>
      <path d="M118,256 C138,251 160,250 178,254"
            stroke={GOLD} strokeWidth="0.9" strokeLinecap="round" opacity="0.38"/>

      {/* ── OCCIPITAL LOBE ── */}
      {/* parieto-occipital sulcus */}
      <path d="M324,98 C340,122 354,152 358,182 C360,196 356,210 346,218"
            stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" opacity="0.66"/>
      {/* calcarine sulcus */}
      <path d="M322,196 C338,190 356,188 370,190"
            stroke={GOLD} strokeWidth="1.1" strokeLinecap="round" opacity="0.57"/>
      {/* lunate sulcus */}
      <path d="M336,116 C348,136 356,160 356,184"
            stroke={GOLD} strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      {/* occipital gyri */}
      <path d="M314,110 C328,132 336,158 336,182"
            stroke={GOLD} strokeWidth="0.9" strokeLinecap="round" opacity="0.44"/>
      <path d="M304,120 C315,142 320,166 318,188"
            stroke={GOLD} strokeWidth="0.8" strokeLinecap="round" opacity="0.4"/>

      {/* ── NEURAL DOTS & CONNECTIONS ── */}
      <circle cx="162" cy="104" r="2.8" fill={GOLD} opacity="0.62"/>
      <circle cx="220" cy="70"  r="2.4" fill={GOLD} opacity="0.56"/>
      <circle cx="278" cy="95"  r="2.2" fill={GOLD} opacity="0.5"/>
      <circle cx="175" cy="150" r="2.2" fill={GOLD} opacity="0.52"/>
      <circle cx="248" cy="134" r="2"   fill={GOLD} opacity="0.48"/>
      <circle cx="302" cy="162" r="2"   fill={GOLD} opacity="0.44"/>
      <circle cx="134" cy="208" r="2"   fill={GOLD} opacity="0.42"/>
      <circle cx="210" cy="192" r="1.8" fill={GOLD} opacity="0.4"/>

      <line x1="162" y1="104" x2="175" y2="150" stroke={GOLD} strokeWidth="0.7" opacity="0.28" strokeDasharray="3 4"/>
      <line x1="220" y1="70"  x2="248" y2="134" stroke={GOLD} strokeWidth="0.7" opacity="0.26" strokeDasharray="3 4"/>
      <line x1="278" y1="95"  x2="302" y2="162" stroke={GOLD} strokeWidth="0.7" opacity="0.24" strokeDasharray="3 4"/>
      <line x1="175" y1="150" x2="134" y2="208" stroke={GOLD} strokeWidth="0.7" opacity="0.24" strokeDasharray="3 4"/>
      <line x1="175" y1="150" x2="210" y2="192" stroke={GOLD} strokeWidth="0.7" opacity="0.22" strokeDasharray="3 4"/>

      {/* ── ATMOSPHERE RINGS ── */}
      <ellipse cx="218" cy="178" rx="188" ry="155"
               stroke={GOLD} strokeWidth="0.4" strokeDasharray="3 9" opacity="0.18"/>
      <ellipse cx="218" cy="178" rx="210" ry="172"
               stroke={GOLD} strokeWidth="0.3" opacity="0.08"/>
    </svg>
  )
}

export default function LeilaPage() {
  const [modal, setModal]         = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [particles, setParticles]   = useState<Array<{x:number;y:number;size:number;opacity:number;delay:number}>>([])
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    setParticles(
      Array.from({ length: 55 }, () => ({
        x:       Math.random() * 100,
        y:       Math.random() * 100,
        size:    Math.random() * 2.2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        delay:   Math.random() * 4,
      }))
    )
  }, [])

  const testimonials = [
    {
      name: 'Patrícia N.',
      text: 'A Leila tem um jeito muito tranquilo e acolhedor de nos receber, tornando as sessões muito confortáveis. Me ajudou muito a entender minhas emoções e a me conhecer melhor.',
    },
    {
      name: 'Marcos A.',
      text: 'Profissional incrível! Muito atenciosa e comprometida com o processo terapêutico. Já indiquei para amigos e familiares. Simplesmente a melhor que já consultei.',
    },
    {
      name: 'Fernanda S.',
      text: 'A Leila é uma psicóloga que vai muito além das consultas. Ela me deu ferramentas reais para lidar com minha ansiedade no dia a dia.',
    },
  ]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    const fd = new FormData(e.currentTarget)
    const payload = {
      nome:           fd.get('nome')           as string,
      email:          fd.get('email')          as string,
      whatsapp:       fd.get('whatsapp')       as string,
      data_preferida: fd.get('data_preferida') as string,
      horario:        fd.get('horario')        as string,
      mensagem:       fd.get('mensagem')       as string,
    }
    try {
      const res  = await fetch('/api/contact-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao enviar')
      setSubmitted(true)
      formRef.current?.reset()
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao enviar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── service cards data ── */
  const services = [
    { icon: <Brain size={18} />,      title: 'Terapia Cognitiva',    sub: 'TCC baseada em evidências'  },
    { icon: <Heart size={18} />,      title: 'Controle de Ansiedade', sub: 'Técnicas personalizadas'   },
    { icon: <Leaf size={18} />,       title: 'Saúde Mental',          sub: 'Cuidado holístico'          },
    { icon: <Laptop size={18} />,     title: 'Atendimento Online',    sub: '100% seguro e sigiloso'    },
    { icon: <Smartphone size={18} />, title: 'Suporte Contínuo',      sub: 'Acompanhamento constante'  },
  ]

  const notNormal = [
    'ESTAR ANSIOSO O TEMPO TODO',
    'ESTAR IRRITADO O TEMPO TODO',
    'SE PREOCUPAR COM A OPINIÃO ALHEIA O TEMPO TODO',
    'ESTAR TRISTE O TEMPO TODO',
    'SENSAÇÃO DE CANSAÇO O TEMPO TODO',
    'ESTAR EM LUTA O TEMPO TODO',
    'QUERER AGRADAR A TODOS O TEMPO TODO',
    'SE COBRAR DEMAIS',
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        *{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        body{background:${BLACK};font-family:'Inter',system-ui,sans-serif;overflow-x:hidden;color:${WHITE};}
        .pf{font-family:'Playfair Display',Georgia,serif;}

        /* ── PARTICLES ── */
        .ptcl-bg{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0;}
        .ptcl{position:absolute;border-radius:50%;background:${GOLD};}
        @keyframes twinkle{0%,100%{opacity:.12;transform:scale(1);}50%{opacity:.75;transform:scale(1.5);}}

        /* ── BRAIN SVG GLOW ── */
        .brain-svg{width:100%;max-width:420px;height:auto;cursor:crosshair;}
        .brain-svg svg{width:100%;height:auto;}
        .brain-svg path{
          transition: fill 0.18s ease, filter 0.18s ease;
        }
        .brain-svg path[fill="#c47a8a"]:hover{
          fill: #f0a8bc;
          filter: drop-shadow(0 0 6px rgba(196,122,138,.9)) drop-shadow(0 0 14px rgba(196,122,138,.6)) drop-shadow(0 0 28px rgba(196,122,138,.3));
        }
        @keyframes brainPulse{
          0%,100%{filter:drop-shadow(0 0 10px rgba(196,122,138,.4));}
          50%{filter:drop-shadow(0 0 22px rgba(196,122,138,.75)) drop-shadow(0 0 40px rgba(196,122,138,.35));}
        }
        .nn-brain-wrap:hover .brain-svg svg{
          animation: brainPulse 1.8s ease-in-out infinite;
        }

        /* ── CONTAINER ── */
        .ctr{max-width:1140px;margin:0 auto;width:100%;}

        /* ── NAV ── */
        .nav{
          background:rgba(13,6,8,.88);backdrop-filter:blur(20px);
          display:flex;align-items:center;justify-content:space-between;
          padding:0 60px;height:68px;
          position:sticky;top:0;z-index:200;
          border-bottom:1px solid rgba(196,122,138,.13);
        }
        .nav-inner{display:flex;align-items:center;justify-content:space-between;width:100%;max-width:1140px;margin:0 auto;}
        .nav-logo{display:flex;align-items:center;gap:11px;}
        .nav-logo-circle{
          width:36px;height:36px;
          background:linear-gradient(135deg,${WINE3},${WINE},${WINE2});
          border-radius:50%;display:flex;align-items:center;justify-content:center;
          box-shadow:0 0 18px rgba(139,26,53,.55);
          font-size:10px;font-weight:900;color:#fff;letter-spacing:-.5px;
        }
        .nav-brand{font-size:14px;font-weight:700;color:${WHITE};letter-spacing:.02em;}
        .nav-links{display:flex;gap:38px;list-style:none;}
        .nav-links a{color:rgba(255,255,255,.6);text-decoration:none;font-size:13px;font-weight:500;transition:color .2s;letter-spacing:.02em;}
        .nav-links a:hover{color:${GOLD};}
        .btn-nav{
          background:linear-gradient(135deg,${WINE},${WINE2});
          color:#fff;border:none;border-radius:8px;
          padding:10px 22px;font-size:13px;font-weight:700;
          cursor:pointer;transition:all .25s;
          box-shadow:0 4px 14px rgba(139,26,53,.4);letter-spacing:.03em;
        }
        .btn-nav:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(139,26,53,.6);}

        /* ── HERO ── */
        .hero{
          background:${BLACK};min-height:100vh;
          display:flex;align-items:center;
          padding:0 60px;position:relative;overflow:hidden;
        }
        .hero-inner{
          display:grid;grid-template-columns:1fr 1fr;
          align-items:center;gap:60px;
          max-width:1140px;margin:0 auto;width:100%;
        }
        .hero-glow1{position:absolute;top:-180px;right:-80px;width:580px;height:580px;background:radial-gradient(circle,rgba(139,26,53,.32) 0%,transparent 65%);pointer-events:none;z-index:0;}
        .hero-glow2{position:absolute;bottom:-120px;left:-80px;width:460px;height:460px;background:radial-gradient(circle,rgba(92,15,33,.22) 0%,transparent 65%);pointer-events:none;z-index:0;}
        .hero-left{position:relative;z-index:2;}
        .hero-tag{
          display:inline-flex;align-items:center;gap:8px;
          border:1px solid rgba(196,122,138,.28);border-radius:100px;
          padding:6px 16px;margin-bottom:26px;
          background:rgba(139,26,53,.09);
        }
        .hero-tag span{color:${GOLD};font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;}
        .hero-h1{font-size:52px;font-weight:900;color:${WHITE};line-height:1.08;margin-bottom:8px;letter-spacing:-1.5px;}
        .hero-h1 em{color:${GOLD};font-style:italic;font-family:'Playfair Display',serif;}
        .hero-sub-list{list-style:none;margin:20px 0 32px;}
        .hero-sub-list li{
          color:rgba(255,255,255,.58);font-size:14px;line-height:2.1;
          padding-left:20px;position:relative;
        }
        .hero-sub-list li::before{
          content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);
          width:6px;height:6px;border-radius:50%;
          background:${GOLD};opacity:.7;
        }
        .hero-cta-row{display:flex;gap:14px;flex-wrap:wrap;}
        .btn-primary{
          background:linear-gradient(135deg,${WINE},${WINE2});
          color:#fff;border:none;border-radius:8px;
          padding:14px 28px;font-size:14px;font-weight:700;
          cursor:pointer;transition:all .25s;
          box-shadow:0 6px 20px rgba(139,26,53,.45);letter-spacing:.03em;
          display:inline-flex;align-items:center;gap:8px;
        }
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(139,26,53,.65);}
        .btn-outline{
          background:transparent;color:${GOLD};
          border:1.5px solid ${GOLD};border-radius:8px;
          padding:14px 28px;font-size:14px;font-weight:700;
          cursor:pointer;transition:all .25s;letter-spacing:.03em;
          display:inline-flex;align-items:center;gap:8px;
        }
        .btn-outline:hover{background:${GOLD};color:${BLACK};transform:translateY(-2px);}

        /* HERO RIGHT */
        .hero-right{position:relative;z-index:2;display:flex;justify-content:center;align-items:center;}
        .hero-photo-wrap{position:relative;}
        .hero-photo-shape{
          width:390px;height:510px;
          background:linear-gradient(160deg,${WINE3},${DARK2});
          border-radius:55% 45% 40% 60% / 50% 45% 55% 50%;
          overflow:hidden;position:relative;
          border:1px solid rgba(196,122,138,.15);
          box-shadow:0 0 80px rgba(139,26,53,.28);
        }
        .hero-photo-ring{position:absolute;border-radius:50%;border:1px solid rgba(196,122,138,.18);}
        .hero-badge{
          position:absolute;bottom:56px;left:-40px;
          background:rgba(13,6,8,.92);border:1px solid rgba(196,122,138,.28);
          border-radius:14px;padding:12px 18px;
          display:flex;align-items:center;gap:11px;
          backdrop-filter:blur(16px);box-shadow:0 8px 30px rgba(0,0,0,.5);z-index:5;
        }
        .hero-badge-dot{width:9px;height:9px;border-radius:50%;background:#4ade80;flex-shrink:0;box-shadow:0 0 8px rgba(74,222,128,.6);}
        .hero-badge-top{
          position:absolute;top:72px;right:-36px;
          background:rgba(13,6,8,.92);border:1px solid rgba(196,122,138,.28);
          border-radius:12px;padding:10px 16px;
          display:flex;align-items:center;gap:8px;
          backdrop-filter:blur(16px);
        }

        /* ── SCHEDULE STRIP ── */
        .schedule-strip{
          background:${DARK2};padding:56px 60px;
          border-top:1px solid rgba(196,122,138,.1);
          border-bottom:1px solid rgba(196,122,138,.1);
        }
        .schedule-h2{font-size:34px;font-weight:900;color:${WHITE};margin-bottom:32px;letter-spacing:-.5px;}
        .schedule-h2 em{color:${GOLD};font-style:italic;}
        .schedule-cards{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:28px;}
        .sc-card{
          background:rgba(255,255,255,.04);border:1px solid rgba(196,122,138,.12);
          border-radius:14px;padding:18px 16px;
          display:flex;align-items:flex-start;gap:12px;
          transition:all .25s;cursor:pointer;
        }
        .sc-card:hover{border-color:${GOLD};background:rgba(196,122,138,.07);transform:translateY(-2px);}
        .sc-icon{
          width:36px;height:36px;border-radius:9px;flex-shrink:0;
          background:linear-gradient(135deg,${WINE3},${WINE});
          display:flex;align-items:center;justify-content:center;
          color:#fff;box-shadow:0 0 12px rgba(139,26,53,.35);
        }
        .sc-title{font-size:12px;font-weight:700;color:${WHITE};line-height:1.3;margin-bottom:3px;}
        .sc-sub{font-size:10px;color:rgba(255,255,255,.4);}
        .schedule-desc{color:rgba(255,255,255,.45);font-size:13px;line-height:1.9;max-width:720px;}

        /* ── NOT NORMAL ── */
        .not-normal{
          background:${BLACK};padding:100px 60px;
          position:relative;overflow:hidden;
        }
        .not-normal-inner{
          display:grid;grid-template-columns:1fr 1fr;
          gap:80px;align-items:center;
          max-width:1140px;margin:0 auto;
        }
        .nn-glow{position:absolute;right:-80px;top:50%;transform:translateY(-50%);width:480px;height:480px;background:radial-gradient(circle,rgba(255,160,200,.22) 0%,transparent 70%);pointer-events:none;}
        .nn-left{position:relative;z-index:2;display:flex;align-items:center;justify-content:center;}
        .nn-brain-wrap{
          position:relative;
          width:440px;height:440px;
          display:flex;align-items:center;justify-content:center;
          filter: drop-shadow(0 0 28px rgba(255,140,180,.35));
        }

        .nn-brain-ring{
          position:absolute;border-radius:50%;border:1px solid rgba(255,160,200,.45);
          pointer-events: none;
        }
        .nn-right{position:relative;z-index:2;}
        .nn-h2{font-size:34px;font-weight:900;color:${WHITE};line-height:1.2;margin-bottom:26px;letter-spacing:-.5px;}
        .nn-h2 em{color:${GOLD};font-style:italic;}
        .nn-list{list-style:none;display:flex;flex-direction:column;gap:11px;margin-bottom:28px;}
        .nn-item{
          display:flex;align-items:center;gap:13px;
          background:rgba(255,255,255,.025);border:1px solid rgba(196,122,138,.09);
          border-radius:10px;padding:13px 17px;
          font-size:12px;font-weight:600;color:rgba(255,255,255,.78);
          letter-spacing:.03em;transition:all .2s;
        }
        .nn-item:hover{border-color:rgba(196,122,138,.3);background:rgba(196,122,138,.06);}
        .nn-check{
          width:24px;height:24px;border-radius:50%;flex-shrink:0;
          background:linear-gradient(135deg,${WINE},${WINE2});
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 0 10px rgba(139,26,53,.4);color:#fff;
        }
        .nn-note{
          color:rgba(255,255,255,.38);font-size:13px;line-height:1.85;
          border-left:2px solid ${WINE};padding-left:16px;
        }

        /* ── DARK BREAK ── */
        .dark-break{
          background:linear-gradient(180deg,${BLACK} 0%,${DARK2} 50%,${BLACK} 100%);
          padding:80px 60px;text-align:center;
          border-top:1px solid rgba(196,122,138,.08);
          border-bottom:1px solid rgba(196,122,138,.08);
        }
        .dark-break-inner{max-width:740px;margin:0 auto;}
        .dark-break p{color:rgba(255,255,255,.5);font-size:15px;line-height:1.95;margin-bottom:32px;}

        /* ── ONLINE ── */
        .online-sec{
          background:${DARK};padding:100px 60px;
          position:relative;overflow:hidden;
        }
        .online-inner{
          display:grid;grid-template-columns:1fr 1fr;
          gap:80px;align-items:center;
          max-width:1140px;margin:0 auto;
        }
        .online-glow{position:absolute;left:-80px;top:50%;transform:translateY(-50%);width:420px;height:420px;background:radial-gradient(circle,rgba(139,26,53,.16) 0%,transparent 70%);pointer-events:none;}
        .online-eyebrow{font-size:11px;font-weight:700;color:${GOLD};letter-spacing:.1em;text-transform:uppercase;margin-bottom:14px;}
        .online-h2{font-size:38px;font-weight:900;color:${WHITE};line-height:1.15;margin-bottom:20px;letter-spacing:-.5px;}
        .online-h2 em{color:${GOLD};font-style:italic;}
        .online-p{color:rgba(255,255,255,.52);font-size:14px;line-height:1.9;margin-bottom:16px;}

        /* video call mockup */
        .laptop-wrap{
          background:rgba(255,255,255,.035);border:1px solid rgba(196,122,138,.14);
          border-radius:20px;padding:22px;
          box-shadow:0 0 60px rgba(139,26,53,.13);
        }
        .laptop-screen{
          background:${DARK2};border-radius:12px;
          overflow:hidden;position:relative;
          border:1px solid rgba(196,122,138,.1);
        }
        .vcall{display:flex;flex-direction:column;height:310px;padding:14px;gap:10px;}
        .vcall-top{display:flex;gap:10px;flex:1;}
        .vcall-main{
          flex:1;background:linear-gradient(135deg,rgba(139,26,53,.18),rgba(92,15,33,.12));
          border-radius:10px;border:1px solid rgba(196,122,138,.18);
          display:flex;align-items:center;justify-content:center;
        }
        .vcall-avatar{
          width:56px;height:56px;border-radius:50%;
          background:linear-gradient(135deg,${WINE3},${WINE});
          display:flex;align-items:center;justify-content:center;color:#fff;
          box-shadow:0 0 24px rgba(139,26,53,.5);
        }
        .vcall-side{width:76px;display:flex;flex-direction:column;gap:8px;}
        .vcall-thumb{
          flex:1;background:rgba(255,255,255,.05);
          border-radius:8px;border:1px solid rgba(196,122,138,.12);
          display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.3);
        }
        .vcall-bottom{display:flex;gap:10px;justify-content:center;padding-top:4px;}
        .vcall-btn{
          width:38px;height:38px;border-radius:50%;
          background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);
          display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.6);
        }
        .vcall-btn.red{background:rgba(220,38,38,.75);border-color:transparent;color:#fff;}
        .vcall-label{
          position:absolute;top:14px;left:14px;
          background:rgba(139,26,53,.7);border-radius:6px;
          padding:4px 10px;font-size:10px;font-weight:700;color:#fff;
          letter-spacing:.05em;
        }

        /* ── TESTIMONIALS ── */
        .testimonials{background:${BLACK};padding:100px 60px;position:relative;overflow:hidden;}
        .test-glow{position:absolute;top:-100px;right:-80px;width:480px;height:480px;background:radial-gradient(circle,rgba(139,26,53,.14) 0%,transparent 70%);pointer-events:none;}
        .test-inner{max-width:1140px;margin:0 auto;}
        .test-eyebrow{font-size:11px;font-weight:700;color:${GOLD};letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px;}
        .test-h2{font-size:36px;font-weight:900;color:${WHITE};margin-bottom:44px;letter-spacing:-.5px;}
        .test-h2 em{color:${GOLD};font-style:italic;}
        .test-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;}
        .test-card{
          background:rgba(255,255,255,.025);border:1px solid rgba(196,122,138,.11);
          border-radius:18px;padding:28px;transition:all .25s;
        }
        .test-card:hover{border-color:rgba(196,122,138,.28);background:rgba(196,122,138,.045);}
        .test-stars{display:flex;gap:3px;margin-bottom:14px;}
        .test-star{color:${GOLD};font-size:13px;}
        .test-text{color:rgba(255,255,255,.62);font-size:13px;line-height:1.85;margin-bottom:20px;font-style:italic;}
        .test-name{font-size:13px;font-weight:700;color:${WHITE};}
        .test-role{font-size:11px;color:rgba(255,255,255,.32);margin-top:2px;}

        /* ── ABOUT ── */
        .about-sec{background:${DARK};padding:100px 60px;position:relative;overflow:hidden;}
        .about-glow{position:absolute;right:-80px;bottom:-80px;width:480px;height:480px;background:radial-gradient(circle,rgba(139,26,53,.2) 0%,transparent 70%);pointer-events:none;}
        .about-inner{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;max-width:1140px;margin:0 auto;}
        .about-left{position:relative;z-index:2;}
        .about-eyebrow{font-size:11px;font-weight:700;color:${GOLD};letter-spacing:.1em;text-transform:uppercase;margin-bottom:14px;}
        .about-name{font-size:42px;font-weight:900;color:${WHITE};letter-spacing:-.5px;margin-bottom:4px;}
        .about-name em{color:${GOLD};font-style:italic;}
        .about-crp{font-size:12px;color:${GOLD};font-weight:600;letter-spacing:.08em;margin-bottom:22px;}
        .about-sec-title{font-size:11px;font-weight:700;color:${GOLD};text-transform:uppercase;letter-spacing:.1em;margin:20px 0 6px;}
        .about-sec-text{color:rgba(255,255,255,.58);font-size:13px;line-height:1.85;}
        .about-stats{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:28px;}
        .stat-card{background:rgba(255,255,255,.03);border:1px solid rgba(196,122,138,.11);border-radius:12px;padding:15px 17px;}
        .stat-num{font-size:26px;font-weight:900;color:${GOLD};margin-bottom:2px;}
        .stat-label{font-size:11px;color:rgba(255,255,255,.4);font-weight:500;}
        .about-socials{display:flex;gap:10px;margin-top:26px;flex-wrap:wrap;}
        .social-chip{
          display:inline-flex;align-items:center;gap:7px;
          border:1px solid rgba(196,122,138,.22);border-radius:8px;
          padding:9px 16px;font-size:12px;font-weight:600;
          color:rgba(255,255,255,.65);background:rgba(255,255,255,.03);
          cursor:pointer;transition:all .2s;
        }
        .social-chip:hover{border-color:${GOLD};color:${GOLD};}
        .about-right{position:relative;z-index:2;display:flex;justify-content:center;}
        .about-photo-frame{position:relative;width:320px;}
        .about-photo-shape{
          width:320px;height:410px;
          background:linear-gradient(160deg,${WINE3},${DARK2});
          border-radius:60% 40% 50% 50% / 45% 45% 55% 55%;
          overflow:hidden;
          border:1px solid rgba(196,122,138,.18);
          box-shadow:0 0 60px rgba(139,26,53,.22);
        }
        .about-logo-badge{
          position:absolute;bottom:-18px;right:-18px;
          width:96px;height:96px;
          background:${DARK2};border:1px solid rgba(196,122,138,.2);
          border-radius:50%;display:flex;align-items:center;justify-content:center;
          box-shadow:0 0 28px rgba(139,26,53,.28);
        }
        .about-logo-inner{
          width:68px;height:68px;
          background:linear-gradient(135deg,${WINE3},${WINE});
          border-radius:50%;display:flex;align-items:center;justify-content:center;
          font-size:20px;font-weight:900;color:#fff;letter-spacing:-1px;
        }

        /* ── FOOTER ── */
        .footer{background:${DARK2};padding:60px 60px 28px;border-top:1px solid rgba(196,122,138,.09);}
        .footer-inner{max-width:1140px;margin:0 auto;}
        .footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;margin-bottom:44px;}
        .footer-brand{font-size:18px;font-weight:800;color:${WHITE};margin-bottom:8px;}
        .footer-tag{font-size:11px;color:${GOLD};margin-bottom:14px;letter-spacing:.06em;}
        .footer-desc{color:rgba(255,255,255,.38);font-size:13px;line-height:1.8;}
        .footer-col-title{font-size:11px;font-weight:700;color:${GOLD};text-transform:uppercase;letter-spacing:.1em;margin-bottom:16px;}
        .footer-links{list-style:none;display:flex;flex-direction:column;gap:9px;}
        .footer-links li a{color:rgba(255,255,255,.42);font-size:13px;text-decoration:none;transition:color .2s;}
        .footer-links li a:hover{color:${GOLD};}
        .f-contact{display:flex;align-items:center;gap:9px;color:rgba(255,255,255,.42);font-size:13px;margin-bottom:10px;}
        .footer-bottom{border-top:1px solid rgba(196,122,138,.07);padding-top:22px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;}
        .footer-copy{font-size:12px;color:rgba(255,255,255,.22);}
        .btn-wpp{
          background:linear-gradient(135deg,#25d366,#1cb954);
          color:#fff;border:none;border-radius:8px;
          padding:10px 20px;font-size:13px;font-weight:700;
          cursor:pointer;transition:all .2s;
          display:inline-flex;align-items:center;gap:8px;
          box-shadow:0 4px 14px rgba(37,211,102,.28);
        }
        .btn-wpp:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(37,211,102,.4);}

        /* ── MODAL ── */
        .modal-overlay{
          position:fixed;inset:0;background:rgba(0,0,0,.78);
          backdrop-filter:blur(8px);z-index:400;
          display:flex;align-items:center;justify-content:center;padding:20px;
        }
        .modal-box{
          background:${DARK2};border:1px solid rgba(196,122,138,.2);
          border-radius:22px;padding:34px;
          max-width:460px;width:100%;max-height:92vh;overflow-y:auto;
          box-shadow:0 0 60px rgba(139,26,53,.28);
        }
        .modal-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:26px;}
        .modal-close{
          background:rgba(255,255,255,.06);border:1px solid rgba(196,122,138,.18);
          border-radius:10px;width:36px;height:36px;cursor:pointer;
          display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.55);transition:all .2s;
        }
        .modal-close:hover{border-color:${GOLD};color:${GOLD};}
        .form-group{margin-bottom:15px;}
        .form-label{font-size:11px;font-weight:700;color:${GOLD};letter-spacing:.07em;text-transform:uppercase;margin-bottom:5px;display:block;}
        .form-input{
          width:100%;padding:11px 14px;
          border:1px solid rgba(196,122,138,.18);border-radius:9px;
          font-size:14px;color:${WHITE};background:rgba(255,255,255,.04);
          outline:none;font-family:inherit;transition:border-color .2s;
        }
        .form-input:focus{border-color:${GOLD};}
        .form-input::placeholder{color:rgba(255,255,255,.22);}
        textarea.form-input{resize:vertical;}
        .btn-submit{
          background:linear-gradient(135deg,${WINE},${WINE2});
          color:#fff;border:none;border-radius:9px;
          padding:14px;font-size:14px;font-weight:700;
          cursor:pointer;transition:all .25s;
          display:flex;align-items:center;justify-content:center;
          gap:8px;width:100%;margin-top:8px;
          box-shadow:0 6px 18px rgba(139,26,53,.4);
        }
        .btn-submit:hover{box-shadow:0 10px 26px rgba(139,26,53,.6);}
        .btn-wpp-modal{
          background:linear-gradient(135deg,#25d366,#1cb954);
          color:#fff;border:none;border-radius:9px;
          padding:12px;font-size:14px;font-weight:700;
          cursor:pointer;transition:all .2s;
          display:flex;align-items:center;justify-content:center;
          gap:8px;width:100%;margin-top:8px;
        }
        .btn-wpp-modal:hover{opacity:.9;}
        @keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}

        /* ── TABLET ── */
        @media(max-width:1024px){
          .nav{padding:0 28px;}
          .hero{padding:80px 28px;}
          .hero-inner{grid-template-columns:1fr;gap:52px;}
          .hero-right{height:auto;}
          .schedule-strip{padding:48px 28px;}
          .schedule-cards{grid-template-columns:repeat(3,1fr);}
          .not-normal{padding:70px 28px;}
          .not-normal-inner,.online-inner,.about-inner{grid-template-columns:1fr;gap:40px;}
          .online-sec,.testimonials,.about-sec{padding:70px 28px;}
          .test-grid{grid-template-columns:1fr 1fr;}
          .footer{padding:44px 28px 22px;}
          .footer-grid{grid-template-columns:1fr 1fr;gap:28px;}
          .dark-break{padding:56px 28px;}
        }

        /* ── MOBILE ── */
        @media(max-width:768px){
          .nav{padding:0 18px;}
          .nav-links{display:none;}
          .btn-nav{padding:8px 16px;font-size:12px;}
          .hero{padding:60px 18px;}
          .hero-h1{font-size:36px;}
          .hero-tag{margin:0 0 22px;}
          .hero-photo-shape{width:280px;height:360px;}
          .hero-badge{bottom:26px;left:-8px;}
          .hero-badge-top{display:none;}
          .schedule-strip{padding:40px 18px;}
          .schedule-cards{grid-template-columns:1fr 1fr;}
          .schedule-h2{font-size:26px;}
          .not-normal{padding:52px 18px;}
          .nn-brain-wrap{width:300px;height:300px;}
          .nn-h2{font-size:26px;}
          .online-sec,.testimonials,.about-sec{padding:52px 18px;}
          .online-h2{font-size:28px;}
          .test-grid{grid-template-columns:1fr;}
          .test-h2{font-size:28px;}
          .about-name{font-size:32px;}
          .about-photo-shape{width:280px;height:360px;}
          .about-stats{grid-template-columns:1fr 1fr;}
          .footer{padding:36px 18px 18px;}
          .footer-grid{grid-template-columns:1fr;}
          .footer-bottom{flex-direction:column;text-align:center;}
          .dark-break{padding:48px 18px;}
          .modal-overlay{padding:0;align-items:flex-end;}
          .modal-box{border-radius:22px 22px 0 0;padding:26px 18px;}
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-logo">
            <div className="nav-logo-circle">LSL</div>
            <span className="nav-brand">Leila Santos Lopes</span>
          </div>
          <ul className="nav-links">
            <li><a href="#sobre">Sobre</a></li>
            <li><a href="#servicos">Serviços</a></li>
            <li><a href="#depoimentos">Depoimentos</a></li>
            <li><a href="#contato">Contato</a></li>
          </ul>
          <button className="btn-nav" onClick={() => setModal(true)}>Agendar Sessão</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-glow1" />
        <div className="hero-glow2" />
        <div className="ptcl-bg">
          {particles.map((p, i) => (
            <div key={i} className="ptcl" style={{
              left: `${p.x}%`, top: `${p.y}%`,
              width: p.size, height: p.size, opacity: p.opacity,
              animation: `twinkle ${2.5 + p.delay}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }} />
          ))}
        </div>

        <div className="hero-inner">
          <motion.div className="hero-left"
            initial={{opacity:0,x:-40}} animate={{opacity:1,x:0}} transition={{duration:.8}}>
            <div className="hero-tag">
              <span>Psicóloga Clínica · CRP 06/XXXXX</span>
            </div>
            <h1 className="hero-h1">
              Conquiste sua <em>autonomia</em><br/>
              emocional e <em>bem-estar</em>.
            </h1>
            <ul className="hero-sub-list">
              <li>Praça d&#39;Aldeia</li>
              <li>Inteligência Emocional</li>
              <li>Desenvolvimento Saudável</li>
              <li>Construção de Hábitos Saudáveis</li>
            </ul>
            <div className="hero-cta-row">
              <button className="btn-primary" onClick={() => setModal(true)}>
                <Calendar size={15}/> Agendar Sessão
              </button>
              <button className="btn-outline"
                onClick={() => window.open('https://wa.me/5511915396328','_blank')}>
                <MessageCircle size={15}/> Fale Agora
              </button>
            </div>
          </motion.div>

          <motion.div className="hero-right"
            initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} transition={{duration:.9}}>
            <div className="hero-photo-wrap">
              <div className="hero-photo-shape">
                <div className="hero-photo-ring" style={{width:300,height:300,top:'50%',left:'50%',transform:'translate(-50%,-50%)'}} />
                <div className="hero-photo-ring" style={{width:200,height:200,top:'50%',left:'50%',transform:'translate(-50%,-50%)',opacity:.5}} />
                <Image
                  src="/leila/hero-leila.png"
                  alt="Leila dos Santos Lopes — Psicóloga Clínica"
                  width={390} height={510}
                  style={{objectFit:'contain',objectPosition:'bottom center',width:'100%',height:'100%',position:'absolute',inset:0,zIndex:2,transform:'scale(1.08)'}}
                  priority
                  unoptimized
                />
              </div>
              <div className="hero-badge">
                <div className="hero-badge-dot" />
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:WHITE}}>Disponível Online</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,.42)'}}>Agende sua sessão</div>
                </div>
              </div>
              <div className="hero-badge-top">
                <Star size={14} color={GOLD} fill={GOLD} />
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:WHITE}}>+8 anos</div>
                  <div style={{fontSize:10,color:'rgba(255,255,255,.38)'}}>de experiência</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SCHEDULE STRIP ── */}
      <section className="schedule-strip" id="servicos">
        <div className="ctr">
          <h2 className="schedule-h2">Agende <em>sua sessão.</em></h2>
          <div className="schedule-cards">
            {services.map((s, i) => (
              <motion.div key={i} className="sc-card"
                initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}}
                viewport={{once:true}} transition={{delay:i*.07}}
                onClick={() => setModal(true)}>
                <div className="sc-icon">{s.icon}</div>
                <div>
                  <div className="sc-title">{s.title}</div>
                  <div className="sc-sub">{s.sub}</div>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="schedule-desc">
            O seu processo começa com uma sessão individual focada, no qual você conta sua história, seus sonhos e objetivos terapêuticos. Juntas vamos encontrar o caminho mais adequado para o seu desenvolvimento emocional e equilíbrio.
          </p>
        </div>
      </section>

      {/* ── NÃO É NORMAL ── */}
      <section className="not-normal">
        <div className="nn-glow" />
        <div className="not-normal-inner">
          <motion.div className="nn-left"
            initial={{opacity:0,x:-30}} whileInView={{opacity:1,x:0}}
            viewport={{once:true}} transition={{duration:.7}}>
            <div className="nn-brain-wrap">
              <div className="nn-brain-ring" style={{inset:0}} />
              <div className="nn-brain-ring" style={{inset:-18,opacity:.55}} />
              <div className="nn-brain-ring" style={{inset:-36,opacity:.25}} />
              <BrainSketch />
            </div>
          </motion.div>

          <motion.div className="nn-right"
            initial={{opacity:0,x:30}} whileInView={{opacity:1,x:0}}
            viewport={{once:true}} transition={{duration:.7}}>
            <h2 className="nn-h2">
              <em>NÃO É NORMAL</em> E <em>NÃO É</em><br/>SAUDÁVEL:
            </h2>
            <ul className="nn-list">
              {notNormal.map((item, i) => (
                <motion.li key={i} className="nn-item"
                  initial={{opacity:0,x:16}} whileInView={{opacity:1,x:0}}
                  viewport={{once:true}} transition={{delay:i*.06}}>
                  <div className="nn-check">
                    <CheckCircle2 size={13} />
                  </div>
                  {item}
                </motion.li>
              ))}
            </ul>
            <p className="nn-note">
              Fala comigo e veja como a terapia cognitivo-comportamental pode te ajudar a superar essas dificuldades e tornar as coisas do dia-a-dia mais leves. Cuide da sua saúde mental.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── DARK BREAK ── */}
      <div className="dark-break">
        <motion.div className="dark-break-inner"
          initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
          <p>
            Através de consultas ao vivo em sessões individuais, você aprende estratégias e habilidades práticas para lidar com seus desafios emocionais. Em cada sessão, você será guiada por exercícios que vão fortalecer o seu bem-estar e autonomia emocional.
          </p>
          <button className="btn-primary" style={{margin:'0 auto'}} onClick={() => setModal(true)}>
            <Calendar size={15}/> Agendar Sessão
          </button>
        </motion.div>
      </div>

      {/* ── ATENDIMENTO ONLINE ── */}
      <section className="online-sec">
        <div className="online-glow" />
        <div className="online-inner">
          <motion.div style={{position:'relative',zIndex:2}}
            initial={{opacity:0,x:-30}} whileInView={{opacity:1,x:0}}
            viewport={{once:true}} transition={{duration:.6}}>
            <div className="online-eyebrow">Atendimento</div>
            <h2 className="online-h2">
              Atendimento psicológico de<br/><em>onde estiver.</em>
            </h2>
            <p className="online-p">
              Você escolhe o ambiente em que se sente mais confortável — sua casa, o trabalho, qualquer lugar. O que você compartilha aqui, fica aqui.
            </p>
            <p className="online-p">
              Na primeira sessão descobrimos como você está hoje, como você quer ser, quais caminhos seguir e o que você mais precisa para lidar com os seus dias.
            </p>
            <p className="online-p">
              A terapia cognitivo-comportamental desenvolve um olhar mais favorável para si e para os outros, criando um espaço onde você pode simplesmente ser.
            </p>
          </motion.div>

          <motion.div style={{position:'relative',zIndex:2}}
            initial={{opacity:0,x:30}} whileInView={{opacity:1,x:0}}
            viewport={{once:true}} transition={{duration:.6}}>
            <div className="laptop-wrap">
              <div className="laptop-screen">
                <div className="vcall">
                  <div style={{position:'relative'}}>
                    <div className="vcall-label">Em sessão</div>
                  </div>
                  <div className="vcall-top">
                    <div className="vcall-main" style={{overflow:'hidden',position:'relative'}}>
                      <Image
                        src="/leila/card-leila-cropped.png"
                        alt="Leila em consulta online"
                        width={280} height={210}
                        style={{objectFit:'cover',objectPosition:'center 15%',width:'100%',height:'100%',position:'absolute',inset:0}}
                        unoptimized
                      />
                    </div>
                    <div className="vcall-side">
                      <div className="vcall-thumb">
                        <User size={16} />
                      </div>
                      <div className="vcall-thumb">
                        <MessageSquare size={14} />
                      </div>
                    </div>
                  </div>
                  <div className="vcall-bottom">
                    <div className="vcall-btn"><Mic size={15}/></div>
                    <div className="vcall-btn"><Video size={15}/></div>
                    <div className="vcall-btn red"><PhoneOff size={15}/></div>
                    <div className="vcall-btn"><MessageSquare size={15}/></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="testimonials" id="depoimentos">
        <div className="test-glow" />
        <div className="test-inner">
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
            <div className="test-eyebrow">Depoimentos</div>
            <h2 className="test-h2">O que estão falando <em>das sessões</em></h2>
            <div className="test-grid">
              {testimonials.map((t, i) => (
                <motion.div key={i} className="test-card"
                  initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}}
                  viewport={{once:true}} transition={{delay:i*.1}}>
                  <div className="test-stars">
                    {Array.from({length:5}).map((_,s) => (
                      <Star key={s} size={13} color={GOLD} fill={GOLD} />
                    ))}
                  </div>
                  <p className="test-text">"{t.text}"</p>
                  <div className="test-name">{t.name}</div>
                  <div className="test-role">Paciente</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SOBRE A LEILA ── */}
      <section className="about-sec" id="sobre">
        <div className="about-glow" />
        <div className="about-inner">
          <motion.div className="about-left"
            initial={{opacity:0,x:-30}} whileInView={{opacity:1,x:0}}
            viewport={{once:true}} transition={{duration:.6}}>
            <div className="about-eyebrow">Psicóloga</div>
            <h2 className="about-name pf">Leila<br/><em>dos Santos Lopes:</em></h2>
            <div className="about-crp">CRP 06/XXXXX</div>

            <div className="about-sec-title">Abordagem:</div>
            <p className="about-sec-text">
              Terapeuta Cognitivo-Comportamental com conhecimentos em TCC, Distimia, pilates terapêutico, Autocompaixão, Acceptance and Commitment Therapy e práticas de autoconhecimento.
            </p>

            <div className="about-sec-title">Um pouco de mim:</div>
            <p className="about-sec-text">
              Trabalho com psicologia de uma forma única — com a bagagem técnica de mais de 8 anos em saúde mental, oferecendo um atendimento com um toque especial de humanização e cuidado, tornando o processo terapêutico mais eficaz e genuíno.
            </p>

            <div className="about-sec-title">Comprometida:</div>
            <p className="about-sec-text">
              Acredito no processo de autoconhecimento como uma das ferramentas mais poderosas para transformar vidas. Juntas vamos construir um caminho de florescimento, tornando o dia a dia muito mais possível.
            </p>

            <div className="about-stats">
              <div className="stat-card">
                <div className="stat-num">+8</div>
                <div className="stat-label">Anos de experiência</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">+500</div>
                <div className="stat-label">Pacientes atendidos</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">100%</div>
                <div className="stat-label">Online e presencial</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">TCC</div>
                <div className="stat-label">Especialização</div>
              </div>
            </div>

            <div className="about-socials">
              <button className="social-chip"><Instagram size={14}/> Instagram</button>
              <button className="social-chip"><Linkedin size={14}/> LinkedIn</button>
              <button className="social-chip"><Monitor size={14}/> CRP Online</button>
            </div>
          </motion.div>

          <motion.div className="about-right"
            initial={{opacity:0,x:30}} whileInView={{opacity:1,x:0}}
            viewport={{once:true}} transition={{duration:.6}}>
            <div className="about-photo-frame">
              <div className="about-photo-shape">
                <Image
                  src="/leila/sobre-leila-cropped.png"
                  alt="Leila dos Santos Lopes"
                  width={320} height={410}
                  style={{objectFit:'cover',objectPosition:'center top',width:'100%',height:'100%',transform:'scale(1.15) translateX(-20px)'}}
                  unoptimized
                />
              </div>
              <div className="about-logo-badge">
                <div className="about-logo-inner">LSL</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer" id="contato">
        <div className="footer-inner">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">Leila Santos Lopes</div>
              <div className="footer-tag">Psicóloga Clínica · CRP 06/XXXXX</div>
              <p className="footer-desc">
                Especialista em saúde mental e bem-estar emocional. Atendimento online e presencial com mais de 8 anos de experiência transformando vidas.
              </p>
            </div>
            <div>
              <div className="footer-col-title">Navegação</div>
              <ul className="footer-links">
                <li><a href="#sobre">Sobre</a></li>
                <li><a href="#servicos">Serviços</a></li>
                <li><a href="#depoimentos">Depoimentos</a></li>
                <li><a href="#contato">Contato</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Serviços</div>
              <ul className="footer-links">
                <li><a href="#servicos">Terapia Individual</a></li>
                <li><a href="#servicos">Controle de Ansiedade</a></li>
                <li><a href="#servicos">Saúde Mental</a></li>
                <li><a href="#servicos">Atendimento Online</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Contato</div>
              <div className="f-contact"><Phone size={13} color={GOLD}/> (11) 91539-6328</div>
              <div className="f-contact"><Mail size={13} color={GOLD}/> psicoleilalopes@gmail.com</div>
              <div className="f-contact"><MapPin size={13} color={GOLD}/> São Paulo, SP</div>
              <div className="f-contact"><Monitor size={13} color={GOLD}/> Atendimento Online</div>
            </div>
          </div>
          <div className="footer-bottom">
            <span className="footer-copy">© 2025 Leila Santos Lopes. Todos os direitos reservados.</span>
            <button className="btn-wpp"
              onClick={() => window.open('https://wa.me/5511915396328','_blank')}>
              <MessageCircle size={14}/> WhatsApp
            </button>
          </div>
        </div>
      </footer>

      {/* ── MODAL ── */}
      <AnimatePresence>
        {modal && (
          <motion.div className="modal-overlay"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={() => { setModal(false); setSubmitted(false); setSubmitError('') }}>
            <motion.div className="modal-box"
              initial={{scale:.95,y:30,opacity:0}} animate={{scale:1,y:0,opacity:1}}
              exit={{scale:.95,opacity:0}} onClick={e => e.stopPropagation()}>
              <div className="modal-head">
                <div>
                  <h2 style={{fontSize:22,fontWeight:900,color:WHITE,marginBottom:4}}>Agendar Sessão</h2>
                  <p style={{color:'rgba(255,255,255,.38)',fontSize:13}}>com Leila dos Santos Lopes</p>
                </div>
                <button className="modal-close"
                  onClick={() => { setModal(false); setSubmitted(false); setSubmitError('') }}>
                  <X size={15}/>
                </button>
              </div>

              {submitted ? (
                <div style={{textAlign:'center',padding:'32px 0'}}>
                  <CheckCircle2 size={52} color={GOLD} style={{margin:'0 auto 16px'}}/>
                  <h3 style={{fontSize:20,fontWeight:800,color:WHITE,marginBottom:8}}>Pedido enviado!</h3>
                  <p style={{color:'rgba(255,255,255,.48)',fontSize:14,lineHeight:1.7,marginBottom:24}}>
                    Recebemos seu pedido. Leila entrará em contato em breve pelo WhatsApp.
                  </p>
                  <button className="btn-wpp-modal"
                    onClick={() => { setModal(false); setSubmitted(false);
                      window.open('https://wa.me/5511915396328?text=Olá Leila, acabei de preencher o formulário de agendamento!','_blank') }}>
                    <MessageCircle size={16}/> Chamar no WhatsApp
                  </button>
                </div>
              ) : (
                <form ref={formRef} onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">Seu Nome *</label>
                    <input className="form-input" name="nome" type="text" placeholder="Nome completo" required/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">E-mail *</label>
                    <input className="form-input" name="email" type="email" placeholder="seu@email.com" required/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">WhatsApp *</label>
                    <input className="form-input" name="whatsapp" type="tel" placeholder="(11) 91539-6328" required/>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <div className="form-group">
                      <label className="form-label">Data Preferida</label>
                      <input className="form-input" name="data_preferida" type="date"/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Horário</label>
                      <input className="form-input" name="horario" type="time"/>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mensagem (opcional)</label>
                    <textarea className="form-input" name="mensagem" rows={3}
                      placeholder="Conte um pouco sobre o que te trouxe até aqui..."/>
                  </div>
                  {submitError && (
                    <p style={{color:'#f87171',fontSize:13,marginBottom:8,textAlign:'center'}}>{submitError}</p>
                  )}
                  <button type="submit" className="btn-submit" disabled={submitting}>
                    {submitting
                      ? <><Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/> Enviando...</>
                      : <><Calendar size={15}/> Confirmar Agendamento</>}
                  </button>
                  <p style={{fontSize:11,color:'rgba(255,255,255,.28)',textAlign:'center',margin:'10px 0 6px'}}>
                    Ou fale diretamente:
                  </p>
                  <button type="button" className="btn-wpp-modal"
                    onClick={() => window.open('https://wa.me/5511915396328?text=Olá Leila, gostaria de agendar uma sessão!','_blank')}>
                    <MessageCircle size={16}/> Confirmar via WhatsApp
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
