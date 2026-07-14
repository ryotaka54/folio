/**
 * Terms of Service copy, shared between the EN (`/terms`) and JA (`/ja/terms`)
 * routes via TermsView. Plain text only — unlike privacy.ts, no section here
 * currently needs inline bold/link markup, so no rich-text parsing is used.
 */

export interface TermsSection {
  heading: string;
  /** Short lead-in line before a bulleted list, e.g. "You agree not to:". */
  intro?: string;
  /** Paragraph(s) of prose. */
  paragraphs?: string[];
  /** Bulleted list items. */
  bullets?: string[];
}

export interface TermsAgreement {
  statement: string;
  questionPrefix: string;
  /** Optional trailing text after the email link, e.g. JA's "まで。" */
  questionSuffix?: string;
  agreeLabel: string;
  disagreeLabel: string;
}

export interface FooterLink {
  label: string;
  /** Canonical (EN-rooted) path — pass through localeHref() before rendering. */
  href: string;
}

export interface TermsCopy {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: TermsSection[];
  agreement: TermsAgreement;
  footerLinks: FooterLink[];
}

export const en: TermsCopy = {
  title: 'Terms of Service',
  lastUpdated: 'Last updated: April 7, 2026',
  intro:
    'These terms govern your use of Applyd. We have written them to be as clear and straightforward as possible. ' +
    'Please read them before using the service.',
  sections: [
    {
      heading: 'Who this is for',
      paragraphs: [
        'Applyd is a recruiting pipeline tracker built for students. By using Applyd you confirm that you are at ' +
          'least 13 years old and agree to these terms.',
        'If you are under 18, you represent that you have permission from a parent or legal guardian.',
      ],
    },
    {
      heading: 'Your account',
      bullets: [
        'You are responsible for keeping your login credentials secure. Do not share your password.',
        'You are responsible for all activity that occurs under your account.',
        'Notify us immediately at support@useapplyd.com if you suspect unauthorized access.',
        'We reserve the right to suspend or terminate accounts that violate these terms.',
      ],
    },
    {
      heading: 'Your data',
      paragraphs: [
        'The applications, notes, and recruiter details you add to Applyd belong to you. We store them on your ' +
          'behalf and do not sell them to third parties.',
        'You can export or delete your data at any time from Settings. If you delete your account, your data is ' +
          'permanently removed within 30 days.',
      ],
    },
    {
      heading: 'Acceptable use',
      intro: 'You agree not to:',
      bullets: [
        'Use Applyd for any unlawful purpose or in violation of any regulations.',
        'Attempt to gain unauthorized access to any part of the service or its infrastructure.',
        'Scrape, crawl, or otherwise extract data from Applyd in an automated manner.',
        'Interfere with or disrupt the integrity or performance of the service.',
        'Impersonate another person or entity.',
        'Upload malicious code or content of any kind.',
      ],
    },
    {
      heading: 'Pro subscription',
      bullets: [
        'Applyd Pro is a paid subscription that unlocks unlimited application tracking and additional features.',
        'Subscriptions are billed monthly or annually depending on the plan you choose.',
        'You may cancel at any time. Cancellation takes effect at the end of the current billing period — you ' +
          'retain Pro access until then.',
        'Refunds are handled on a case-by-case basis. Contact us at support@useapplyd.com within 7 days of a ' +
          'charge if you believe you were billed in error.',
        'We reserve the right to change subscription pricing with 30 days notice.',
      ],
    },
    {
      heading: 'Intellectual property',
      paragraphs: [
        'Applyd and its original content, features, and design are owned by us and protected by applicable ' +
          'intellectual property laws.',
        'You retain ownership of any content you create — your application data, notes, and recruiter ' +
          'information are yours.',
      ],
    },
    {
      heading: 'Disclaimers',
      paragraphs: [
        'Applyd is provided "as is" and "as available" without warranties of any kind, express or implied. We ' +
          'do not guarantee that the service will be uninterrupted, error-free, or that any information provided ' +
          '(such as recruiting benchmarks) is accurate or complete.',
        'We are not affiliated with, endorsed by, or in partnership with any employer, job board, or university ' +
          'mentioned within the application.',
      ],
    },
    {
      heading: 'Limitation of liability',
      paragraphs: [
        'To the fullest extent permitted by law, Applyd shall not be liable for any indirect, incidental, ' +
          'special, or consequential damages arising from your use of the service, even if we have been advised ' +
          'of the possibility of such damages.',
        'Our total liability to you for any claim shall not exceed the amount you paid us in the 12 months ' +
          'prior to the claim.',
      ],
    },
    {
      heading: 'Changes to these terms',
      paragraphs: [
        'We may update these terms from time to time. When we do, we will update the date at the top of this ' +
          'page and, for material changes, notify you by email or an in-app notice.',
        'Continued use of Applyd after changes take effect constitutes acceptance of the updated terms.',
      ],
    },
    {
      heading: 'Contact',
      paragraphs: ['Questions about these terms? Email us at support@useapplyd.com and we will get back to you.'],
    },
  ],
  agreement: {
    statement: 'By using Applyd you agree to these terms.',
    questionPrefix: 'Questions? Email us at',
    agreeLabel: 'I agree — create my account',
    disagreeLabel: 'I disagree — go back',
  },
  footerLinks: [{ label: 'Privacy Policy', href: '/privacy' }],
};

