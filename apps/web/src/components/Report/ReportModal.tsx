/**
 * ReportModal — Focus Report dialog.
 *
 * Pure presentation shell. Data fetching lives in `useReportData`,
 * print/PDF generation in `printReport.ts`, and each visual section
 * is a sibling component in this folder.
 */
import { useState } from 'react';
import { X, FileText, Printer } from 'lucide-react';
import { REPORT_PERIODS } from '../../lib/constants';
import { useReportData } from './useReportData';
import { printReport } from './printReport';
import { ScoreAndStats } from './ScoreAndStats';
import { SkillDistribution } from './SkillDistribution';
import { WeeklyTrend } from './WeeklyTrend';
import { GroupComparison } from './GroupComparison';
import type { ReportPeriod } from './types';

interface ReportModalProps {
  isOpen:  boolean;
  onClose: () => void;
}

export function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const [period, setPeriod] = useState<ReportPeriod>('30d');
  const { data, loading } = useReportData(period, isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* ── Header bar ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-accent" />
            <h2 className="text-text-primary font-semibold text-lg">Focus Report</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Period selector */}
            <div className="flex bg-bg-elevated border border-border rounded-lg overflow-hidden">
              {REPORT_PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    period === p.value
                      ? 'bg-accent text-white'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {p.value}
                </button>
              ))}
            </div>

            {/* Print button */}
            <button
              onClick={() => data && printReport(data, period)}
              disabled={!data || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-light
                         text-white text-xs font-medium transition-colors disabled:opacity-40"
            >
              <Printer size={13} />
              Print PDF
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-bg-elevated transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data ? null : (
            <div className="space-y-6">
              <ScoreAndStats data={data} />

              <div className="grid grid-cols-2 gap-5">
                <SkillDistribution skills={data.skillBreakdown} />
                <WeeklyTrend       weeks={data.weeklyTrend} />
              </div>

              <GroupComparison members={data.groupComparison} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
