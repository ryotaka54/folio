import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';

const F = "'Noto Sans JP', sans-serif";
const G = "var(--font-geist), -apple-system, sans-serif";

const SECTIONS = [
  {
    title: '対象ユーザー',
    content: [
      'Applydは就活生のための選考管理サービスです。ご利用いただくことで、13歳以上であること、およびこの利用規約に同意することを確認いただいたものとします。',
      '18歳未満の方は、保護者または法定代理人の同意を得ていることを確認してください。',
    ],
  },
  {
    title: 'アカウントについて',
    items: [
      'ログイン情報は安全に管理してください。パスワードを他者と共有しないでください。',
      'アカウントで発生するすべての活動に対して責任を負います。',
      '不正アクセスが疑われる場合はすぐに support@useapplyd.com までご連絡ください。',
      '利用規約に違反したアカウントは予告なく停止または削除される場合があります。',
    ],
  },
  {
    title: 'あなたのデータ',
    content: [
      'Applydに登録した選考情報・メモ・採用担当者情報はすべてあなたのものです。私たちはあなたに代わって保管するだけで、第三者に販売することはありません。',
      '設定からいつでもデータのエクスポートやアカウントの削除が可能です。削除後、30日以内にデータは完全に消去されます。',
    ],
  },
  {
    title: '禁止事項',
    intro: '以下の行為を禁じます：',
    items: [
      '違法な目的またはいかなる規制にも違反する方法でApplydを使用すること。',
      'サービスやインフラへの不正アクセスを試みること。',
      '自動化された手段でデータをスクレイピング・クロールすること。',
      'サービスの整合性またはパフォーマンスを妨害すること。',
      '他の個人または法人になりすますこと。',
      '悪意のあるコードやコンテンツをアップロードすること。',
    ],
  },
  {
    title: 'Proサブスクリプション',
    items: [
      'Applyd Proは月額または年額の有料プランで、無制限の選考管理と追加機能が利用できます。',
      'サブスクリプションは選択したプランに応じて月次または年次で請求されます。',
      'いつでもキャンセルできます。キャンセルは現在の請求期間終了時に有効となり、それまではProを引き続き利用できます。',
      '請求に誤りがあると思われる場合は、請求日から7日以内に support@useapplyd.com までご連絡ください。',
      'サブスクリプション料金は30日前の通知をもって変更する権利を留保します。',
    ],
  },
  {
    title: '知的財産権',
    content: [
      'Applydおよびそのコンテンツ・機能・デザインは当社が所有しており、知的財産法によって保護されています。',
      'あなたが作成したコンテンツ（選考データ・メモ・採用担当者情報）の所有権はあなたに帰属します。',
    ],
  },
  {
    title: '免責事項',
    content: [
      'Applydは「現状のまま」「利用可能な状態で」提供され、いかなる保証も行いません。サービスが中断なく動作すること、または提供される情報（就活ベンチマークなど）が正確・完全であることを保証しません。',
      '当社は、アプリ内に記載されているいかなる企業・求人サイト・大学とも提携・推薦・パートナーシップ関係にありません。',
    ],
  },
  {
    title: '責任の制限',
    content: [
      '適用法が許す最大限の範囲において、Applydはサービスの利用から生じるいかなる間接的・偶発的・特別・結果的損害についても責任を負いません。',
      'いかなる請求に対しても、当社の総責任は請求の12ヶ月前にあなたが支払った金額を超えないものとします。',
    ],
  },
  {
    title: '利用規約の変更',
    content: [
      '利用規約は随時更新することがあります。変更の際はこのページの日付を更新し、重要な変更の場合はメールまたはアプリ内通知でお知らせします。',
      '変更後もApplydを引き続きご利用いただくことで、更新された規約に同意したものとみなされます。',
    ],
  },
  {
    title: 'お問い合わせ',
    content: ['利用規約に関するご質問は support@useapplyd.com までお送りください。できる限り早くご回答します。'],
  },
];

export default function JaTermsPage() {
  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: F }}>
      <nav className="border-b border-border-gray bg-background sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/ja" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <Logo size={22} variant="dark" />
            <span className="text-[15px] font-semibold" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em', fontFamily: G }}>Applyd</span>
          </Link>
          <Link href="/ja/dashboard" className="inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-70" style={{ color: 'var(--muted-text)' }}>
            <ArrowLeft size={15} />
            ダッシュボードへ
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-14">
        <div className="mb-10">
          <h1 className="text-[22px] font-semibold mb-2" style={{ color: 'var(--brand-navy)', letterSpacing: '-0.02em' }}>利用規約</h1>
          <p className="text-sm" style={{ color: 'var(--muted-text)' }}>最終更新日：2026年4月7日</p>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--body-text)' }}>
            これらの規約はApplydのご利用を規定するものです。できる限りわかりやすく記載しました。サービスをご利用いただく前にお読みください。
          </p>
        </div>

        <div className="space-y-10">
          {SECTIONS.map((section, i) => (
            <section key={i}>
              <h2 className="text-base font-semibold mb-3 pb-2 border-b border-border-gray" style={{ color: 'var(--brand-navy)' }}>
                {section.title}
              </h2>
              <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--body-text)' }}>
                {section.intro && <p>{section.intro}</p>}
                {section.content?.map((para, j) => <p key={j}>{para}</p>)}
                {section.items && (
                  <ul className="space-y-2.5">
                    {section.items.map((item, j) => (
                      <li key={j} className="flex gap-3">
                        <span className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-blue)' }}>→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-xl p-6 text-center" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-gray)' }}>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--brand-navy)' }}>
            Applydをご利用いただくことで、これらの利用規約に同意したものとみなされます。
          </p>
          <p className="text-[12px] mb-5" style={{ color: 'var(--muted-text)' }}>
            ご不明な点は{' '}
            <a href="mailto:support@useapplyd.com" className="underline underline-offset-2 hover:opacity-80 transition-opacity">
              support@useapplyd.com
            </a>
            {' '}まで。
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/ja/signup" className="inline-flex items-center h-9 px-5 rounded-lg text-[13px] font-semibold text-white transition-colors" style={{ background: 'var(--accent-blue)' }}>
              同意してアカウントを作成
            </Link>
            <Link href="/ja" className="inline-flex items-center h-9 px-5 rounded-lg text-[13px] font-medium border transition-colors hover:bg-surface-gray" style={{ borderColor: 'var(--border-gray)', color: 'var(--muted-text)' }}>
              同意しない・戻る
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border-gray flex items-center justify-between flex-wrap gap-3">
          <Link href="/ja/privacy" className="text-[12px] transition-colors hover:opacity-70" style={{ color: 'var(--muted-text)' }}>プライバシーポリシー</Link>
          <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>© 2026 Applyd</p>
        </div>
      </main>
    </div>
  );
}
