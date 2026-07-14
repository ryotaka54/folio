export interface HelpFaq {
  q: string;
  a: string;
}

export interface HelpCopy {
  /** Breadcrumb label shown in the shared PageHeader, e.g. "Help & FAQ". */
  breadcrumb: string;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  noResultsText: (query: string) => string;
  faqs: HelpFaq[];
  tourTitle: string;
  tourSubtitle: string;
  tourCta: string;
  contactTitle: string;
  contactSubtitle: string;
  contactCta: string;
}

export const en: HelpCopy = {
  breadcrumb: 'Help & FAQ',
  title: 'Help Center',
  subtitle: 'Everything you need to know about Applyd.',
  searchPlaceholder: 'Search help articles…',
  noResultsText: (query: string) => `No results for “${query}”`,
  faqs: [
    {
      q: 'What is Applyd?',
      a: 'Applyd is a job tracker built for students. Add applications in seconds, move them through your pipeline as things progress, and never lose track of a deadline.',
    },
    {
      q: 'How do I track a new application?',
      a: 'Click "Add Application" on your dashboard. Paste a job link and click Autofill to pull in the company, role, and location automatically — or fill it in manually. Takes about 15 seconds.',
    },
    {
      q: 'What are the pipeline stages?',
      a: 'Internship mode: Wishlist → Applied → OA / Online Assessment → Phone / Recruiter Screen → Final Round Interviews → Offer → Rejected. Job mode: Wishlist → Applied → Recruiter Screen → Technical / Case Interview → Final Round → Offer. You pick your mode during onboarding and can change it anytime from the command palette (⌘K).',
    },
    {
      q: 'How do I use the kanban board?',
      a: "Drag and drop a company's card on your dashboard to move it between stages. On mobile, open the card's menu to change its stage instead. The stages follow the flow of a typical job search, from application through offer.",
    },
    {
      q: 'Is my data private?',
      a: "Yes. Your data is stored securely with Supabase (hosted in the US) over an encrypted HTTPS connection, with row-level security so only your account can read it. We don't sell your data or share it with third parties — see our Privacy Policy for details.",
    },
    {
      q: 'How do I edit or delete an application?',
      a: 'Click any card in the pipeline to open its detail panel. You can update every field there, including notes and recruiter info. Scroll to the bottom of the panel to delete it.',
    },
    {
      q: 'Is Applyd free?',
      a: "Applyd's core features — company tracking, the kanban board, and interview notes — are free to use. Advanced features like AI interview prep, the SPI test tracker, and offer management require a Pro plan. Check the Settings page for current pricing.",
    },
    {
      q: 'How much does the Pro plan cost?',
      a: 'See the Settings page for current pricing. Monthly plans can be cancelled anytime and remain active until the end of the billing period you already paid for.',
    },
    {
      q: 'Can I use Applyd on mobile?',
      a: 'Yes. Applyd works on phones and tablets right from your browser — no app to install.',
    },
    {
      q: 'What does AI Interview Prep include?',
      a: 'The Pro plan\'s AI Interview Prep generates likely interview questions and sample answers based on a company\'s profile, organized into categories like behavioral stories, "why this company," and questions to ask the interviewer.',
    },
    {
      q: 'Can I export my data?',
      a: "CSV export is currently in development. If you'd like to delete your account and need a copy of your data first, contact us before deleting and we'll send it over.",
    },
    {
      q: 'How do I delete my account?',
      a: 'Go to Settings and choose "Delete account." All of your data is permanently removed within 30 days.',
    },
    {
      q: 'What happens when I refer a friend?',
      a: 'When a friend signs up through your invite link, you both get a reward. Check the "Invite" section on the Settings page for details.',
    },
    {
      q: 'What do I do if I find a bug?',
      a: "Please contact us and let us know — we'll look into it as soon as possible.",
    },
  ],
  tourTitle: 'Take the product tour',
  tourSubtitle: 'Walk through every feature of the dashboard in about 90 seconds.',
  tourCta: 'Replay tour →',
  contactTitle: 'Still have questions?',
  contactSubtitle: 'We read every email.',
  contactCta: 'Contact us',
};

