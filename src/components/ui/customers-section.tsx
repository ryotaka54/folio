'use client';

import { motion } from 'framer-motion';
import { AnimatedGroup } from '@/components/ui/animated-group';

interface University {
  name: string;
  abbr: string;
  color: string;
}

const universities: University[] = [
  { name: 'UCLA',                      abbr: 'UCLA',  color: '#2774AE' },
  { name: 'NYU',                        abbr: 'NYU',   color: '#57068C' },
  { name: 'UC Berkeley',               abbr: 'UCB',   color: '#003262' },
  { name: 'University of Michigan',    abbr: 'UMich', color: '#00274C' },
  { name: 'Northeastern',             abbr: 'NEU',   color: '#CC0000' },
  { name: 'Georgia Tech',             abbr: 'GT',    color: '#003057' },
  { name: 'Univ. of Washington',      abbr: 'UW',    color: '#4B2E83' },
  { name: 'Boston University',        abbr: 'BU',    color: '#CC0000' },
  { name: 'Carnegie Mellon',          abbr: 'CMU',   color: '#C41230' },
  { name: 'UT Austin',                abbr: 'UT',    color: '#BF5700' },
  { name: 'USC',                       abbr: 'USC',   color: '#990000' },
  { name: 'Univ. of Illinois',        abbr: 'UIUC',  color: '#E84A27' },
];

function UniversityLogo({ name, abbr, color }: University) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: color + '18', border: `1px solid ${color}30` }}
      >
        <span
          className="font-bold leading-none text-center"
          style={{
            color,
            fontSize: abbr.length <= 2 ? 15 : abbr.length === 3 ? 12 : 10,
            letterSpacing: '-0.02em',
          }}
        >
          {abbr}
        </span>
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
