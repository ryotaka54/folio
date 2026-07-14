export interface SignupCopy {
  title: string;
  subtitle: string;
  referralBannerText: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  confirmPasswordLabel: string;
  confirmPasswordPlaceholder: string;
  showPasswordAriaLabel: string;
  hidePasswordAriaLabel: string;
  submitLabel: string;
  submitLoadingLabel: string;
  /** Text before the Terms of Service link, with trailing spacing baked in as needed for the locale. */
  consentPrefix: string;
  termsLinkText: string;
  /** "and" joiner between the two consent links, with surrounding spacing baked in as needed for the locale. */
  consentAnd: string;
  privacyLinkText: string;
  /** Text after the Privacy Policy link (e.g. trailing punctuation). */
  consentSuffix: string;
  alreadyHaveAccountText: string;
  loginLinkText: string;
  passwordMismatchError: string;
  passwordTooShortError: string;
  timeoutErrorMessage: string;
  genericErrorMessage: string;
}

export const en: SignupCopy = {
  title: 'Create your account',
  subtitle: 'Free to use. No credit card needed.',
  referralBannerText: "You were invited — sign up to confirm your friend's referral.",
  emailLabel: 'Email',
  emailPlaceholder: 'you@email.com',
  passwordLabel: 'Password',
  passwordPlaceholder: 'At least 6 characters',
  confirmPasswordLabel: 'Confirm password',
  confirmPasswordPlaceholder: 'Confirm your password',
  showPasswordAriaLabel: 'Show password',
  hidePasswordAriaLabel: 'Hide password',
  submitLabel: 'Create account',
  submitLoadingLabel: 'Creating account…',
  consentPrefix: 'By creating an account you agree to our ',
  termsLinkText: 'Terms of Service',
  consentAnd: ' and ',
  privacyLinkText: 'Privacy Policy',
  consentSuffix: '.',
  alreadyHaveAccountText: 'Already have an account? ',
  loginLinkText: 'Log in',
  passwordMismatchError: 'Passwords do not match',
  passwordTooShortError: 'Password must be at least 6 characters',
  timeoutErrorMessage: 'Request timed out. Please check your connection and try again.',
  genericErrorMessage: 'Something went wrong. Please try again.',
};

export const ja: SignupCopy = {
  title: 'アカウントを作成',
  subtitle: '無料ではじめられます。クレジットカード不要。',
  referralBannerText: '友達から招待されました。登録して特典をゲットしよう。',
  emailLabel: 'メールアドレス',
  emailPlaceholder: 'you@example.com',
  passwordLabel: 'パスワード',
  passwordPlaceholder: '6文字以上',
  confirmPasswordLabel: 'パスワード（確認）',
  confirmPasswordPlaceholder: 'パスワードを再入力',
  showPasswordAriaLabel: 'パスワードを表示',
  hidePasswordAriaLabel: 'パスワードを非表示',
  submitLabel: 'アカウントを作成する',
  submitLoadingLabel: 'アカウント作成中…',
  consentPrefix: '登録することで',
  termsLinkText: '利用規約',
  consentAnd: 'および',
  privacyLinkText: 'プライバシーポリシー',
  consentSuffix: 'に同意したものとみなします。',
  alreadyHaveAccountText: 'すでにアカウントをお持ちの方は ',
  loginLinkText: 'ログイン',
  passwordMismatchError: 'パスワードが一致しません',
  passwordTooShortError: 'パスワードは6文字以上で入力してください',
  timeoutErrorMessage: '接続がタイムアウトしました。もう一度お試しください。',
  genericErrorMessage: '登録に失敗しました。もう一度お試しください。',
};
