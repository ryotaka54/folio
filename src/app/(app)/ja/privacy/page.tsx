import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';

const F = "'Noto Sans JP', sans-serif";
const G = "var(--font-geist), -apple-system, sans-serif";

export default function JaPrivacyPage() {
  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: F }}>
      <nav className="border-b border-border-gray bg-background sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/ja" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <Logo size={22} variant="dark" />
            <span className="text-[15px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em', fontFamily: G }}>Applyd</span>
          </Link>
          <Link href="/ja/dashboard" className="inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-70" style={{ color: 'var(--muted-text)' }}>
            <ArrowLeft size={15} />
            ダッシュボードへ
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-14">
        <div className="mb-10">
          <h1 className="text-[22px] font-semibold mb-2" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>プライバシーポリシー</h1>
          <p className="text-sm" style={{ color: 'var(--muted-text)' }}>最終更新日：2026年3月27日</p>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--body-text)' }}>
            Applydは就活生のために作りました。難しい法律用語は使いません。何を収集し、なぜ収集し、どう使うかを正直にお伝えします。
          </p>
        </div>

        <div className="space-y-10">

          <section>
            <h2 className="text-base font-semibold mb-3 pb-2 border-b border-border-gray" style={{ color: 'var(--brand-navy)' }}>収集する情報</h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--body-text)' }}>
              {[
                ['アカウント情報', '登録時に提供いただくメールアドレスとパスワード。'],
                ['プロフィール情報', '氏名・学年・就活モードなど。オンボーディングで入力し、いつでも更新できます。'],
                ['選考データ', '企業・職種・ステータス・締め切り・メモ・採用担当者情報。これはあなたのデータです—保管するだけです。'],
                ['基本的な利用データ', '機能の利用状況などの匿名データ。個人情報とは紐付けません。'],
              ].map(([label, body]) => (
                <div key={label} className="flex gap-3">
                  <span className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-blue)' }}>→</span>
                  <p><span className="font-medium" style={{ color: 'var(--brand-navy)' }}>{label}</span> — {body}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3 pb-2 border-b border-border-gray" style={{ color: 'var(--brand-navy)' }}>情報の利用目的</h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--body-text)' }}>
              {[
                'Applydの運営と選考トラッカーの機能提供のため。',
                'プロフィールに基づきダッシュボードをパーソナライズするため。',
                'パスワードリセットやアカウント確認などのトランザクションメール送信のため。',
                '締め切りリマインダーや製品アップデートの通知（オプトインした場合のみ）。',
              ].map((text, i) => (
                <div key={i} className="flex gap-3">
                  <span className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-blue)' }}>→</span>
                  <p>{text}</p>
                </div>
              ))}
              <div className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--surface-gray)', color: 'var(--body-text)' }}>
                <span className="font-semibold" style={{ color: 'var(--brand-navy)' }}>あなたのデータを第三者に販売することは絶対にありません。</span>広告主への提供も一切行いません。
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3 pb-2 border-b border-border-gray" style={{ color: 'var(--brand-navy)' }}>データの保管とセキュリティ</h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--body-text)' }}>
              {[
                <span key="a">すべてのデータは<a href="https://supabase.com" style={{ color: 'var(--accent-blue)' }} target="_blank" rel="noopener noreferrer" className="hover:underline">Supabase</a>に保管（行レベルセキュリティ付きPostgreSQL）。各ユーザーは自分のデータにしかアクセスできません。</span>,
                'パスワードはハッシュ化されており、平文では保管されません。',
                'すべてのデータは通信中（HTTPS）および保存時に暗号化されています。',
                'SupabaseはSOC 2 Type II認証を取得しています。',
              ].map((text, i) => (
                <div key={i} className="flex gap-3">
                  <span className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-blue)' }}>→</span>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3 pb-2 border-b border-border-gray" style={{ color: 'var(--brand-navy)' }}>利用している外部サービス</h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--body-text)' }}>
              {[
                ['Supabase', 'データベースと認証。'],
                ['Vercel', 'ホスティングとデプロイ。'],
                ['Resend', 'トランザクションメールの配信。'],
              ].map(([label, body]) => (
                <div key={label} className="flex gap-3">
                  <span className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-blue)' }}>→</span>
                  <p><span className="font-medium" style={{ color: 'var(--brand-navy)' }}>{label}</span> — {body}</p>
                </div>
              ))}
              <div className="flex gap-3">
                <span className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-blue)' }}>→</span>
                <p>サービス改善のために匿名化された分析ツールを利用する場合があります。個人情報は送信されません。</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3 pb-2 border-b border-border-gray" style={{ color: 'var(--brand-navy)' }}>あなたの権利</h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--body-text)' }}>
              {[
                '設定からいつでもアカウントとすべてのデータを削除できます。',
                'いつでも選考データをエクスポートできます。',
                'プロフィール情報はダッシュボードからいつでも更新できます。',
                <span key="d">データのコピーのご要望やプライバシーに関するご質問は、<a href="mailto:hello@useapplyd.com" style={{ color: 'var(--accent-blue)' }} className="hover:underline">hello@useapplyd.com</a> までどうぞ。</span>,
              ].map((text, i) => (
                <div key={i} className="flex gap-3">
                  <span className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-blue)' }}>→</span>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3 pb-2 border-b border-border-gray" style={{ color: 'var(--brand-navy)' }}>Cookie について</h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--body-text)' }}>
              {[
                'ログイン状態の保持と言語設定の記憶のためのCookieを使用しています。それだけです。',
                '広告Cookie・追跡Cookie・サードパーティの分析Cookieは使用していません。',
              ].map((text, i) => (
                <div key={i} className="flex gap-3">
                  <span className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-blue)' }}>→</span>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3 pb-2 border-b border-border-gray" style={{ color: 'var(--brand-navy)' }}>お子様のプライバシー</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--body-text)' }}>
              Applydは13歳以上を対象としています。13歳未満のお子様のアカウントを発見した場合は
              <a href="mailto:hello@useapplyd.com" style={{ color: 'var(--accent-blue)' }} className="hover:underline"> hello@useapplyd.com</a> までご連絡ください。速やかに削除します。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3 pb-2 border-b border-border-gray" style={{ color: 'var(--brand-navy)' }}>ポリシーの変更</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--body-text)' }}>
              重要な変更を加える場合は、変更前にメールまたはアプリ内通知でお知らせします。
              ページ上部の最終更新日は常に最新の変更日を反映します。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3 pb-2 border-b border-border-gray" style={{ color: 'var(--brand-navy)' }}>お問い合わせ</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--body-text)' }}>
              ご質問・ご要望は <a href="mailto:hello@useapplyd.com" style={{ color: 'var(--accent-blue)' }} className="hover:underline">hello@useapplyd.com</a> までお気軽にどうぞ。
              すべてのメールに目を通しています。
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-border-gray py-10 mt-10" style={{ background: 'color-mix(in srgb, var(--surface-gray) 60%, transparent)' }}>
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2" style={{ opacity: 0.4 }}>
            <Logo size={18} variant="dark" />
            <span className="text-[13px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em', fontFamily: G }}>Applyd</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/ja/terms" className="text-xs font-medium transition-colors hover:opacity-70" style={{ color: 'var(--muted-text)' }}>利用規約</Link>
            <Link href="/ja/privacy" className="text-xs font-medium transition-colors hover:opacity-70" style={{ color: 'var(--muted-text)' }}>プライバシーポリシー</Link>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>© 2026 Applyd</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
