'use client';

import { useState } from 'react';
import Link from 'next/link';

const FAQS = [
  {
    q: 'Applydは無料で使えますか？',
    a: 'はい。基本機能（企業管理・カンバンボード・面接メモ）は無料でご利用いただけます。AI面接対策・SPIトラッカー・内定管理などの高度な機能はProプラン（月額制）が必要です。',
  },
  {
    q: 'Proプランの料金はいくらですか？',
    a: '料金は設定ページでご確認ください。月額プランはいつでも解約でき、解約後も次の更新日まで利用可能です。',
  },
  {
    q: 'データはどこに保存されますか？',
    a: '入力したデータはSupabase（米国）のサーバーに安全に保存されます。暗号化通信（HTTPS）を使用し、第三者への提供は行いません。詳細は<a href="/ja/privacy">プライバシーポリシー</a>をご覧ください。',
  },
  {
    q: 'スマートフォンでも使えますか？',
    a: 'はい。Applydはモバイル対応しており、スマートフォン・タブレットでもお使いいただけます。ブラウザからアクセスするだけで利用できます。',
  },
  {
    q: 'カンバンボードの使い方を教えてください。',
    a: 'ダッシュボードで企業カードをドラッグ＆ドロップして選考ステージを移動できます。モバイルでは各カードのメニューからステージを変更できます。ステージは「書類選考」「面接」「内定」など就活の流れに沿っています。',
  },
  {
    q: 'AI面接対策機能とは何ですか？',
    a: 'ProプランのAI面接対策では、企業の情報をもとに想定される面接質問と回答例を自動生成します。「ガクチカ」「志望動機」「逆質問」などのカテゴリ別にトレーニングできます。',
  },
  {
    q: 'データをエクスポートできますか？',
    a: '現在、CSVエクスポート機能は開発中です。アカウント削除を希望される場合は、削除前にサポートへご連絡いただければデータをお渡しすることも可能です。',
  },
  {
    q: 'アカウントを削除するにはどうすればいいですか？',
    a: '設定ページの「アカウント削除」よりお手続きいただけます。削除後30日以内にすべてのデータが完全に削除されます。',
  },
  {
    q: '友達を招待するとどうなりますか？',
    a: '招待リンクから友達が登録すると、あなたと友達の両方に特典が付与されます。招待の詳細は設定ページの「招待」セクションをご確認ください。',
  },
  {
    q: 'バグや不具合を見つけた場合はどうすればいいですか？',
    a: '<a href="/ja/support">サポートページ</a>よりご報告ください。できるだけ早く対応いたします。',
  },
];

export default function JaFaqPage() {
  const [open, setOpen] = useState<number | null>(null);

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
      <main style={{ maxWidth: 740, margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '0.02em' }}>
          よくある質問
        </h1>
        <p style={{ fontSize: 14, color: 'var(--muted-text)', marginBottom: 40 }}>
          解決しない場合は<Link href="/ja/support" style={{ color: 'var(--brand-navy)' }}>サポートページ</Link>からお問い合わせください。
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {FAQS.map((item, i) => (
            <div
              key={i}
              style={{
                borderTop: i === 0 ? '1px solid var(--border-gray)' : 'none',
                borderBottom: '1px solid var(--border-gray)',
              }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '20px 0',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--brand-navy)',
                  fontFamily: "'Noto Sans JP', sans-serif",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.6, letterSpacing: '0.02em' }}>
                  {item.q}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--muted-text)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    flexShrink: 0,
                    marginTop: 3,
                    transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {open === i && (
                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.9,
                    color: 'var(--muted-text)',
                    paddingBottom: 20,
                    letterSpacing: '0.02em',
                  }}
                  dangerouslySetInnerHTML={{ __html: item.a }}
                />
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
