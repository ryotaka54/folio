'use client';

import Link from 'next/link';

export default function JaPrivacyPage() {
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
          プライバシーポリシー
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted-text)', marginBottom: 40 }}>最終更新日: 2025年10月1日</p>

        <Section title="1. はじめに">
          Applyd（以下「本サービス」）は、就職活動の管理を支援するウェブアプリケーションです。本プライバシーポリシーは、本サービスの利用にあたって収集する個人情報の取扱いについて説明します。本サービスをご利用いただくことで、本ポリシーに同意したものとみなします。
        </Section>

        <Section title="2. 収集する情報">
          <p>本サービスは以下の情報を収集します。</p>
          <ul>
            <li><strong>アカウント情報：</strong>メールアドレス、パスワード（ハッシュ化）、表示名</li>
            <li><strong>就活データ：</strong>企業名、応募ステータス、面接メモ、選考日程など、ユーザーが入力した情報</li>
            <li><strong>利用情報：</strong>ページ閲覧履歴、機能の利用状況、アクセス日時</li>
            <li><strong>端末情報：</strong>IPアドレス、ブラウザの種類、OS</li>
          </ul>
        </Section>

        <Section title="3. 情報の利用目的">
          収集した情報は以下の目的で利用します。
          <ul>
            <li>本サービスの提供および改善</li>
            <li>ユーザーサポートの対応</li>
            <li>不正利用の防止およびセキュリティの確保</li>
            <li>サービスに関する重要なお知らせの送信</li>
            <li>統計データの作成（個人を特定できない形式）</li>
          </ul>
        </Section>

        <Section title="4. 情報の第三者提供">
          本サービスは、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。
          <ul>
            <li>ユーザー本人の同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命・身体・財産の保護のために必要な場合</li>
          </ul>
          <p>本サービスは以下のサービスを利用しています。</p>
          <ul>
            <li><strong>Supabase：</strong>データベースおよび認証（米国）</li>
            <li><strong>Vercel：</strong>ホスティング（米国）</li>
            <li><strong>Stripe：</strong>決済処理（米国）</li>
          </ul>
          <p>各サービスのプライバシーポリシーについては、各社のウェブサイトをご確認ください。</p>
        </Section>

        <Section title="5. Cookieの使用">
          本サービスはCookieを使用します。Cookieはユーザーの設定（言語設定など）を記憶するために使用します。ブラウザの設定からCookieを無効にすることができますが、一部機能が利用できなくなる場合があります。
        </Section>

        <Section title="6. 個人情報の保管期間">
          アカウントを削除した場合、関連する個人情報は30日以内に削除します。ただし、法令上の義務がある場合はこの限りではありません。
        </Section>

        <Section title="7. お客様の権利">
          ユーザーは以下の権利を有します。
          <ul>
            <li>保有する個人情報の開示請求</li>
            <li>個人情報の訂正・削除の請求</li>
            <li>個人情報の利用停止の請求</li>
          </ul>
          これらの請求については、下記のお問い合わせ先までご連絡ください。
        </Section>

        <Section title="8. 未成年者のプライバシー">
          本サービスは13歳未満の方を対象としていません。13歳未満の方の個人情報と判明した場合は、速やかに削除します。
        </Section>

        <Section title="9. ポリシーの変更">
          本プライバシーポリシーは予告なく変更される場合があります。重要な変更がある場合は、メールまたはサービス内でお知らせします。
        </Section>

        <Section title="10. お問い合わせ">
          個人情報の取扱いに関するご質問は、<Link href="/ja/support" style={{ color: 'var(--brand-navy)' }}>サポートページ</Link>よりお問い合わせください。
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2
        style={{
          fontSize: 16,
          fontWeight: 700,
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: '1px solid var(--border-gray)',
          letterSpacing: '0.03em',
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.9,
          color: 'var(--brand-navy)',
          opacity: 0.85,
        }}
      >
        {children}
      </div>
    </section>
  );
}
