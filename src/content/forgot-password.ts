export interface ForgotPasswordCopy {
  title: string;
  subtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  submitLabel: string;
  submitLoadingLabel: string;
  successTitle: string;
  successMessagePrefix: string;
  successMessageSuffix: string;
  backToLoginText: string;
}

export const en: ForgotPasswordCopy = {
  title: 'Reset your password',
  subtitle: "Enter your email and we'll send you a reset link.",
  emailLabel: 'Email',
  emailPlaceholder: 'you@email.com',
  submitLabel: 'Send reset link',
  submitLoadingLabel: 'Sending…',
  successTitle: 'Check your email',
  successMessagePrefix: 'We sent a reset link to ',
  successMessageSuffix: '.',
  backToLoginText: 'Back to log in',
};

export const ja: ForgotPasswordCopy = {
  title: 'パスワードを再設定',
  subtitle: '登録済みのメールアドレスを入力すると、再設定用のリンクをお送りします。',
  emailLabel: 'メールアドレス',
  emailPlaceholder: 'you@example.com',
  submitLabel: '再設定リンクを送信',
  submitLoadingLabel: '送信中…',
  successTitle: 'メールをご確認ください',
  successMessagePrefix: '',
  successMessageSuffix: ' 宛に再設定用のリンクを送信しました。',
  backToLoginText: 'ログインに戻る',
};
