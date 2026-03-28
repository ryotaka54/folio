'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Application } from './types';

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  demoApplications: Application[];
  start: (demos?: Application[]) => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  goToStep: (step: number) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [demoApplications, setDemoApplications] = useState<Application[]>([]);

  const start = useCallback((demos?: Application[]) => {
    setDemoApplications(demos ?? []);
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const next = useCallback(() => {
    setCurrentStep(prev => prev + 1);
  }, []);

  const prev = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  const skip = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    setDemoApplications([]);
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
    setIsActive(true);
  }, []);

  return (
    <TutorialContext.Provider value={{ isActive, currentStep, demoApplications, start, next, prev, skip, goToStep }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorial must be used within TutorialProvider');
  return ctx;
}
