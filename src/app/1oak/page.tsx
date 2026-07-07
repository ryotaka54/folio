/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  AnimatePresence,
} from 'framer-motion'

// ─── Font references (CSS variables set by layout.tsx) ────────────────────────
const FB = 'var(--font-barlow), Barlow, sans-serif'
const FC = 'var(--font-bebas), "Bebas Neue", "Arial Narrow", sans-serif'

// ─── Verified Unsplash images (CDN URLs confirmed 200 via curl) ───────────────
const IM = {
  // Hero: aerial Shibuya Crossing at night — rendered grayscale to match 1OAK brand
  hero:   'https://images.unsplash.com/photo-1602646993760-7b885ba225af',
  dance:  'https://images.unsplash.com/photo-1578736641330-3155e606cd40', // green-lit dance floor
  bar:    'https://images.unsplash.com/photo-1578911489158-334e5cd2a051', // dim cocktail bar
  crowd:  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a', // euphoric concert crowd
  aerial: 'https://images.unsplash.com/photo-1604928141064-207cea6f571f', // aerial Tokyo Roppongi
}
const uImg = (base: string, w = 1200) =>
  `${base}?auto=format&fit=crop&w=${w}&q=85`

// ─── Data ─────────────────────────────────────────────────────────────────────
const EVENTS = [
  { id: 1, date: 'JUL 04', name: 'SUMMER HEAT',      artist: 'DJ Snake',   genre: 'Electronic'     },
  { id: 2, date: 'JUL 11', name: 'NOIR NIGHTS',      artist: 'Fisher',     genre: 'Techno'         },
  { id: 3, date: 'JUL 18', name: 'TOKYO DREAMS',     artist: 'Disclosure', genre: 'UK House'       },
  { id: 4, date: 'JUL 25', name: 'CLOSING CEREMONY', artist: 'Peggy Gou',  genre: 'Minimal Techno' },
] as const

const NAV_LINKS = ['EVENTS', 'RESERVE', 'GALLERY', 'CONTACT'] as const

// ─── Motion config ────────────────────────────────────────────────────────────
const EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number]

const staggerParent = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.25 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 34 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.88, ease: EXPO } },
}
const growLine = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: { scaleX: 1, opacity: 1, transition: { duration: 0.5, ease: EXPO } },
}
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.65, ease: 'easeOut' as const } },
}

