/**
 * printReport — opens a new window with a print-styled HTML document
 * and triggers the system print dialog. Used for "Print PDF" export.
 */
import { format, parseISO } from 'date-fns';
import { REPORT_PERIODS } from '../../lib/constants';
import type { ReportData, ReportPeriod } from './types';

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function countActiveDays(data: ReportData): number {
  const s = new Set<string>();
  for (const r of data.sessions) s.add(format(parseISO(r.started_at), 'yyyy-MM-dd'));
  return s.size;
}

export function printReport(data: ReportData, period: ReportPeriod): void {
  const periodLabel   = REPORT_PERIODS.find((p) => p.value === period)?.label ?? '';
  const generatedDate = format(new Date(), 'MMMM d, yyyy');
  const gc = data.gradeColor;

  const skillBars = data.skillBreakdown.slice(0, 8).map((s) => `
    <div style="margin-bottom:11px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-size:13px;color:#1a1a3e;font-weight:500;">${escHtml(s.name)}</span>
        <span style="font-size:12px;color:#555;font-weight:600;">${(s.seconds / 3600).toFixed(1)}h · ${s.pct.toFixed(0)}%</span>
      </div>
      <div style="height:8px;background:#e8e8f4;border-radius:4px;overflow:hidden;">
        <div style="height:100%;width:${s.pct.toFixed(1)}%;background:${s.color};border-radius:4px;"></div>
      </div>
    </div>
  `).join('');

  const maxWeekH = Math.max(...data.weeklyTrend.map((w) => w.hours), 0.1);
  const weekRows = data.weeklyTrend.map((w) => `
    <tr>
      <td style="padding:7px 12px;font-size:13px;color:#333;">${escHtml(w.label)}</td>
      <td style="padding:7px 12px;text-align:right;font-size:13px;font-weight:600;color:#1a1a3e;">${w.hours.toFixed(1)}h</td>
      <td style="padding:7px 12px;width:120px;">
        <div style="height:6px;background:#e8e8f4;border-radius:3px;overflow:hidden;">
          <div style="height:100%;width:${((w.hours / maxWeekH) * 100).toFixed(1)}%;background:#7c6cf0;border-radius:3px;"></div>
        </div>
      </td>
    </tr>
  `).join('');

  const groupRows = data.groupComparison.map((m, i) => `
    <tr style="${m.isMe ? 'background:#f0eeff;' : ''}">
      <td style="padding:7px 12px;font-size:13px;color:#888;">#${i + 1}</td>
      <td style="padding:7px 12px;font-size:13px;font-weight:${m.isMe ? 700 : 400};color:${m.isMe ? '#7c6cf0' : '#333'};">${escHtml(m.label)}</td>
      <td style="padding:7px 12px;text-align:right;font-size:13px;font-weight:600;color:#1a1a3e;">${m.hours.toFixed(1)}h</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>tenK Focus Report — ${escHtml(periodLabel)}</title>
<style>
@page{size:A4 portrait;margin:14mm 12mm}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a3e;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:14px;border-bottom:2px solid #e8e8f4;margin-bottom:18px}
.logo{font-size:26px;font-weight:900;color:#7c6cf0;letter-spacing:-1px}
.report-meta{font-size:12px;color:#999;margin-top:3px}
.date-info{font-size:11px;color:#bbb;text-align:right;line-height:1.6}
.hero{display:flex;gap:16px;margin-bottom:18px;align-items:stretch}
.score-box{display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f8f8ff;border:1px solid #e8e8f4;border-radius:14px;padding:18px 28px;min-width:150px}
.score-num{font-size:52px;font-weight:900;color:${gc};line-height:1}
.score-grade{font-size:18px;font-weight:700;color:${gc};margin-top:2px}
.score-lbl{font-size:10px;color:#aaa;margin-top:3px;letter-spacing:.5px;text-transform:uppercase}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;flex:1}
.stat{background:#f8f8ff;border:1px solid #e8e8f4;border-radius:10px;padding:12px 14px}
.stat-val{font-size:20px;font-weight:800;color:#1a1a3e}
.stat-lbl{font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:.4px;margin-top:3px}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px}
.section-title{font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid #e8e8f4}
table{width:100%;border-collapse:collapse}
th{text-align:left;font-size:10px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:.4px;padding:7px 12px;background:#f8f8ff;border-bottom:1px solid #e8e8f4}
tr:nth-child(even){background:#fafafe}
.footer{margin-top:16px;padding-top:10px;border-top:1px solid #e8e8f4;display:flex;justify-content:space-between;font-size:10px;color:#ccc}
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo">tenK</div>
    <div class="report-meta">Focus Report · ${escHtml(periodLabel)}</div>
  </div>
  <div class="date-info">Generated ${escHtml(generatedDate)}</div>
</div>

<div class="hero">
  <div class="score-box">
    <div class="score-num">${data.focusScore}</div>
    <div class="score-grade">Grade ${data.focusGrade}</div>
    <div class="score-lbl">Focus Score</div>
  </div>
  <div class="stats">
    <div class="stat"><div class="stat-val">${data.totalHours.toFixed(1)}h</div><div class="stat-lbl">Total Study</div></div>
    <div class="stat"><div class="stat-val">${data.totalSessions}</div><div class="stat-lbl">Sessions</div></div>
    <div class="stat"><div class="stat-val">${data.avgDailyHours.toFixed(1)}h</div><div class="stat-lbl">Avg / Day</div></div>
    <div class="stat"><div class="stat-val">${data.consistencyPct}%</div><div class="stat-lbl">Consistency</div></div>
    <div class="stat"><div class="stat-val">${data.longestStreak}d</div><div class="stat-lbl">Best Streak</div></div>
    <div class="stat"><div class="stat-val">${data.avgSessionMin}m</div><div class="stat-lbl">Avg Session</div></div>
    <div class="stat"><div class="stat-val">${data.skillBreakdown.length}</div><div class="stat-lbl">Skills</div></div>
    <div class="stat"><div class="stat-val">${countActiveDays(data)}d</div><div class="stat-lbl">Active Days</div></div>
  </div>
</div>

<div class="two-col">
  <div>
    <div class="section-title">Skill Distribution</div>
    ${skillBars || '<p style="font-size:13px;color:#bbb;">No sessions recorded.</p>'}
  </div>
  <div>
    <div class="section-title">Weekly Trend</div>
    ${data.weeklyTrend.length > 0
      ? `<table><thead><tr><th>Week</th><th style="text-align:right">Hours</th><th></th></tr></thead><tbody>${weekRows}</tbody></table>`
      : '<p style="font-size:13px;color:#bbb;">No data.</p>'
    }
  </div>
</div>

${data.groupComparison.length > 0 ? `
<div>
  <div class="section-title">Group Comparison</div>
  <table>
    <thead><tr><th>#</th><th>Member</th><th style="text-align:right">Hours</th></tr></thead>
    <tbody>${groupRows}</tbody>
  </table>
</div>
` : ''}

<div class="footer">
  <span>tenK — 10,000 Hour Mastery Tracker</span>
  <span>Powered by focus &amp; consistency</span>
</div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=820,height=1000');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 600);
}
