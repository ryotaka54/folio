'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { GraduationCap } from 'lucide-react';

interface University {
  name: string;
  abbr: string;
  logo: string;
  color: string;
}

const universities: University[] = [
  { name: 'UCLA',                   abbr: 'UCLA',  logo: '/universities/ucla.svg',         color: '#2774AE' },
  { name: 'NYU',                    abbr: 'NYU',   logo: '/universities/nyu.svg',          color: '#57068C' },
  { name: 'UC Berkeley',            abbr: 'UCB',   logo: '/universities/uc-berkeley.svg',  color: '#003262' },
  { name: 'University of Michigan', abbr: 'UMich', logo: '/universities/umich.svg',        color: '#00274C' },
  { name: 'Northeastern',           abbr: 'NEU',   logo: '/universities/northeastern.png', color: '#C8102E' },
  { name: 'Georgia Tech',           abbr: 'GT',    logo: '/universities/georgia-tech.svg', color: '#B3A369' },
  { name: 'Univ. of Washington',    abbr: 'UW',    logo: '/universities/uw.svg',           color: '#4B2E83' },
  { name: 'Boston University',      abbr: 'BU',    logo: '/universities/bu.svg',           color: '#CC0000' },
  { name: 'Carnegie Mellon',        abbr: 'CMU',   logo: '/universities/cmu.svg',          color: '#C41230' },
  { name: 'UT Austin',              abbr: 'UT',    logo: '/universities/ut-austin.svg',    color: '#BF5700' },
  { name: 'USC',                    abbr: 'USC',   logo: '/universities/usc.svg',          color: '#990000' },
  { name: 'Univ. of Illinois',      abbr: 'UIUC',  logo: '/universities/uiuc.svg',         color: '#E84A27' },
];

type Tier = 'img' | 'badge' | 'icon';

function UniversityLogo({ name, abbr, logo, color }: University) {
  const [tier, setTier] = useState<Tier>('img');

  // CMU is a custom badge SVG — render it directly without the white container
  const isCustomBadge = logo.endsWith('cmu.svg');

  if (tier === 'img') {
    if (isCustomBadge) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={`${name} logo`}
          width={64}
          height={64}
          style={{ width: 64, height: 64, borderRadius: 14, display: 'block', flexShrink: 0 }}
          onError={() => setTier('badge')}
        />
      );
    }

    return (
      <div
        style={{
          width: 64, height: 64, borderRadius: 14, flexShrink: 0,
          background: '#F8F8F8',
          border: '1px solid rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 8, boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt={`${name} logo`}
          width={48}
          height={48}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          onError={() => setTier('badge')}
        />
      </div>
    );
  }

  if (tier === 'badge') {
    return (
      <div
        style={{
          width: 64, height: 64, borderRadius: 14,
          background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#fff', fontWeight: 700, fontSize: abbr.length <= 2 ? 18 : abbr.length === 3 ? 15 : 12, letterSpacing: '-0.02em', lineHeight: 1 }}>
          {abbr}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{ width: 64, height: 64, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      className="bg-surface-gray"
    >
      <GraduationCap size={28} style={{ color: 'var(--text-tertiary)' }} />
    </div>
  );
}

function UniversityItem(uni: University) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <UniversityLogo {...uni} />
      <span
        className="text-center leading-tight"
        style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted-text)' }}
      >
        {uni.name}
      </span>
    </div>
  );
}

export function UniversitiesSection() {
  return (
    <section className="py-16 w-full">
      <div className="max-w-3xl mx-auto px-6">
        <p
          className="text-center mb-10"
          style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}
        >
          Trusted by students at
        </p>

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
              <UniversityItem {...uni} />
            </motion.div>
          ))}
        </AnimatedGroup>

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