// ─── Scroll-triggered fade-up utility ────────────────────────────────────────
function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.72, delay, ease: EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  const { scrollY } = useScroll()
  const reduce = useReducedMotion()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const unsub = scrollY.on('change', v => setScrolled(v > 55))
    return unsub
  }, [scrollY])

  const navBg = useTransform(
    scrollY,
    [0, 90],
    ['rgba(0,0,0,0)', 'rgba(0,0,0,0.92)'],
  )

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <motion.header
        style={{ backgroundColor: reduce ? 'rgba(0,0,0,0.92)' : navBg }}
        className={[
          'fixed top-0 inset-x-0 z-50 transition-[border-color,backdrop-filter] duration-500',
          scrolled ? 'backdrop-blur-xl border-b border-white/[0.06]' : '',
        ].join(' ')}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-[60px] flex items-center justify-between">
          <Link
            href="/1oak"
            aria-label="1OAK Tokyo home"
            className="flex items-center gap-2.5 hover:opacity-60 transition-opacity duration-300"
          >
            <div style={{ height: '32px', overflow: 'hidden' }} className="shrink-0">
              <img
                src="/images/1oak-logo.png"
                alt="1 OAK"
                style={{ height: '40px', width: 'auto' }}
              />
            </div>
            <span
              style={{ fontFamily: FB, fontSize: '0.52rem', letterSpacing: '0.42em' }}
              className="text-white/50 font-light hidden sm:block"
            >
              TOKYO
            </span>
          </Link>

          {/* Desktop links */}
          <nav aria-label="Primary">
            <ul className="hidden md:flex items-center gap-10 list-none">
              {NAV_LINKS.map(link => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase()}`}
                    style={{ fontFamily: FB }}
                    className="text-white/40 hover:text-white text-[0.6rem] tracking-[0.22em] transition-colors duration-300"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            className="md:hidden flex flex-col justify-center gap-[5px] p-2 -mr-2"
          >
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                animate={
                  menuOpen
                    ? i === 0 ? { rotate: 45,  y: 7,  opacity: 1 }
                    : i === 1 ? { opacity: 0 }
                    :            { rotate: -45, y: -7, opacity: 1 }
                    : { rotate: 0, y: 0, opacity: 1 }
                }
                transition={{ duration: 0.22 }}
                className="block w-5 h-px bg-white origin-center"
              />
            ))}
          </button>
        </div>
      </motion.header>

      {/* Mobile full-screen menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-nav"
            role="dialog"
            aria-label="Navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.28 }}
            className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-center gap-9 md:hidden"
          >
            {NAV_LINKS.map((link, i) => (
              <motion.a
                key={link}
                href={`#${link.toLowerCase()}`}
                onClick={() => setMenuOpen(false)}
                initial={{ opacity: 0, y: reduce ? 0 : 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : i * 0.065, duration: 0.38 }}
                style={{ fontFamily: FC }}
                className="text-white text-[2.5rem] font-black tracking-[0.08em] hover:text-white/40 transition-colors duration-200"
              >
                {link}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const { scrollY } = useScroll()
  const reduce = useReducedMotion()
  const bgY = useTransform(scrollY, [0, 700], ['0px', reduce ? '0px' : '80px'])

  return (
    <section
      id="home"
      aria-label="Welcome"
      className="relative h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Parallax background */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-x-0 top-[-80px] bottom-[-80px]"
      >
        <img
          src={uImg(IM.hero, 1920)}
          alt="Aerial view of Shibuya Crossing at night"
          className="w-full h-full object-cover grayscale brightness-[0.65]"
          loading="eager"
        />
        {/* Three-layer overlay: flat tint + bottom gradient for legibility + top edge for nav */}
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/20 to-black/30" />
      </motion.div>

      {/* Logotype + CTA */}
      <div className="relative z-10 text-center select-none px-4">
        <motion.div
          variants={staggerParent}
          initial={reduce ? false : 'hidden'}
          animate="visible"
        >
          {/* Flanking rule — top */}
          <motion.div
            variants={growLine}
            style={{ transformOrigin: 'center' }}
            className="w-24 h-px bg-white/18 mx-auto mb-10"
          />

          {/* 1OAK — shield/crest logo */}
          <motion.div variants={fadeUp}>
            <img
              src="/images/1oak-logo.png"
              alt="1 OAK"
              className="mx-auto block"
              style={{ width: 'clamp(150px, 24vw, 230px)', height: 'auto' }}
              draggable={false}
            />
          </motion.div>

          {/* Flanking rule — bottom */}
          <motion.div
            variants={growLine}
            style={{ transformOrigin: 'center' }}
            className="w-24 h-px bg-white/18 mx-auto mt-10 mb-12"
          />

          {/* CTA */}
          <motion.div variants={fadeIn}>
            <a
              href="#reserve"
              style={{ fontFamily: FB, letterSpacing: '0.28em', fontSize: '0.6rem' }}
              className="inline-block border border-white/40 text-white/75 uppercase
                         px-12 py-4 font-medium
                         hover:bg-white hover:text-black hover:border-white
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4
                         motion-reduce:transition-none
                         transition-all duration-500"
            >
              Request Table
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator — opacity pulse only, no layout animation */}
      {!reduce && (
        <motion.div
          aria-hidden="true"
          className="absolute bottom-9 left-1/2 -translate-x-1/2 overflow-hidden w-px h-10"
          animate={{ opacity: [0.5, 0.12, 0.5] }}
          transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
        >
          <div className="w-full h-full bg-gradient-to-b from-transparent via-white/50 to-transparent" />
        </motion.div>
      )}
    </section>
  )
}

