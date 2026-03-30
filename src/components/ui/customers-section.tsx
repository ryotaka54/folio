'use client';

import { motion } from 'framer-motion';
import { AnimatedGroup } from '@/components/ui/animated-group';

interface University {
  name: string;
}

const universities: University[] = [
  { name: 'UCLA' },
  { name: 'NYU' },
  { name: 'UC Berkeley' },
  { name: 'University of Michigan' },
  { name: 'Northeastern' },
  { name: 'Georgia Tech' },
  { name: 'University of Washington' },
  { name: 'Boston University' },
  { name: 'Carnegie Mellon' },
  { name: 'UT Austin' },
  { name: 'USC' },
  { name: 'University of Illinois' },
];

export function UniversitiesSection() {
  return (
    <section className="py-16 w-full">
      <div className="max-w-3xl mx-auto px-6">
        {/* Label */}
        <p
          className="text-center mb-8"
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}
        >
          Applyd is used by students at
        </p>

        {/* Grid with blur-out hover */}
        <AnimatedGroup
          preset="blur-slide"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-3 [&:hover>*]:opacity-40 [&:hover>*:hover]:opacity-100"
        >
          {universities.map((uni) => (
            <motion.div
              key={uni.name}
              className="w-full transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'tween', duration: 0.15 }}
            >
              <div
                className="w-full text-center rounded-lg border transition-colors duration-150 cursor-default"
                style={{
                  padding: '10px 16px',
                  background: 'var(--surface-gray)',
                  borderColor: 'var(--border-gray)',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--brand-navy)',
                  lineHeight: 1.4,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-emphasis)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-gray)';
                }}
              >
                {uni.name}
              </div>
            </motion.div>
          ))}
        </AnimatedGroup>

        {/* Legal disclaimer */}
        <p
          className="text-center mt-5"
          style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5 }}
        >
          Based on user sign-ups. Applyd is not affiliated with or endorsed by these institutions.
        </p>
      </div>
    </section>
  );
}
