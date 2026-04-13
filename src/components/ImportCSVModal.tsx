'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Check, AlertCircle, FileText } from 'lucide-react';
import type { PipelineStage, Category } from '@/lib/types';
import { INTERNSHIP_STAGES, JOB_STAGES } from '@/lib/constants';

interface ImportRow {
  company: string;
  role: string;
  location: string;
  category: Category | '';
  status: PipelineStage;
  deadline: string | null;
  job_link: string;
  notes: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (rows: ImportRow[]) => Promise<void>;
  stages: PipelineStage[];
}

const ALL_STAGES = [...new Set([...INTERNSHIP_STAGES, ...JOB_STAGES])] as PipelineStage[];

const VALID_CATEGORIES = new Set<string>([
  'Engineering', 'Product Management', 'Design', 'Data Science', 'Finance',
  'Accounting', 'Consulting', 'Marketing', 'Sales & Business Development',
  'Human Resources', 'Operations', 'Supply Chain', 'Research & Policy',
  'Communications & PR', 'Legal', 'Healthcare & Life Sciences', 'Other',
]);

function normalizeStatus(raw: string, stages: PipelineStage[]): PipelineStage {
  const lower = raw.toLowerCase().trim();
  // Exact match on user's stages first
  const exact = stages.find(s => s.toLowerCase() === lower);
  if (exact) return exact;
  // Fuzzy match
  if (/wish|save|watch/.test(lower)) return stages.includes('Wishlist' as PipelineStage) ? 'Wishlist' : stages[0];
  if (/appli/.test(lower)) return 'Applied' as PipelineStage;
  if (/oa|online|assess/.test(lower)) return 'OA / Online Assessment' as PipelineStage;
  if (/phone|screen|recruit/.test(lower)) return stages.includes('Phone / Recruiter Screen' as PipelineStage) ? 'Phone / Recruiter Screen' : 'Recruiter Screen' as PipelineStage;
  if (/technical|case|interview/.test(lower)) return stages.includes('Technical / Case Interview' as PipelineStage) ? 'Technical / Case Interview' : 'OA / Online Assessment' as PipelineStage;
  if (/final/.test(lower)) return stages.includes('Final Round Interviews' as PipelineStage) ? 'Final Round Interviews' : 'Final Round' as PipelineStage;
  if (/offer|negot/.test(lower)) return stages.includes('Offer — Negotiating' as PipelineStage) ? 'Offer — Negotiating' : 'Offer' as PipelineStage;
  if (/accept/.test(lower)) return stages.includes('Accepted' as PipelineStage) ? 'Accepted' : stages[stages.length - 1];
  if (/reject|declined|passed/.test(lower)) return stages.includes('Rejected' as PipelineStage) ? 'Rejected' : 'Declined' as PipelineStage;
  return stages[0];
}

