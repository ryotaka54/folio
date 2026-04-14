'use client';

import Link from 'next/link';

export default function JaTermsPage() {
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
          利用規約
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted-text)', marginBottom: 40 }}>最終更新日: 2025年10月1日</p>

        <Section title="第1条（適用）">
          本利用規約（以下「本規約」）は、Applyd（以下「本サービス」）の利用条件を定めるものです。ユーザーは本規約に同意のうえ、本サービスをご利用ください。
        </Section>

        <Section title="第2条（アカウント登録）">
          <ul>
            <li>本サービスの利用には、アカウント登録が必要です。</li>
            <li>登録情報は正確かつ最新の状態を保つものとします。</li>
            <li>アカウントのIDとパスワードの管理はユーザー自身の責任とします。</li>
            <li>1人のユーザーが複数のアカウントを登録することは禁止します。</li>
          </ul>
        </Section>

        <Section title="第3条（禁止事項）">
          ユーザーは以下の行為を行ってはなりません。
          <ul>
            <li>法令または公序良俗に違反する行為</li>
            <li>本サービスの運営を妨害する行為</li>
            <li>他のユーザーに迷惑をかける行為</li>
            <li>本サービスを不正な目的で利用する行為</li>
            <li>本サービスのリバースエンジニアリング、改ざん</li>
            <li>不正アクセスまたはそれに類する行為</li>
          </ul>
        </Section>

        <Section title="第4条（有料プラン）">
          <ul>
            <li>一部の機能は有料プラン（Pro）への加入が必要です。</li>
            <li>料金はStripeを通じて決済されます。</li>
            <li>月額プランは月次で自動更新されます。</li>
            <li>解約はいつでも可能で、解約後は次の更新日まで利用できます。</li>
            <li>返金は原則として行いませんが、個別のケースについてはサポートまでお問い合わせください。</li>
          </ul>
        </Section>

        <Section title="第5条（知的財産権）">
          本サービスに関するすべての知的財産権は、本サービス運営者に帰属します。ユーザーが入力したデータの権利はユーザーに帰属します。
        </Section>

        <Section title="第6条（免責事項）">
          <ul>
            <li>本サービスは「現状のまま」提供されます。特定目的への適合性を保証しません。</li>
            <li>本サービスの利用によって生じた損害について、運営者は責任を負いません。</li>
            <li>本サービスは予告なくメンテナンス・変更・終了する場合があります。</li>
          </ul>
        </Section>

        <Section title="第7条（サービスの変更・終了）">
          本サービスの内容を変更または終了する場合、ユーザーに事前に通知するよう努めます。ただし、緊急の場合はこの限りではありません。
        </Section>

        <Section title="第8条（規約の変更）">
          本規約は必要に応じて変更する場合があります。変更後の規約は本サービス上に掲載した時点から効力を生じます。
        </Section>

        <Section title="第9条（準拠法・管轄）">
          本規約の解釈は日本法に準拠します。本サービスに関する紛争については、東京地方裁判所を第一審の専属管轄裁判所とします。
        </Section>

        <Section title="第10条（お問い合わせ）">
          本規約に関するお問い合わせは、<Link href="/ja/support" style={{ color: 'var(--brand-navy)' }}>サポートページ</Link>よりご連絡ください。
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
