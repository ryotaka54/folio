'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AnimatedGroup } from '@/components/ui/animated-group';

interface University {
  name: string;
  domain: string;
}

const universities: University[] = [
  { name: 'UCLA',                      domain: 'ucla.edu' },
  { name: 'NYU',                       domain: 'nyu.edu' },
  { name: 'UC Berkeley',               domain: 'berkeley.edu' },
  { name: 'University of Michigan',    domain: 'umich.edu' },
  { name: 'Northeastern',             domain: 'northeastern.edu' },
  { name: 'Georgia Tech',             domain: 'gatech.edu' },
  { name: 'University of Washington', domain: 'washington.edu' },
  { name: 'Boston University',        domain: 'bu.edu' },
  { name: 'Carnegie Mellon',          domain: 'cmu.edu' },
  { name: 'UT Austin',                domain: 'utexas.edu' },
  { name: 'USC',                       domain: 'usc.edu' },
  { name: 'University of Illinois',   domain: 'illinois.edu' },
];

// Sources tried in order until one loads
const LOGO_SOURCES = (domain: string) => [
  `https://img.logo.dev/${domain}?token=pk_free&size=128&format=png`,
  `https://logo.clearbit.com/${domain}?size=128`,
  `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
];

function UniversityLogo({ name, domain }: University) {
  const sources = LOGO_SOURCES(domain);
  const [srcIndex, setSrcIndex] = useState(0);
  const failed = srcIndex >= sources.length;

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div
        className="w-12 h-12 rounded-xl border flex items-center justify-center overflow-hidden"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--border-gray)' }}
      >
        {!failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sources[srcIndex]}
            alt={`${name} logo`}
            width={32}
            height={32}
            className="object-contain w-8 h-8"
            onError={() => setSrcIndex(i => i + 1)}
          />
        ) : (
          <span
            className="text-[11px] font-bold text-center px-1 leading-tight"
            style={{ color: 'var(--muted-text)' }}
          >
            {name.split(' ').map(w => w[0]).join('').slice(0, 3)}
          </span>
        )}
      </div>
      <span
        className="text-center leading-tight"
        style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted-text)' }}
      >
        {name}
      </span>
    </div>
  );
}

export function UniversitiesSection() {
  return (
    <section className="py-16 w-full">
      <div className="max-w-3xl mx-auto px-6">
        {/* Label */}
        <p
          className="text-center mb-10"
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}
        >
          Trusted by students at
        </p>

        {/* Grid */}
        <AnimatedGroup
          preset="blur-slide"
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-6 gap-y-8 [&:hover>*]:opacity-40 [&:hover>*:hover]:opacity-100"
        >
          {universities.map((uni) => (
            <motion.div
              key={uni.name}
              className="flex justify-center transition-opacity duration-200"
              whileHover={{ scale: 1.06 }}
              transition={{ type: 'tween', duration: 0.15 }}
            >
              <UniversityLogo {...uni} />
            </motion.div>
          ))}
        </AnimatedGroup>

        {/* Legal disclaimer */}
        <p
          className="text-center mt-8"
          style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5 }}
        >
          Based on user sign-ups. Applyd is not affiliated with or endorsed by these institutions.
        </p>
      </div>
    </section>
  );
}
