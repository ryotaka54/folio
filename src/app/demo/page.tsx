'use client';

import { useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DemoScene from './DemoScene';

export default function DemoPage() {
  return (
    <Suspense>
      <DemoPageInner />
    </Suspense>
  );
}

function DemoPageInner() {
  const searchParams = useSearchParams();
  const variant = (searchParams.get('variant') ?? 'full') as 'full' | 'short' | 'extension' | 'japan';
  return <DemoScene variant={variant} />;
}
