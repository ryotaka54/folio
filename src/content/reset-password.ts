export interface ResetPasswordCopy {
  title: string;
  subtitle: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  confirmPasswordLabel: string;
  confirmPasswordPlaceholder: string;
  showPasswordAriaLabel: string;
  hidePasswordAriaLabel: string;
  submitLabel: string;
  submitLoadingLabel: string;
  passwordMismatchError: string;
  passwordTooShortError: string;
}

export const en: ResetPasswordCopy = {
  title: 'Set a new password',
  subtitle: 'Choose a strong password for your account.',
  passwordLabel: 'New password',
  passwordPlaceholder: 'At least 6 characters',
  confirmPasswordLabel: 'Confirm password',
  confirmPasswordPlaceholder: 'Confirm your password',
  showPasswordAriaLabel: 'Show password',
  hidePasswordAriaLabel: 'Hide password',
  submitLabel: 'Update password',
  submitLoadingLabel: 'Updating…',
  passwordMismatchError: 'Passwords do not match',
  passwordTooShortError: 'Password must be at least 6 characters',
};

export const ja: ResetPasswordCopy = {
  title: '新しいパスワードを設定',
  subtitle: 'アカウントで使用する新しいパスワードを入力してください。',
  passwordLabel: '新しいパスワード',
  passwordPlaceholder: '6文字以上で入力',
  confirmPasswordLabel: 'パスワード（確認）',
  confirmPasswordPlaceholder: 'もう一度入力してください',
  showPasswordAriaLabel: 'パスワードを表示',
  hidePasswordAriaLabel: 'パスワードを非表示',
  submitLabel: 'パスワードを更新',
  submitLoadingLabel: '更新中…',
  passwordMismatchError: 'パスワードが一致しません',
  passwordTooShortError: 'パスワードは6文字以上で入力してください',
};
