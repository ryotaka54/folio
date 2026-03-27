'use client';

import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Link href="/" className="fixed top-8 left-8 flex items-center gap-2 text-sm text-muted-text hover:text-brand-navy transition-colors">
        <ArrowLeft size={16} />
        Back to home
      </Link>

      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-light-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Mail className="text-accent-blue" size={32} />
        </div>
        
        <h1 className="text-2xl font-bold text-brand-navy mb-2">Contact Us</h1>
        <p className="text-muted-text mb-8">Have feedback, questions, or just want to say hi? We'd love to hear from you.</p>

        <div className="bg-card-bg border border-border-gray rounded-2xl p-8 shadow-sm">
          <p className="text-sm text-muted-text mb-2 font-medium uppercase tracking-wider">Email us at</p>
          <a 
            href="mailto:useapplyd@gmail.com" 
            className="text-xl md:text-2xl font-semibold text-accent-blue hover:underline break-all"
          >
            useapplyd@gmail.com
          </a>
        </div>

        <div className="mt-8">
          <Link href="/help" className="text-sm text-accent-blue hover:underline font-medium">
            Visit the Help Center
          </Link>
        </div>
      </div>
    </div>
  );
}