function parseDate(raw: string): string | null {
  if (!raw || raw.trim() === '') return null;
  const d = new Date(raw.trim());
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

function parseCSV(text: string, stages: PipelineStage[]): ImportRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Normalize header names
  const headers = lines[0].split(',').map(h =>
    h.replace(/^["']|["']$/g, '').trim().toLowerCase()
      .replace(/\s+/g, '_')
  );

  const colIdx = (names: string[]): number => {
    for (const n of names) {
      const i = headers.indexOf(n);
      if (i !== -1) return i;
    }
    return -1;
  };

  const col = {
    company:  colIdx(['company', 'company_name', 'employer', 'organization']),
    role:     colIdx(['role', 'position', 'title', 'job_title']),
    location: colIdx(['location', 'city', 'place']),
    category: colIdx(['category', 'type', 'field', 'industry']),
    status:   colIdx(['status', 'stage', 'state']),
    deadline: colIdx(['deadline', 'due', 'due_date', 'apply_by']),
    job_link: colIdx(['link', 'url', 'job_link', 'job_url', 'posting']),
    notes:    colIdx(['notes', 'note', 'comments', 'memo']),
  };

  const rows: ImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim()) continue;

    // Simple CSV parse (handles quoted fields)
    const cells: string[] = [];
    let cur = '';
    let inQ = false;
    for (let c = 0; c < raw.length; c++) {
      const ch = raw[c];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    cells.push(cur.trim());

    const get = (idx: number) => (idx !== -1 ? (cells[idx] ?? '').replace(/^["']|["']$/g, '').trim() : '');

    const company = get(col.company);
    if (!company) continue; // skip empty rows

    const rawCategory = get(col.category);
    const category: Category | '' = VALID_CATEGORIES.has(rawCategory) ? rawCategory as Category : '';

    rows.push({
      company,
      role: get(col.role) || 'Unknown Role',
      location: get(col.location),
      category,
      status: col.status !== -1 ? normalizeStatus(get(col.status), stages) : stages[0],
      deadline: parseDate(get(col.deadline)),
      job_link: get(col.job_link),
      notes: get(col.notes),
    });
  }

  return rows;
}

export default function ImportCSVModal({ open, onClose, onImport, stages }: Props) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => { setRows([]); setError(''); setDone(false); };

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please upload a .csv file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text, stages);
        if (parsed.length === 0) {
          setError('No valid rows found. Make sure your CSV has a "Company" column.');
          return;
        }
        setRows(parsed);
        setError('');
      } catch {
        setError('Could not parse the file. Please check the format.');
      }
    };
    reader.readAsText(file);
  }, [stages]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = async () => {
    setImporting(true);
    try {
      await onImport(rows);
      setDone(true);
    } catch {
      setError('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => { reset(); onClose(); };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--background)', border: '1px solid var(--border-gray)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-gray)' }}>
          <div className="flex items-center gap-2">
            <FileText size={16} style={{ color: 'var(--accent-blue)' }} />
            <span className="text-[14px] font-semibold" style={{ color: 'var(--brand-navy)' }}>Import from CSV</span>
          </div>
          <button onClick={handleClose} className="text-muted-text hover:text-body-text transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {done ? (
            /* Success state */
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(22,163,74,0.12)' }}>
                <Check size={22} style={{ color: 'var(--green-success)' }} />
              </div>
              <p className="text-[14px] font-semibold" style={{ color: 'var(--brand-navy)' }}>
                {rows.length} application{rows.length !== 1 ? 's' : ''} imported!
              </p>
              <button onClick={handleClose} className="text-[13px] font-medium px-4 py-2 rounded-lg text-white" style={{ background: 'var(--accent-blue)' }}>
                Done
              </button>
            </div>
          ) : rows.length === 0 ? (
            /* Upload zone */
            <div>
              <div
                className="relative rounded-xl border-2 border-dashed flex flex-col items-center gap-3 py-10 cursor-pointer transition-colors"
                style={{
                  borderColor: dragging ? 'var(--accent-blue)' : 'var(--border-emphasis)',
                  background: dragging ? 'rgba(37,99,235,0.04)' : 'var(--surface-gray)',
                }}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                <Upload size={24} style={{ color: dragging ? 'var(--accent-blue)' : 'var(--muted-text)' }} />
                <div className="text-center">
                  <p className="text-[13px] font-medium" style={{ color: 'var(--brand-navy)' }}>
                    Drop a CSV file here, or <span style={{ color: 'var(--accent-blue)' }}>click to browse</span>
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Columns: Company, Role, Location, Status, Deadline, Notes, Link
                  </p>
                </div>
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>

              {error && (
                <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg" style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)' }}>
                  <AlertCircle size={13} style={{ color: 'var(--error-text)', flexShrink: 0 }} />
                  <p className="text-[12px]" style={{ color: 'var(--error-text)' }}>{error}</p>
                </div>
              )}

              {/* Template hint */}
              <p className="text-center text-[11px] mt-4" style={{ color: 'var(--text-tertiary)' }}>
                Works with Google Sheets, Notion, or any tracker export. The only required column is <strong>Company</strong>.
              </p>
            </div>
          ) : (
            /* Preview table */
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-medium" style={{ color: 'var(--brand-navy)' }}>
                  {rows.length} application{rows.length !== 1 ? 's' : ''} ready to import
                </p>
                <button onClick={reset} className="text-[11px]" style={{ color: 'var(--muted-text)' }}>
                  Change file
                </button>
              </div>

              <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-gray)' }}>
                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-[11px] border-collapse">
                    <thead>
                      <tr style={{ background: 'var(--surface-gray)', position: 'sticky', top: 0 }}>
                        {['Company', 'Role', 'Status', 'Deadline'].map(h => (
                          <th key={h} className="text-left px-3 py-2 font-semibold border-b" style={{ color: 'var(--muted-text)', borderColor: 'var(--border-gray)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-gray)' }}>
                          <td className="px-3 py-2 font-medium" style={{ color: 'var(--brand-navy)' }}>{row.company}</td>
                          <td className="px-3 py-2" style={{ color: 'var(--muted-text)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.role}</td>
                          <td className="px-3 py-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: 'var(--light-accent)', color: 'var(--accent-blue-text)' }}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-3 py-2" style={{ color: 'var(--muted-text)' }}>{row.deadline ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg" style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)' }}>
                  <AlertCircle size={13} style={{ color: 'var(--error-text)', flexShrink: 0 }} />
                  <p className="text-[12px]" style={{ color: 'var(--error-text)' }}>{error}</p>
                </div>
              )}

              <div className="flex gap-2 mt-4 justify-end">
                <button onClick={handleClose} className="text-[13px] font-medium px-4 py-2 rounded-lg border transition-colors hover:opacity-80" style={{ borderColor: 'var(--border-gray)', color: 'var(--muted-text)' }}>
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="text-[13px] font-medium px-4 py-2 rounded-lg text-white transition-opacity disabled:opacity-60"
                  style={{ background: 'var(--accent-blue)' }}
                >
                  {importing ? 'Importing…' : `Import ${rows.length} application${rows.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