// ─── Events ───────────────────────────────────────────────────────────────────
function Events() {
  const reduce = useReducedMotion()

  return (
    <section id="events" className="bg-black pt-24 pb-12 px-6 md:px-12" aria-labelledby="events-heading">
      <h2 id="events-heading" className="sr-only">Upcoming Events</h2>
      <div className="max-w-6xl mx-auto">
        <div role="list">
          {EVENTS.map((ev, i) => (
            <motion.article
              key={ev.id}
              role="listitem"
              initial={reduce ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.09, duration: 0.55 }}
              className="group border-t border-white/[0.07] py-9
                         grid grid-cols-[auto_1fr_auto] items-center gap-x-8 md:gap-x-14
                         cursor-pointer -mx-4 px-4
                         hover:bg-white/[0.02] motion-reduce:hover:bg-transparent
                         transition-colors duration-500"
            >
              {/* Date — champagne, large */}
              <div className="shrink-0 w-20 md:w-28">
                <span
                  style={{ fontFamily: FC, color: 'oklch(0.87 0.018 85)', fontSize: 'clamp(1.4rem, 2.8vw, 2.2rem)' }}
                  className="block leading-none"
                >
                  {ev.date}
                </span>
                <span
                  style={{ fontFamily: FB }}
                  className="text-white/20 text-[0.5rem] tracking-[0.22em] uppercase mt-1.5 block"
                >
                  2026
                </span>
              </div>

              {/* Name + artist — dominant */}
              <div className="min-w-0">
                <h3
                  style={{
                    fontFamily: FC,
                    fontSize: 'clamp(2rem, 5vw, 4.5rem)',
                    lineHeight: 0.95,
                    letterSpacing: '0.02em',
                  }}
                  className="text-white leading-none"
                >
                  {ev.name}
                </h3>
                <p
                  style={{ fontFamily: FB }}
                  className="text-white/32 text-[0.62rem] font-light mt-2 tracking-[0.14em] uppercase"
                >
                  {ev.artist}
                </p>
              </div>

              {/* Genre + arrow */}
              <div className="flex items-center gap-5 shrink-0">
                <span
                  style={{ fontFamily: FB, fontSize: '0.52rem' }}
                  className="hidden sm:block border border-white/14 text-white/28 px-3 py-1 tracking-[0.18em] uppercase"
                >
                  {ev.genre}
                </span>
                <span
                  aria-hidden="true"
                  className="text-white/15 group-hover:text-white/55 motion-reduce:group-hover:text-white/15 transition-colors duration-400 text-lg"
                >
                  →
                </span>
              </div>
            </motion.article>
          ))}
          <div aria-hidden="true" className="border-t border-white/[0.07]" />
        </div>
      </div>
    </section>
  )
}

// ─── Reservations ─────────────────────────────────────────────────────────────
type FormState = 'idle' | 'loading' | 'success' | 'error'

const PARTY_SIZES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'] as const

