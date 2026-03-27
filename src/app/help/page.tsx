'use client';

import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

const FAQS = [
  {
    q: "What is Applyd?",
    a: "Applyd is a simple, high-performance job tracker designed for students. It helps you manage internship and job applications in one place, so you never miss a deadline."
  },
  {
    q: "How do I track a new application?",
    a: "Click 'Add Application' on your dashboard. You can manually enter details or paste a job link (from Greenhouse, Lever, etc.) and click 'Autofill' to pull the info automatically."
  },
  {
    q: "What do the different pipeline stages mean?",
    a: "We provide two modes: Internship (Summer/Fall recruiting) and Jobs (Full-time). Each has stages like Wishlist, Applied, Interviewing, and Offer to help you visualize your progress."
  },
  {
    q: "Is my data secure?",
    a: "Yes. We use Supabase with Row Level Security (RLS) to ensure that only you can access your data. Your application history is private and protected."
  },
  {
    q: "How do I edit or delete an application?",
    a: "Click on any application card in your pipeline to open the details view. From there, you can update notes, change status, or delete the application entirely."
  },
  {
    q: "Can I use Applyd for free?",
    a: "Absolutely. Applyd is built for students, by students, and is free to use for tracking all your career opportunities."
  }
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border-gray bg-background sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div className="max-w-[800px] mx-auto px-4 md:px-6 flex items-center h-14 sm:h-16">
          <Link href="/" className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="10" width="40" height="5" rx="2.5" fill="#4361EE"/>
              <rect x="4" y="22" width="28" height="5" rx="2.5" fill="#4361EE" opacity="0.6"/>
              <rect x="4" y="34" width="16" height="5" rx="2.5" fill="#4361EE" opacity="0.3"/>
            </svg>
            <span className="text-lg font-semibold text-brand-navy tracking-tight">Applyd</span>
          </Link>
          <span className="mx-3 text-border-gray">/</span>
          <span className="text-sm font-medium text-muted-text">Help & FAQ</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-[800px] mx-auto px-4 md:px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-brand-navy mb-3">Help Center</h1>
          <p className="text-muted-text">Everything you need to know about Applyd.</p>
        </div>

        <div className="space-y-6">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-card-bg border border-border-gray rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-semibold text-brand-navy mb-2">{faq.q}</h3>
              <p className="text-sm text-body-text leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 p-8 bg-surface-gray rounded-3xl text-center">
          <h2 className="text-lg font-semibold text-brand-navy mb-2">Still have questions?</h2>
          <p className="text-sm text-muted-text mb-6">We're here to help you land your next big role with Applyd.</p>
          <Link 
            href="/contact" 
            className="inline-block px-6 py-2.5 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue/90 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </main>
    </div>
  );
}
