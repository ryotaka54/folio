'use client'

import { useState } from 'react'
import { Send, CheckCircle2 } from 'lucide-react'
import { FG, FD, FM, BG, SURFACE, INK, MUTED, ACCENT, BORDER, Nav, Footer, FadeUp, PageHeader } from '../shared'

type FormState = 'idle' | 'loading' | 'success' | 'error'

export default function ContactPage() {
  const [status, setStatus] = useState<FormState>('idle')
  const [form, setForm] = useState({
    company: '',
    name: '',
    email: '',
    phone: '',
    message: '',
  })

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/izaki-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const inputBase = 'w-full border px-4 py-3.5 text-sm outline-none transition-colors'

  return (
    <main style={{ background: BG }}>
      <Nav />
      <PageHeader
        eyebrow="CONTACT"
        title="お見積り・お問い合わせ"
        lead="図面や仕様がまだ固まっていない段階でもご相談いただけます。"
      />

      <section className="pb-20 md:pb-28 px-6 md:px-10" style={{ background: BG }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-3 gap-10 lg:gap-12">
            <FadeUp className="lg:col-span-2">
              {status === 'success' ? (
                <div className="p-10 md:p-14 border text-center" style={{ borderColor: BORDER, background: SURFACE }}>
                  <CheckCircle2 size={28} strokeWidth={1.5} style={{ color: ACCENT }} className="mx-auto mb-4" />
                  <p style={{ fontFamily: FD, fontWeight: 700, color: INK }} className="text-xl">
                    送信しました
                  </p>
                  <p style={{ fontFamily: FG, color: MUTED }} className="mt-3 text-sm leading-loose">
                    内容を確認のうえ、担当者よりご連絡いたします。
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <div className="grid sm:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label htmlFor="izaki-company" style={{ fontFamily: FG, color: INK }} className="block text-sm font-bold mb-2">
                        会社名
                      </label>
                      <input
                        id="izaki-company"
                        type="text"
                        required
                        value={form.company}
                        onChange={set('company')}
                        style={{ fontFamily: FG, borderColor: BORDER, background: '#fff', color: INK }}
                        className={inputBase}
                      />
                    </div>
                    <div>
                      <label htmlFor="izaki-name" style={{ fontFamily: FG, color: INK }} className="block text-sm font-bold mb-2">
                        ご担当者名
                      </label>
                      <input
                        id="izaki-name"
                        type="text"
                        required
                        value={form.name}
                        onChange={set('name')}
                        style={{ fontFamily: FG, borderColor: BORDER, background: '#fff', color: INK }}
                        className={inputBase}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label htmlFor="izaki-email" style={{ fontFamily: FG, color: INK }} className="block text-sm font-bold mb-2">
                        メールアドレス
                      </label>
                      <input
                        id="izaki-email"
                        type="email"
                        required
                        value={form.email}
                        onChange={set('email')}
                        style={{ fontFamily: FG, borderColor: BORDER, background: '#fff', color: INK }}
                        className={inputBase}
                      />
                    </div>
                    <div>
                      <label htmlFor="izaki-phone" style={{ fontFamily: FG, color: INK }} className="block text-sm font-bold mb-2">
                        電話番号（任意）
                      </label>
                      <input
                        id="izaki-phone"
                        type="tel"
                        value={form.phone}
                        onChange={set('phone')}
                        style={{ fontFamily: FG, borderColor: BORDER, background: '#fff', color: INK }}
                        className={inputBase}
                      />
                    </div>
                  </div>

                  <div className="mb-8">
                    <label htmlFor="izaki-message" style={{ fontFamily: FG, color: INK }} className="block text-sm font-bold mb-2">
                      お問い合わせ内容
                    </label>
                    <textarea
                      id="izaki-message"
                      rows={5}
                      required
                      placeholder="加工内容、数量、希望納期などをご記入ください。"
                      value={form.message}
                      onChange={set('message')}
                      style={{ fontFamily: FG, borderColor: BORDER, background: '#fff', color: INK }}
                      className={`${inputBase} resize-none`}
                    />
                  </div>

                  {status === 'error' && (
                    <p role="alert" style={{ fontFamily: FG, color: '#B3261E' }} className="text-sm mb-5">
                      送信に失敗しました。時間をおいて再度お試しください。
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    style={{ fontFamily: FG, background: status === 'loading' ? MUTED : ACCENT, color: '#fff' }}
                    className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold disabled:cursor-not-allowed transition-colors"
                  >
                    {status === 'loading' ? '送信中…' : '送信する'}
                    {status !== 'loading' && <Send size={17} strokeWidth={2.25} />}
                  </button>
                </form>
              )}
            </FadeUp>

            <FadeUp delay={0.1}>
              <div className="p-8 border h-full flex flex-col gap-6" style={{ borderColor: BORDER, background: SURFACE }}>
                <div>
                  <p style={{ fontFamily: FM, color: MUTED }} className="text-[0.68rem] tracking-[0.1em] mb-2">
                    所在地
                  </p>
                  <p style={{ fontFamily: FG, color: INK }} className="text-sm leading-relaxed">
                    〒577-0063<br />大阪府東大阪市川俣1丁目11番12号
                  </p>
                </div>
                <div>
                  <p style={{ fontFamily: FM, color: MUTED }} className="text-[0.68rem] tracking-[0.1em] mb-2">
                    TEL / FAX
                  </p>
                  <p style={{ fontFamily: FD, fontWeight: 700, color: INK }} className="text-base">
                    06-6789-4387
                  </p>
                  <p style={{ fontFamily: FG, color: MUTED }} className="text-sm mt-1">
                    FAX 06-6789-7319
                  </p>
                </div>
                <div>
                  <p style={{ fontFamily: FM, color: MUTED }} className="text-[0.68rem] tracking-[0.1em] mb-2">
                    メール
                  </p>
                  <a
                    href="mailto:info@izaki.co.jp"
                    style={{ fontFamily: FG, color: ACCENT }}
                    className="text-sm underline break-all"
                  >
                    info@izaki.co.jp
                  </a>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
