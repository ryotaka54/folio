/**
 * Privacy Policy copy, shared between the EN (`/privacy`) and JA (`/ja/privacy`)
 * routes via PrivacyView.
 *
 * `body` / `paragraphs` / `callout` strings support a tiny inline markup so
 * emphasis and links can be preserved without JSX-in-data:
 *   - `**bold text**`        -> <strong>
 *   - `[link text](href)`    -> <a href="href">
 * See renderRich() in PrivacyView.tsx for the parser.
 */

export interface LegalBullet {
  /** Bold lead-in rendered as "label — body", e.g. "Account info — your email…". */
  label?: string;
  body: string;
}

export interface LegalSection {
  heading: string;
  bullets?: LegalBullet[];
  /** Highlighted callout box (used once, in "How we use it"). Supports **bold**. */
  callout?: string;
  /** Plain paragraph(s) for sections without a bulleted list. */
  paragraphs?: string[];
}

export interface FooterLink {
  label: string;
  /** Canonical (EN-rooted) path — pass through localeHref() before rendering. */
  href: string;
}

export interface PrivacyCopy {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
  footerLinks: FooterLink[];
}

export const en: PrivacyCopy = {
  title: 'Privacy Policy',
  lastUpdated: 'Last updated: March 27, 2026',
  intro:
    "We built Applyd for students — so we'll keep this plain and simple. No legal jargon, no surprises. " +
    "Here's exactly what we collect, why, and what we do with it.",
  sections: [
    {
      heading: 'What we collect',
      bullets: [
        { label: 'Account info', body: 'your email address and password when you sign up.' },
        {
          label: 'Profile info',
          body:
            "your first name, school year, career level, recruiting season, and whether you're tracking " +
            'internships or full-time jobs. You fill this in during onboarding and can update it anytime.',
        },
        {
          label: 'Application data',
          body:
            'the companies, roles, statuses, deadlines, notes, and recruiter details you add to your tracker. ' +
            'This is your data — we just store it for you.',
        },
        {
          label: 'Basic usage data',
          body:
            'how you interact with the app (e.g. which features you use) to help us improve the product. ' +
            'This is anonymised and never tied to your personal information.',
        },
      ],
    },
    {
      heading: 'How we use it',
      bullets: [
        { body: 'To run Applyd and keep your tracker working.' },
        { body: 'To personalise your pipeline stages and dashboard based on your mode and profile.' },
        { body: 'To send you transactional emails like password resets and account confirmations.' },
        { body: 'To send deadline reminders or product updates — only if you opt in.' },
      ],
      callout: '**We will never sell your data** to third parties. We will never share your data with advertisers. Full stop.',
    },
    {
      heading: 'Data storage & security',
      bullets: [
        {
          body:
            'All data is stored on [Supabase](https://supabase.com), which uses PostgreSQL with row-level security. ' +
            'That means each user can only ever access their own data — no one else can see your applications.',
        },
        { body: 'Your password is hashed and never stored in plain text.' },
        { body: 'All data is encrypted in transit (HTTPS) and at rest.' },
        { body: 'Supabase is SOC 2 Type II compliant.' },
      ],
    },
    {
      heading: 'Third-party services',
      bullets: [
        { label: 'Supabase', body: 'database and authentication.' },
        { label: 'Vercel', body: 'hosting and deployment.' },
        { label: 'Resend', body: 'transactional email delivery.' },
        {
          body:
            'We may use anonymised analytics tools to understand how users interact with the app. ' +
            'These tools do not receive your personal data.',
        },
      ],
    },
    {
      heading: 'Your rights',
      bullets: [
        { body: 'You can **delete your account** and all associated data at any time from your account settings.' },
        { body: 'You can **export your application data** at any time.' },
        { body: 'You can **update or correct** your profile information at any time from the dashboard.' },
        {
          body:
            'To request a copy of your data or ask any privacy-related questions, email us at ' +
            '[hello@useapplyd.com](mailto:hello@useapplyd.com).',
        },
      ],
    },
    {
      heading: 'Cookies',
      bullets: [
        { body: "We use a single session cookie to keep you logged in. That's it." },
        { body: 'We do not use advertising cookies, tracking cookies, or third-party analytics cookies.' },
      ],
    },
    {
      heading: "Children's privacy",
      paragraphs: [
        'Applyd is intended for users aged 13 and older. We do not knowingly collect personal information from ' +
          'children under 13. If you believe a child under 13 has created an account, please contact us at ' +
          '[hello@useapplyd.com](mailto:hello@useapplyd.com) and we will delete the account promptly.',
      ],
    },
    {
      heading: 'Changes to this policy',
      paragraphs: [
        'If we make significant changes to this policy, we will notify users by email or with a notice in the ' +
          'app before the changes take effect. The "last updated" date at the top of this page will always ' +
          'reflect when it was last changed.',
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [
        "Questions, concerns, or requests? Email us at [hello@useapplyd.com](mailto:hello@useapplyd.com). " +
          "We're a small team and we actually read every email.",
      ],
    },
  ],
  footerLinks: [
    { label: 'Help & FAQ', href: '/help' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
};

export const ja: PrivacyCopy = {
  title: 'プライバシーポリシー',
  lastUpdated: '最終更新日：2026年3月27日',
  intro: 'Applydは就活生のために作りました。難しい法律用語は使いません。何を収集し、なぜ収集し、どう使うかを正直にお伝えします。',
  sections: [
    {
      heading: '収集する情報',
      bullets: [
        { label: 'アカウント情報', body: '登録時に提供いただくメールアドレスとパスワード。' },
        { label: 'プロフィール情報', body: '氏名・学年・就活モードなど。オンボーディングで入力し、いつでも更新できます。' },
        { label: '選考データ', body: '企業・職種・ステータス・締め切り・メモ・採用担当者情報。これはあなたのデータです—保管するだけです。' },
        { label: '基本的な利用データ', body: '機能の利用状況などの匿名データ。個人情報とは紐付けません。' },
      ],
    },
    {
      heading: '情報の利用目的',
      bullets: [
        { body: 'Applydの運営と選考トラッカーの機能提供のため。' },
        { body: 'プロフィールに基づきダッシュボードをパーソナライズするため。' },
        { body: 'パスワードリセットやアカウント確認などのトランザクションメール送信のため。' },
        { body: '締め切りリマインダーや製品アップデートの通知（オプトインした場合のみ）。' },
      ],
      callout: '**あなたのデータを第三者に販売することは絶対にありません。**広告主への提供も一切行いません。',
    },
    {
      heading: 'データの保管とセキュリティ',
      bullets: [
        {
          body:
            'すべてのデータは[Supabase](https://supabase.com)に保管（行レベルセキュリティ付きPostgreSQL）。' +
            '各ユーザーは自分のデータにしかアクセスできません。',
        },
        { body: 'パスワードはハッシュ化されており、平文では保管されません。' },
        { body: 'すべてのデータは通信中（HTTPS）および保存時に暗号化されています。' },
        { body: 'SupabaseはSOC 2 Type II認証を取得しています。' },
      ],
    },
    {
      heading: '利用している外部サービス',
      bullets: [
        { label: 'Supabase', body: 'データベースと認証。' },
        { label: 'Vercel', body: 'ホスティングとデプロイ。' },
        { label: 'Resend', body: 'トランザクションメールの配信。' },
        { body: 'サービス改善のために匿名化された分析ツールを利用する場合があります。個人情報は送信されません。' },
      ],
    },
    {
      heading: 'あなたの権利',
      bullets: [
        { body: '設定からいつでもアカウントとすべてのデータを削除できます。' },
        { body: 'いつでも選考データをエクスポートできます。' },
        { body: 'プロフィール情報はダッシュボードからいつでも更新できます。' },
        {
          body:
            'データのコピーのご要望やプライバシーに関するご質問は、' +
            '[hello@useapplyd.com](mailto:hello@useapplyd.com) までどうぞ。',
        },
      ],
    },
    {
      heading: 'Cookie について',
      bullets: [
        { body: 'ログイン状態の保持と言語設定の記憶のためのCookieを使用しています。それだけです。' },
        { body: '広告Cookie・追跡Cookie・サードパーティの分析Cookieは使用していません。' },
      ],
    },
    {
      heading: 'お子様のプライバシー',
      paragraphs: [
        'Applydは13歳以上を対象としています。13歳未満のお子様のアカウントを発見した場合は ' +
          '[hello@useapplyd.com](mailto:hello@useapplyd.com) までご連絡ください。速やかに削除します。',
      ],
    },
    {
      heading: 'ポリシーの変更',
      paragraphs: [
        '重要な変更を加える場合は、変更前にメールまたはアプリ内通知でお知らせします。' +
          'ページ上部の最終更新日は常に最新の変更日を反映します。',
      ],
    },
    {
      heading: 'お問い合わせ',
      paragraphs: [
        'ご質問・ご要望は [hello@useapplyd.com](mailto:hello@useapplyd.com) までお気軽にどうぞ。' +
          'すべてのメールに目を通しています。',
      ],
    },
  ],
  footerLinks: [
    { label: '利用規約', href: '/terms' },
    { label: 'プライバシーポリシー', href: '/privacy' },
  ],
};
