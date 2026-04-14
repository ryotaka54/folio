'use client';

import { useState } from 'react';
import { InterviewStep } from '@/lib/types';
import { Plus, Trash2, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface InterviewTimelineProps {
  steps: InterviewStep[];
  onUpdate: (steps: InterviewStep[]) => void;
  isShuukatsu?: boolean;
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export default function InterviewTimeline({ steps, onUpdate, isShuukatsu = false }: InterviewTimelineProps) {
  const ja = isShuukatsu;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newStepName, setNewStepName] = useState('');

  const toggleComplete = (id: string) => {
    onUpdate(steps.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const addStep = () => {
    const name = newStepName.trim() || (ja ? '新しいステップ' : 'New Round');
    const step: InterviewStep = {
      id: generateId(),
      name,
      date: null,
      completed: false,
      notes: '',
    };
    onUpdate([...steps, step]);
    setNewStepName('');
  };

  const removeStep = (id: string) => {
    onUpdate(steps.filter(s => s.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const updateStep = (id: string, updates: Partial<InterviewStep>) => {
    onUpdate(steps.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    onUpdate(newSteps);
  };

  const completedCount = steps.filter(s => s.completed).length;

  return (
    <div className="border-t border-border-gray pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted-text)' }}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <h3 className="text-[13px] font-semibold" style={{ color: 'var(--brand-navy)', fontFamily: ja ? "'Noto Sans JP', sans-serif" : undefined }}>
            {ja ? '選考プロセス' : 'Interview Progress'}
          </h3>
          {steps.length > 0 && (
            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: 'var(--surface-gray)', color: 'var(--muted-text)' }}>
              {completedCount}/{steps.length}
            </span>
          )}
        </div>
      </div>

      {/* Timeline */}
      {steps.length > 0 && (
        <div className="relative ml-3 border-l-2 border-border-gray pl-4 space-y-0">
          {steps.map((step, index) => (
            <div key={step.id} className="relative pb-4 last:pb-0">
              {/* Dot on the timeline */}
              <button
                onClick={() => toggleComplete(step.id)}
                className="absolute -left-[calc(1rem+5px)] top-0.5 w-4 h-4 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{
                  backgroundColor: step.completed ? 'var(--green-success)' : 'var(--card-bg)',
                  border: step.completed ? 'none' : '2px solid var(--border-gray)',
                }}
                title={step.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {step.completed && <Check size={10} color="white" strokeWidth={3} />}
              </button>

              {/* Step content */}
              <div
                className="rounded-lg border border-border-gray p-2.5 cursor-pointer hover:border-accent-blue/30 transition-colors"
                style={{ background: 'var(--card-bg)' }}
                onClick={() => setExpandedId(expandedId === step.id ? null : step.id)}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-[13px] font-medium flex-1 truncate"
                    style={{
                      color: step.completed ? 'var(--muted-text)' : 'var(--brand-navy)',
                      textDecoration: step.completed ? 'line-through' : 'none',
                    }}
                  >
                    {step.name}
                  </span>
                  {step.date && (
                    <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--muted-text)' }}>
                      {new Date(step.date + 'T00:00:00').toLocaleDateString(ja ? 'ja-JP' : 'en-US', ja ? { month: 'numeric', day: 'numeric' } : { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {index > 0 && (
                      <button onClick={(e) => { e.stopPropagation(); moveStep(index, 'up'); }} className="p-0.5 rounded hover:bg-surface-gray transition-colors" style={{ color: 'var(--muted-text)' }}>
                        <ChevronUp size={12} />
                      </button>
                    )}
                    {index < steps.length - 1 && (
                      <button onClick={(e) => { e.stopPropagation(); moveStep(index, 'down'); }} className="p-0.5 rounded hover:bg-surface-gray transition-colors" style={{ color: 'var(--muted-text)' }}>
                        <ChevronDown size={12} />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); removeStep(step.id); }} className="p-0.5 rounded hover:bg-red-500/10 transition-colors" style={{ color: 'var(--muted-text)' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === step.id && (
                  <div className="mt-2.5 space-y-2 pt-2 border-t border-border-gray" style={{ fontFamily: ja ? "'Noto Sans JP', sans-serif" : undefined }} onClick={(e) => e.stopPropagation()}>
                    <div>
                      <label className="block text-[11px] font-medium mb-0.5" style={{ color: 'var(--muted-text)' }}>{ja ? 'ステップ名' : 'Name'}</label>
                      <input
                        type="text"
                        value={step.name}
                        onChange={(e) => updateStep(step.id, { name: e.target.value })}
                        className="w-full px-2 py-1.5 bg-background border border-border-gray rounded text-[13px] focus:outline-none focus:border-accent-blue transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-0.5" style={{ color: 'var(--muted-text)' }}>{ja ? '日付' : 'Date'}</label>
                      <input
                        type="date"
                        value={step.date || ''}
                        onChange={(e) => updateStep(step.id, { date: e.target.value || null })}
                        className="w-full px-2 py-1.5 bg-background border border-border-gray rounded text-[13px] focus:outline-none focus:border-accent-blue transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-0.5" style={{ color: 'var(--muted-text)' }}>{ja ? 'メモ' : 'Notes'}</label>
                      <input
                        type="text"
                        value={step.notes}
                        onChange={(e) => updateStep(step.id, { notes: e.target.value })}
                        placeholder={ja ? '例：集団面接、45分' : 'e.g. Behavioral + coding, 45 min'}
                        className="w-full px-2 py-1.5 bg-background border border-border-gray rounded text-[13px] focus:outline-none focus:border-accent-blue transition-colors placeholder:text-text-tertiary"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add step */}
      <div className="flex items-center gap-2 mt-3">
        <input
          type="text"
          value={newStepName}
          onChange={(e) => setNewStepName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStep(); } }}
          placeholder={ja ? '例：一次面接、グループ面接...' : 'e.g. Phone Screen, On-site...'}
          className="flex-1 px-2.5 py-1.5 bg-background border border-border-gray rounded-md text-[13px] focus:outline-none focus:border-accent-blue transition-colors placeholder:text-text-tertiary"
          style={{ fontFamily: ja ? "'Noto Sans JP', sans-serif" : undefined }}
        />
        <button
          onClick={addStep}
          className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium rounded-md border border-accent-blue/30 hover:bg-accent-blue/10 transition-colors"
          style={{ color: 'var(--accent-blue)', fontFamily: ja ? "'Noto Sans JP', sans-serif" : undefined }}
        >
          <Plus size={13} />
          {ja ? '追加' : 'Add'}
        </button>
      </div>
    </div>
  );
}
