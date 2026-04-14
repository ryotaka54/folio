'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Category = 'バグ報告' | '機能リクエスト' | '課金・プラン' | 'アカウント' | 'その他';

const CATEGORIES: Category[] = ['バグ報告', '機能リクエスト', '課金・プラン', 'アカウント', 'その他'];

export default function JaSupportPage() {
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !category || !message.trim()) {
      setError('すべての項目を入力してください。');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { error: dbError } = await supabase.from('support_requests').insert({
        email,
        category,
        message,
        locale: 'ja',
      });
      if (dbError) throw dbError;
      setSubmitted(true);
    } catch {
      setError('送信に失敗しました。しばらく経ってからもう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        color: 'var(--brand-navy)',
        fontFamily: "'Noto Sans JP', sans-serif",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          borderBottom: '1px solid var(--border-gray)',
          background: 'var(--background)',
          padding: '0 24px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link href="/ja" style={{ fontWeight: 700, fontSize: 16, color: 'var(--brand-navy)', textDecoration: 'none' }}>
          Applyd
        </Link>
        <Link href="/ja" style={{ fontSize: 13, color: 'var(--muted-text)', textDecoration: 'none' }}>
          ← トップに戻る
        </Link>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 580, margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '0.02em' }}>
          サポート
        </h1>
        <p style={{ fontSize: 14, color: 'var(--muted-text)', marginBottom: 32, lineHeight: 1.7 }}>
          ご不明な点や問題がございましたらお気軽にご連絡ください。<br />
          通常1〜2営業日以内にご返信いたします。
        </p>

        {/* Quick links */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 36,
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'よくある質問', href: '/ja/faq' },
            { label: 'プライバシーポリシー', href: '/ja/privacy' },
            { label: '利用規約', href: '/ja/terms' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: 12,
                padding: '6px 14px',
                borderRadius: 20,
                border: '1px solid var(--border-gray)',
                color: 'var(--muted-text)',
                textDecoration: 'none',
                background: 'var(--surface-gray)',
                letterSpacing: '0.03em',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {submitted ? (
          <div
            style={{
              borderRadius: 12,
              border: '1px solid var(--border-gray)',
              background: 'var(--surface-gray)',
              padding: '40px 32px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 16 }}>✓</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>送信が完了しました</h2>
            <p style={{ fontSize: 14, color: 'var(--muted-text)', lineHeight: 1.7 }}>
              お問い合わせありがとうございます。<br />
              入力いただいたメールアドレスに返信いたします。
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Field label="メールアドレス">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={inputStyle}
              />
            </Field>

            <Field label="お問い合わせの種類">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                required
                style={inputStyle}
              >
                <option value="">選択してください</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>

            <Field label="内容">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                placeholder="詳しい内容をご記入ください"
                rows={6}
                required
                style={{
                  ...inputStyle,
                  height: 'auto',
                  padding: '10px 14px',
                  resize: 'vertical',
                  lineHeight: 1.7,
                }}
              />
              <div style={{ textAlign: 'right', marginTop: 4 }}>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>{message.length} / 1000</span>
              </div>
            </Field>

            {error && (
              <p style={{ fontSize: 13, color: '#DC2626', margin: 0 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                height: 48,
                borderRadius: 10,
                border: 'none',
                background: '#0A0A14',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
                letterSpacing: '0.05em',
                fontFamily: "'Noto Sans JP', sans-serif",
              }}
            >
              {submitting ? '送信中...' : '送信する'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  borderRadius: 8,
  border: '1px solid var(--border-gray)',
  background: 'var(--surface-gray)',
  color: 'var(--brand-navy)',
  fontSize: 14,
  padding: '0 14px',
  fontFamily: "'Noto Sans JP', sans-serif",
  boxSizing: 'border-box',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--muted-text)',
          letterSpacing: '0.05em',
          fontFamily: "'Noto Sans JP', sans-serif",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
