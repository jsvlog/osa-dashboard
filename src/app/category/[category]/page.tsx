import { createClient } from '@/lib/supabase/server';
import type { ReportCategory } from '@/lib/types';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/lib/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ReportRow {
  id: string;
  title: string;
  deadline_date: string;
  teams: {
    teamNumber: number;
    submitted: boolean;
    submittedAt: string | null;
    isLate: boolean;
  }[];
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  // Validate category
  if (!CATEGORY_ORDER.includes(category as ReportCategory)) {
    notFound();
  }

  const supabase = await createClient();
  const categoryLabel = CATEGORY_LABELS[category as ReportCategory];
  const now = new Date();

  let templates: any[] = [];
  let submissions: any[] = [];
  try {
    const [tRes, sRes] = await Promise.all([
      supabase.from('report_templates').select('*').eq('category', category).order('deadline_date', { ascending: true }),
      supabase.from('submissions').select('*'),
    ]);
    templates = tRes.data || [];
    submissions = sRes.data || [];
  } catch (e) {
    console.error(e);
  }

  // Build report rows
  const rows: ReportRow[] = templates.map((tpl) => {
    const deadline = new Date(tpl.deadline_date);
    const teams = [1, 2, 3, 4].map((tn) => {
      const sub = submissions.find(
        (s: any) => s.report_template_id === tpl.id && s.team_number === tn
      );
      return {
        teamNumber: tn,
        submitted: !!sub,
        submittedAt: sub?.submitted_at || null,
        isLate: !sub && deadline < now,
      };
    });
    return {
      id: tpl.id,
      title: tpl.title,
      deadline_date: tpl.deadline_date,
      teams,
    };
  });

  // Compute per-team stats
  const teamStats = [1, 2, 3, 4].map((tn) => {
    const submitted = rows.filter((r) => r.teams.find((t) => t.teamNumber === tn)?.submitted).length;
    const late = rows.filter((r) => r.teams.find((t) => t.teamNumber === tn)?.isLate).length;
    const total = rows.length;
    return { teamNumber: tn, submitted, late, total, pct: total > 0 ? Math.round((submitted / total) * 100) : 0 };
  });

  const categoryIcons: Record<string, string> = {
    monthly: '📅',
    quarterly: '📊',
    semestral: '📋',
    annual: '🏆',
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #162d54 50%, #0f2240 100%)' }}>
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition mb-6">
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-3xl">{categoryIcons[category]}</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{categoryLabel} Reports</h1>
            <p className="text-sm text-slate-400">{templates.length} report templates · {submissions.length} submissions</p>
          </div>
        </div>

        {/* Team progress bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {teamStats.map((ts) => (
            <div key={ts.teamNumber} className="glass-card p-4 text-center">
              <div className="text-sm font-semibold text-white mb-2">Team {ts.teamNumber}</div>
              <div className="text-2xl font-bold text-blue-300 mb-1">{ts.pct}%</div>
              <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${ts.pct}%`,
                    background: ts.pct === 100 ? '#34d399' : ts.pct >= 50 ? '#60a5fa' : '#f59e0b',
                  }}
                />
              </div>
              <div className="text-xs text-slate-400">
                {ts.submitted}/{ts.total} submitted
                {ts.late > 0 && <span className="text-red-400 ml-1">· {ts.late} late</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Submission table */}
        {rows.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <span className="text-4xl block mb-3">📝</span>
            <p className="text-slate-400">No report templates in this category yet.</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            {/* Responsive table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-4 px-4 font-semibold text-slate-300">Report Title</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-300 whitespace-nowrap">Deadline</th>
                    <th className="text-center py-4 px-3 font-semibold text-slate-300">Team 1</th>
                    <th className="text-center py-4 px-3 font-semibold text-slate-300">Team 2</th>
                    <th className="text-center py-4 px-3 font-semibold text-slate-300">Team 3</th>
                    <th className="text-center py-4 px-3 font-semibold text-slate-300">Team 4</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const deadlineDate = new Date(row.deadline_date);
                    const isPast = deadlineDate < now;
                    return (
                      <tr key={row.id} className="border-b border-slate-700/30 hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-white">{row.title}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isPast ? 'bg-slate-700/50 text-slate-400' : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          }`}>
                            {deadlineDate.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </td>
                        {row.teams.map((team) => (
                          <td key={team.teamNumber} className="py-3.5 px-3 text-center">
                            {team.submitted ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                                ✓ Submitted
                              </span>
                            ) : team.isLate ? (
                              <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20">
                                ⚠ Late
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-700/30 px-2 py-1 rounded-full border border-slate-600/30">
                                — Pending
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 px-4 py-3 border-t border-slate-700/30">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/40" /> Submitted
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500/40" /> Late (past deadline)
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-3 h-3 rounded-full bg-slate-700/50 border border-slate-600/40" /> Pending
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 py-6 border-t border-slate-700/30">
          <p className="text-xs text-slate-600">OSA Office · Document Tracking System</p>
        </footer>
      </main>
    </div>
  );
}