export const ja: HelpCopy = {
  breadcrumb: 'ヘルプ',
  title: 'よくある質問',
  subtitle: 'Applydについて知っておきたいことをまとめました。',
  searchPlaceholder: 'ヘルプ記事を検索…',
  noResultsText: (query: string) => `「${query}」に一致する結果はありません`,
  faqs: [
    {
      q: 'Applydとは何ですか？',
      a: 'Applydは、学生向けに作られた就活トラッカーです。企業情報を数秒で登録し、選考の進捗に合わせてステータスを移動させながら、締め切りを逃さず管理できます。',
    },
    {
      q: '新しい応募先はどうやって登録しますか？',
      a: 'ダッシュボードの「応募先を追加」をクリックし、求人ページのURLを貼り付けて「自動入力」を押すと、企業名・職種・勤務地が自動で入力されます。手動での入力も可能です。所要時間は約15秒です。',
    },
    {
      q: '選考ステージにはどんな種類がありますか？',
      a: 'インターンモード：気になる → 応募済み → Webテスト／適性検査 → 電話・リクルーター面談 → 最終面接 → 内定 → 不採用。本選考モード：気になる → 応募済み → リクルーター面談 → 技術・ケース面接 → 最終面接 → 内定。モードはオンボーディング時に選択でき、コマンドパレット（⌘K）からいつでも変更できます。',
    },
    {
      q: 'カンバンボードの使い方を教えてください。',
      a: 'ダッシュボードで企業カードをドラッグ＆ドロップして選考ステージを移動できます。モバイルでは各カードのメニューからステージを変更できます。ステージは「書類選考」「面接」「内定」など就活の流れに沿っています。',
    },
    {
      q: 'データは安全に管理されていますか？',
      a: '入力したデータはSupabase（米国）のサーバーに安全に保存されます。暗号化通信（HTTPS）を使用し、行レベルセキュリティにより本人のアカウントのみが閲覧できます。第三者への提供は行いません。詳細はプライバシーポリシーをご覧ください。',
    },
    {
      q: '応募先の編集・削除はどうすればいいですか？',
      a: 'カンバンボード上のカードをクリックすると詳細パネルが開きます。メモやリクルーター情報を含むすべての項目をそこで編集できます。パネル下部から削除も可能です。',
    },
    {
      q: 'Applydは無料で使えますか？',
      a: 'はい。基本機能（企業管理・カンバンボード・面接メモ）は無料でご利用いただけます。AI面接対策・SPIトラッカー・内定管理などの高度な機能はProプランが必要です。',
    },
    {
      q: 'Proプランの料金はいくらですか？',
      a: '料金は設定ページでご確認ください。月額プランはいつでも解約でき、解約後も次の更新日まで利用可能です。',
    },
    {
      q: 'スマートフォンでも使えますか？',
      a: 'はい。Applydはモバイル対応しており、スマートフォン・タブレットでもお使いいただけます。ブラウザからアクセスするだけで利用できます。',
    },
    {
      q: 'AI面接対策機能とは何ですか？',
      a: 'ProプランのAI面接対策では、企業の情報をもとに想定される面接質問と回答例を自動生成します。「ガクチカ」「志望動機」「逆質問」などのカテゴリ別にトレーニングできます。',
    },
    {
      q: 'データをエクスポートできますか？',
      a: '現在、CSVエクスポート機能は開発中です。アカウント削除をご希望の場合は、削除前にお問い合わせいただければデータをお渡しすることも可能です。',
    },
    {
      q: 'アカウントを削除するにはどうすればいいですか？',
      a: '設定ページの「アカウント削除」よりお手続きいただけます。削除後30日以内にすべてのデータが完全に削除されます。',
    },
    {
      q: '友達を招待するとどうなりますか？',
      a: '招待リンクから友達が登録すると、あなたと友達の両方に特典が付与されます。招待の詳細は設定ページの「招待」セクションをご確認ください。',
    },
    {
      q: 'バグや不具合を見つけた場合はどうすればいいですか？',
      a: 'お問い合わせページよりご報告ください。できるだけ早く対応いたします。',
    },
  ],
  tourTitle: '製品ツアーを見る',
  tourSubtitle: 'ダッシュボードの主な機能を90秒でご案内します。',
  tourCta: 'ツアーを再生 →',
  contactTitle: 'まだ質問がありますか？',
  contactSubtitle: 'いただいたメールにはすべて目を通しています。',
  contactCta: 'お問い合わせ',
};