function Reservations() {
  const [status, setStatus] = useState<FormState>('idle')
  const [form, setForm] = useState({
    name: '',
    email: '',
    date: '',
    partySize: '2',
    message: '',
  })

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/1oak-reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const inputBase = [
    'w-full bg-transparent border border-white/15 text-white',
    'placeholder:text-white/22 px-4 py-3.5 text-sm font-light',
    'outline-none focus:border-white/55 transition-colors duration-200',
    '[color-scheme:dark]',
  ].join(' ')

  const today = new Date().toISOString().split('T')[0]

  return (
    <section
      id="reserve"
      className="bg-[#050505] py-28 px-6 md:px-12"
      aria-labelledby="reserve-heading"
    >
      <div className="max-w-2xl mx-auto">
        <FadeUp className="mb-14">
          <h2
            id="reserve-heading"
            style={{
              fontFamily: FC,
              fontSize: 'clamp(3rem, 7vw, 5.5rem)',
              lineHeight: 0.92,
              letterSpacing: '0.03em',
            }}
            className="text-white leading-none"
          >
            Request a Table
          </h2>
        </FadeUp>

        <FadeUp delay={0.1}>
          {status === 'success' ? (
            <div className="border border-white/12 p-14 text-center">
              <p
                style={{ fontFamily: FC }}
                className="text-white text-2xl font-bold tracking-normal mb-3"
              >
                Request Received
              </p>
              <p
                style={{ fontFamily: FB }}
                className="text-white/38 text-sm font-light leading-relaxed"
              >
                Our team will contact you within 24 hours to confirm your reservation.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label
                    htmlFor="oak-name"
                    style={{ fontFamily: FB }}
                    className="block text-white/28 text-[0.56rem] tracking-[0.24em] uppercase mb-2"
                  >
                    Full Name
                  </label>
                  <input
                    id="oak-name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Your name"
                    value={form.name}
                    onChange={set('name')}
                    style={{ fontFamily: FB }}
                    className={inputBase}
                  />
                </div>
                <div>
                  <label
                    htmlFor="oak-email"
                    style={{ fontFamily: FB }}
                    className="block text-white/28 text-[0.56rem] tracking-[0.24em] uppercase mb-2"
                  >
                    Email
                  </label>
                  <input
                    id="oak-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={set('email')}
                    style={{ fontFamily: FB }}
                    className={inputBase}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label
                    htmlFor="oak-date"
                    style={{ fontFamily: FB }}
                    className="block text-white/28 text-[0.56rem] tracking-[0.24em] uppercase mb-2"
                  >
                    Date
                  </label>
                  <input
                    id="oak-date"
                    type="date"
                    required
                    value={form.date}
                    onChange={set('date')}
                    min={today}
                    style={{ fontFamily: FB }}
                    className={inputBase}
                  />
                </div>
                <div>
                  <label
                    htmlFor="oak-party"
                    style={{ fontFamily: FB }}
                    className="block text-white/28 text-[0.56rem] tracking-[0.24em] uppercase mb-2"
                  >
                    Party Size
                  </label>
                  <select
                    id="oak-party"
                    value={form.partySize}
                    onChange={set('partySize')}
                    style={{ fontFamily: FB }}
                    className={`${inputBase} cursor-pointer`}
                  >
                    {PARTY_SIZES.map(n => (
                      <option key={n} value={n} style={{ background: '#0a0a0a', color: '#fff' }}>
                        {n} {n === '1' ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-8">
                <label
                  htmlFor="oak-message"
                  style={{ fontFamily: FB }}
                  className="block text-white/28 text-[0.56rem] tracking-[0.24em] uppercase mb-2"
                >
                  Special Requests
                </label>
                <textarea
                  id="oak-message"
                  rows={4}
                  placeholder="Occasion, VIP preferences, dietary restrictions…"
                  value={form.message}
                  onChange={set('message')}
                  style={{ fontFamily: FB }}
                  className={`${inputBase} resize-none`}
                />
              </div>

              {status === 'error' && (
                <p
                  role="alert"
                  style={{ fontFamily: FB }}
                  className="text-red-400/75 text-xs mb-5 font-light"
                >
                  Something went wrong. Please try again or email us directly.
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                style={{ fontFamily: FB, letterSpacing: '0.22em', fontSize: '0.6rem' }}
                className="w-full bg-white text-black py-4 uppercase font-medium
                           hover:bg-white/88 disabled:opacity-40 disabled:cursor-not-allowed
                           focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4
                           motion-reduce:transition-none
                           transition-colors duration-200"
              >
                {status === 'loading' ? 'Sending…' : 'Send Request'}
              </button>
            </form>
          )}
        </FadeUp>
      </div>
    </section>
  )
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
const GALLERY_ITEMS = [
  {
    id:   IM.dance,
    alt:  'Electric green-lit dance floor with exhilarated crowd',
    // Spans 2 cols + 2 rows → the anchor piece
    gridColumn: '1 / span 2',
    gridRow:    '1 / span 2',
  },
  {
    id:   IM.bar,
    alt:  'Dimly lit cocktail bar with warm candlelight',
    gridColumn: 'auto',
    gridRow:    'auto',
  },
  {
    id:   IM.aerial,
    alt:  'Aerial view of Tokyo Roppongi skyline at night',
    gridColumn: 'auto',
    gridRow:    'auto',
  },
  {
    id:   IM.crowd,
    alt:  'Concert crowd raising hands in euphoria',
    // Full width on desktop (3 cols), full width on mobile (2 cols)
    gridColumn: '1 / -1',
    gridRow:    'auto',
  },
] as const

function Gallery() {
  const reduce = useReducedMotion()

  return (
    <section id="gallery" className="bg-black" aria-label="Gallery">
      <div
        className="grid grid-cols-2 md:grid-cols-3 gap-0.5"
        style={{ gridAutoRows: 'clamp(170px, 24vw, 360px)' }}
      >
        {GALLERY_ITEMS.map((item, i) => (
          <motion.div
            key={item.id}
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay: i * 0.1, duration: 0.75 }}
            style={{ gridColumn: item.gridColumn, gridRow: item.gridRow }}
            className="overflow-hidden"
          >
            <img
              src={uImg(item.id, 900)}
              alt={item.alt}
              loading="eager"
              className="w-full h-full object-cover
                         hover:scale-[1.04] motion-reduce:hover:scale-100
                         transition-transform duration-700 ease-out"
            />
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ─── About ────────────────────────────────────────────────────────────────────
function About() {
  return (
    <section
      id="contact"
      className="bg-[#050505] py-32 px-6 md:px-12"
      aria-labelledby="about-heading"
    >
      <div className="max-w-5xl mx-auto">
        <FadeUp>
          <blockquote
            style={{
              fontFamily: FB,
              fontSize: 'clamp(1.25rem, 2.6vw, 2rem)',
              lineHeight: 1.6,
              fontStyle: 'italic',
              fontWeight: 300,
            }}
            className="text-white/75 mb-16 text-pretty max-w-3xl"
          >
            &ldquo;Where New York&rsquo;s legendary nightlife DNA meets Tokyo&rsquo;s relentless
            energy. The same unapologetic atmosphere. The same impossible door.
            The same room where everything happens.&rdquo;
          </blockquote>
        </FadeUp>

        <div className="border-t border-white/[0.06] pt-12 grid md:grid-cols-[1fr_auto] gap-12 md:gap-20">
          <FadeUp>
            <h2
              id="about-heading"
              className="sr-only"
            >
              About 1OAK Tokyo
            </h2>
            <p
              style={{ fontFamily: FB }}
              className="text-white/40 text-sm font-light leading-[1.85] max-w-lg"
            >
              1 OAK Tokyo is the Tokyo outpost of the legendary New York nightclub.
              Located in Roppongi — Tokyo&rsquo;s international entertainment district —
              1 OAK brings world-class DJs, a curated VIP bottle-service culture, and an
              atmosphere that has defined nightlife from Manhattan to Los Angeles.
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="space-y-7 md:text-right">
              <div>
                <p
                  style={{ fontFamily: FB }}
                  className="text-white/22 text-[0.56rem] tracking-[0.26em] uppercase mb-2"
                >
                  Hours
                </p>
                <dl style={{ fontFamily: FB }} className="text-sm font-light space-y-0.5">
                  {[
                    { days: 'Tue – Thu', time: '11:00 PM – 5:00 AM' },
                    { days: 'Fri – Sat', time: '10:00 PM – 5:00 AM' },
                    { days: 'Sun',       time: '11:00 PM – 5:00 AM' },
                  ].map(({ days, time }) => (
                    <div key={days} className="flex gap-4">
                      <dt className="text-white/38 w-20 shrink-0">{days}</dt>
                      <dd className="text-white/70">{time}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div>
                <p
                  style={{ fontFamily: FB }}
                  className="text-white/22 text-[0.56rem] tracking-[0.26em] uppercase mb-2"
                >
                  Location
                </p>
                <address
                  style={{ fontFamily: FB }}
                  className="text-white/48 text-sm font-light not-italic leading-relaxed"
                >
                  1-4-5 Azabujuban
                  <br />
                  Minato-ku, Tokyo 106-0045
                </address>
              </div>

              <div>
                <p
                  style={{ fontFamily: FB }}
                  className="text-white/22 text-[0.56rem] tracking-[0.26em] uppercase mb-2"
                >
                  Contact
                </p>
                <a
                  href="mailto:info@1oaktokyo.com"
                  style={{ fontFamily: FB }}
                  className="text-white/48 text-sm font-light hover:text-white transition-colors duration-300"
                >
                  info@1oaktokyo.com
                </a>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}

// ─── Playlist ────────────────────────────────────────────────────────────────
function Playlist() {
  return (
    <section
      id="music"
      className="bg-black py-28 px-6 md:px-12"
      aria-labelledby="playlist-heading"
    >
      <div className="max-w-5xl mx-auto">
        <FadeUp className="mb-12">
          <h2
            id="playlist-heading"
            style={{ fontFamily: FC, fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)', letterSpacing: '0.03em' }}
            className="text-white leading-none"
          >
            The Sound of 1 OAK
          </h2>
        </FadeUp>

        <FadeUp delay={0.1}>
          <iframe
            src="https://open.spotify.com/embed/playlist/66wJuTMtANr0FjC5TPwY5A?utm_source=generator&theme=0"
            width="100%"
            height="352"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="1 OAK Tokyo Mix Tape by DJ Sinatra"
            className="rounded-none"
          />
        </FadeUp>
      </div>
    </section>
  )
}

// ─── Location Map ─────────────────────────────────────────────────────────────
function LocationMap() {
  return (
    <section
      id="map"
      aria-label="Club location map"
      className="bg-[#050505]"
    >
      <FadeUp>
        <iframe
          src="https://maps.google.com/maps?q=1-4-5+Azabujuban+Minato-ku+Tokyo+106-0045+Japan&hl=en&z=16&output=embed"
          width="100%"
          height="420"
          frameBorder="0"
          loading="lazy"
          title="1 OAK Tokyo location"
          style={{ filter: 'grayscale(1) invert(0.9) contrast(0.88)' }}
        />
      </FadeUp>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-black border-t border-white/[0.05] py-10 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <span
          style={{ fontFamily: FC }}
          className="text-white/80 font-bold tracking-[0.22em] text-[0.62rem]"
        >
          1OAK TOKYO
        </span>

        <nav aria-label="Social">
          <ul className="flex items-center gap-8 list-none">
            {(['Instagram', 'X', 'Facebook'] as const).map(s => (
              <li key={s}>
                <a
                  href="#"
                  aria-label={`1OAK Tokyo on ${s}`}
                  style={{ fontFamily: FB }}
                  className="text-white/22 hover:text-white/70 text-[0.56rem] tracking-[0.16em] uppercase transition-colors duration-300"
                >
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p
          style={{ fontFamily: FB }}
          className="text-white/14 text-[0.56rem] tracking-wide"
        >
          © 2026 1 OAK Tokyo
        </p>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OakPage() {
  return (
    <main className="bg-black text-white antialiased min-h-screen">
      <Nav />
      <Hero />
      <Events />
      <Reservations />
      <Gallery />
      <Playlist />
      <About />
      <LocationMap />
      <Footer />
    </main>
  )
}
