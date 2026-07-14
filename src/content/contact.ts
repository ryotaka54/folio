export interface ContactQuickLink {
  label: string;
  /** Canonical (EN-rooted) path — pass through localeHref() before rendering. */
  href: string;
}

export interface ContactCopy {
  breadcrumb: string;
  title: string;
  subtitle: string;
  quickLinks: ContactQuickLink[];
  categories: string[];
  categoryLabel: string;
  categoryPlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  messageMaxLength: number;
  submitLabel: string;
  submitLoadingLabel: string;
  successTitle: string;
  successMessage: string;
  errorRequiredMessage: string;
  errorSubmitMessage: string;
  directEmailLabel: string;
}

export const en: ContactCopy = {
  breadcrumb: 'Contact',
  title: 'Contact us',
  subtitle: "Have feedback, a bug, or a question? We'd love to hear from you — we usually reply within 1-2 business days.",
  quickLinks: [
    { label: 'Help Center', href: '/help' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
  categories: ['Bug Report', 'Feature Request', 'Billing & Plans', 'Account', 'Other'],
  categoryLabel: 'What is this about?',
  categoryPlaceholder: 'Select a category',
  emailLabel: 'Email address',
  emailPlaceholder: 'you@example.com',
  messageLabel: 'Message',
  messagePlaceholder: 'Tell us what’s going on',
  messageMaxLength: 1000,
  submitLabel: 'Send message',
  submitLoadingLabel: 'Sending…',
  successTitle: 'Message sent',
  successMessage: "Thanks for reaching out. We'll reply to the email address you provided.",
  errorRequiredMessage: 'Please fill in all fields.',
  errorSubmitMessage: 'Something went wrong sending your message. Please try again in a moment.',
  directEmailLabel: 'Prefer email? Reach us at',
};

export const ja: ContactCopy = {
  breadcrumb: 'お問い合わせ',
  title: 'サポート',
  subtitle: 'ご不明な点や問題がございましたらお気軽にご連絡ください。通常1〜2営業日以内にご返信いたします。',
  quickLinks: [
    { label: 'よくある質問', href: '/faq' },
    { label: 'プライバシーポリシー', href: '/privacy' },
    { label: '利用規約', href: '/terms' },
  ],
  categories: ['バグ報告', '機能リクエスト', '課金・プラン', 'アカウント', 'その他'],
  categoryLabel: 'お問い合わせの種類',
  categoryPlaceholder: '選択してください',
  emailLabel: 'メールアドレス',
  emailPlaceholder: 'you@example.com',
  messageLabel: '内容',
  messagePlaceholder: '詳しい内容をご記入ください',
  messageMaxLength: 1000,
  submitLabel: '送信する',
  submitLoadingLabel: '送信中...',
  successTitle: '送信が完了しました',
  successMessage: 'お問い合わせありがとうございます。入力いただいたメールアドレスに返信いたします。',
  errorRequiredMessage: 'すべての項目を入力してください。',
  errorSubmitMessage: '送信に失敗しました。しばらく経ってからもう一度お試しください。',
  directEmailLabel: 'メールでのご連絡はこちら',
};