export const ja: TermsCopy = {
  title: '利用規約',
  lastUpdated: '最終更新日：2026年4月7日',
  intro: 'これらの規約はApplydのご利用を規定するものです。できる限りわかりやすく記載しました。サービスをご利用いただく前にお読みください。',
  sections: [
    {
      heading: '対象ユーザー',
      paragraphs: [
        'Applydは就活生のための選考管理サービスです。ご利用いただくことで、13歳以上であること、およびこの利用規約に同意することを確認いただいたものとします。',
        '18歳未満の方は、保護者または法定代理人の同意を得ていることを確認してください。',
      ],
    },
    {
      heading: 'アカウントについて',
      bullets: [
        'ログイン情報は安全に管理してください。パスワードを他者と共有しないでください。',
        'アカウントで発生するすべての活動に対して責任を負います。',
        '不正アクセスが疑われる場合はすぐに support@useapplyd.com までご連絡ください。',
        '利用規約に違反したアカウントは予告なく停止または削除される場合があります。',
      ],
    },
    {
      heading: 'あなたのデータ',
      paragraphs: [
        'Applydに登録した選考情報・メモ・採用担当者情報はすべてあなたのものです。私たちはあなたに代わって保管するだけで、第三者に販売することはありません。',
        '設定からいつでもデータのエクスポートやアカウントの削除が可能です。削除後、30日以内にデータは完全に消去されます。',
      ],
    },
    {
      heading: '禁止事項',
      intro: '以下の行為を禁じます：',
      bullets: [
        '違法な目的またはいかなる規制にも違反する方法でApplydを使用すること。',
        'サービスやインフラへの不正アクセスを試みること。',
        '自動化された手段でデータをスクレイピング・クロールすること。',
        'サービスの整合性またはパフォーマンスを妨害すること。',
        '他の個人または法人になりすますこと。',
        '悪意のあるコードやコンテンツをアップロードすること。',
      ],
    },
    {
      heading: 'Proサブスクリプション',
      bullets: [
        'Applyd Proは月額または年額の有料プランで、無制限の選考管理と追加機能が利用できます。',
        'サブスクリプションは選択したプランに応じて月次または年次で請求されます。',
        'いつでもキャンセルできます。キャンセルは現在の請求期間終了時に有効となり、それまではProを引き続き利用できます。',
        '請求に誤りがあると思われる場合は、請求日から7日以内に support@useapplyd.com までご連絡ください。',
        'サブスクリプション料金は30日前の通知をもって変更する権利を留保します。',
      ],
    },
    {
      heading: '知的財産権',
      paragraphs: [
        'Applydおよびそのコンテンツ・機能・デザインは当社が所有しており、知的財産法によって保護されています。',
        'あなたが作成したコンテンツ（選考データ・メモ・採用担当者情報）の所有権はあなたに帰属します。',
      ],
    },
    {
      heading: '免責事項',
      paragraphs: [
        'Applydは「現状のまま」「利用可能な状態で」提供され、いかなる保証も行いません。サービスが中断なく動作すること、または提供される情報（就活ベンチマークなど）が正確・完全であることを保証しません。',
        '当社は、アプリ内に記載されているいかなる企業・求人サイト・大学とも提携・推薦・パートナーシップ関係にありません。',
      ],
    },
    {
      heading: '責任の制限',
      paragraphs: [
        '適用法が許す最大限の範囲において、Applydはサービスの利用から生じるいかなる間接的・偶発的・特別・結果的損害についても責任を負いません。',
        'いかなる請求に対しても、当社の総責任は請求の12ヶ月前にあなたが支払った金額を超えないものとします。',
      ],
    },
    {
      heading: '利用規約の変更',
      paragraphs: [
        '利用規約は随時更新することがあります。変更の際はこのページの日付を更新し、重要な変更の場合はメールまたはアプリ内通知でお知らせします。',
        '変更後もApplydを引き続きご利用いただくことで、更新された規約に同意したものとみなされます。',
      ],
    },
    {
      heading: 'お問い合わせ',
      paragraphs: ['利用規約に関するご質問は support@useapplyd.com までお送りください。できる限り早くご回答します。'],
    },
  ],
  agreement: {
    statement: 'Applydをご利用いただくことで、これらの利用規約に同意したものとみなされます。',
    questionPrefix: 'ご不明な点は',
    questionSuffix: 'まで。',
    agreeLabel: '同意してアカウントを作成',
    disagreeLabel: '同意しない・戻る',
  },
  footerLinks: [{ label: 'プライバシーポリシー', href: '/privacy' }],
};
