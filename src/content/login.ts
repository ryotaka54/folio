export interface LoginCopy {
  title: string;
  subtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  forgotPasswordText: string;
  showPasswordAriaLabel: string;
  hidePasswordAriaLabel: string;
  submitLabel: string;
  submitLoadingLabel: string;
  noAccountText: string;
  signupLinkText: string;
  timeoutErrorMessage: string;
  invalidCredentialsMessage: string;
}

export const en: LoginCopy = {
  title: 'Welcome back',
  subtitle: 'Log in to continue tracking your applications.',
  emailLabel: 'Email',
  emailPlaceholder: 'you@email.com',
  passwordLabel: 'Password',
  passwordPlaceholder: 'Your password',
  forgotPasswordText: 'Forgot password?',
  showPasswordAriaLabel: 'Show password',
  hidePasswordAriaLabel: 'Hide password',
  submitLabel: 'Log in',
  submitLoadingLabel: 'Logging in…',
  noAccountText: "Don't have an account?",
  signupLinkText: 'Sign up',
  timeoutErrorMessage: 'Request timed out. Please check your connection and try again.',
  invalidCredentialsMessage: 'Invalid email or password',
};

export const ja: LoginCopy = {
  title: 'おかえりなさい',
  subtitle: 'ログインして就活管理を続けましょう。',
  emailLabel: 'メールアドレス',
  emailPlaceholder: 'you@example.com',
  passwordLabel: 'パスワード',
  passwordPlaceholder: 'パスワードを入力',
  forgotPasswordText: 'パスワードを忘れた方',
  showPasswordAriaLabel: 'パスワードを表示',
  hidePasswordAriaLabel: 'パスワードを非表示',
  submitLabel: 'ログイン',
  submitLoadingLabel: 'ログイン中…',
  noAccountText: 'アカウントをお持ちでない方は',
  signupLinkText: '新規登録',
  timeoutErrorMessage: '接続がタイムアウトしました。もう一度お試しください。',
  invalidCredentialsMessage: 'メールアドレスまたはパスワードが正しくありません',
};
