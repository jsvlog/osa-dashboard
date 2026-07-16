import { createClient } from '@/lib/supabase/server';
import type { ReportCategory } from '@/lib/types';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/lib/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TeamRace } from '@/components/TeamRace';

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

  // Determine upcoming deadlines (next 7 days)
  const upcomingReports = rows
    .filter((r) => {
      const d = new Date(r.deadline_date);
      const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    })
    .sort((a, b) => new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime());

  const overdueReports = rows.filter((r) => {
    const d = new Date(r.deadline_date);
    return d < now && r.teams.some((t) => !t.submitted);
  });

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #162d54 50%, #0f2240 100%)' }}>
      {/* Background orbs */}
      <div className="fixed top-10 right-20 w-80 h-80 rounded-full opacity-[0.04] pointer-events-none" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', filter: 'blur(60px)' }} />
      <div className="fixed bottom-20 left-10 w-96 h-96 rounded-full opacity-[0.04] pointer-events-none" style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', filter: 'blur(80px)' }} />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition mb-6 group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 fade-in-up">
          <span className="text-3xl">{categoryIcons[category]}</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{categoryLabel} Reports</h1>
            <p className="text-sm text-slate-400">{templates.length} report templates · {submissions.length} submissions</p>
          </div>
        </div>

        {/* Urgency banners */}
        {(overdueReports.length > 0 || upcomingReports.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 fade-in-up" style={{ animationDelay: '0.1s' }}>
            {overdueReports.length > 0 && (
              <div className="glass-card p-4 border-red-500/30 flex items-center gap-3">
                <span className="text-2xl">🚨</span>
                <div>
                  <div className="text-sm font-bold text-red-300">{overdueReports.length} Overdue Report{overdueReports.length > 1 ? 's' : ''}</div>
                  <div className="text-xs text-slate-400">Past deadline — needs immediate action</div>
                </div>
              </div>
            )}
            {upcomingReports.length > 0 && (
              <div className="glass-card p-4 border-amber-500/30 flex items-center gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <div className="text-sm font-bold text-amber-300">{upcomingReports.length} Due This Week</div>
                  <div className="text-xs text-slate-400">
                    Next: {upcomingReports[0]?.title} — {new Date(upcomingReports[0]?.deadline_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Team Race Visualization */}
        {rows.length > 0 && (
          <TeamRace
            teams={teamStats.map((ts) => ({
              teamNumber: ts.teamNumber,
              submitted: ts.submitted,
              late: ts.late,
              total: ts.total,
              pct: ts.pct,
            }))}
            categoryLabel={categoryLabel}
          />
        )}

        {/* Team progress cards (compact) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {teamStats.map((ts, i) => {
            const isLeader = ts.pct === Math.max(...teamStats.map((t) => t.pct)) && ts.pct > 0;
            const isLagging = ts.pct === Math.min(...teamStats.map((t) => t.pct)) && ts.pct < Math.max(...teamStats.map((t) => t.pct));
            return (
              <div
                key={ts.teamNumber}
                className={`glass-card p-4 text-center fade-in-up relative overflow-hidden ${isLeader ? 'border-blue-500/40' : ''}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {isLeader && (
                  <div className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    👑
                  </div>
                )}
                <div className="text-sm font-semibold text-white mb-2">Team {ts.teamNumber}</div>
                <div className="text-2xl font-bold text-blue-300 mb-1 count-up" style={{ animationDelay: `${i * 0.1 + 0.2}s` }}>{ts.pct}%</div>
                <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden mb-2 animated-bar">
                  <div
                    className="h-full rounded-full bar-fill transition-all"
                    style={{
                      width: `${ts.pct}%`,
                      background: ts.pct === 100 ? '#34d399' : ts.pct >= 50 ? '#60a5fa' : '#f59e0b',
                      animationDelay: `${i * 0.1 + 0.3}s`,
                    }}
                  />
                </div>
                <div className="text-xs text-slate-400">
                  {ts.submitted}/{ts.total} submitted
                  {ts.late > 0 && <span className="text-red-400 ml-1">· {ts.late} late</span>}
                </div>
                {isLagging && (
                  <div className="mt-1.5 text-[10px] text-amber-400 gap-pulse">
                    ⚡ {Math.max(...teamStats.map((t) => t.pct)) - ts.pct}% behind
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submission table */}
        {rows.length === 0 ? (
          <div className="glass-card p-12 text-center fade-in-up">
            <span className="text-4xl block mb-3">📝</span>
            <p className="text-slate-400">No report templates in this category yet.</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden fade-in-up" style={{ animationDelay: '0.3s' }}>
            {/* Responsive table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-4 px-4 font-semibold text-slate-300">Report Title</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-300 whitespace-nowrap">Deadline</th>
                    <th className="text-center py-4 px-3 font-semibold text-slate-300">
                      <span className="flex items-center justify-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Team 1
                      </span>
                    </th>
                    <th className="text-center py-4 px-3 font-semibold text-slate-300">
                      <span className="flex items-center justify-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Team 2
                      </span>
                    </th>
                    <th className="text-center py-4 px-3 font-semibold text-slate-300">
                      <span className="flex items-center justify-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" /> Team 3
                      </span>
                    </th>
                    <th className="text-center py-4 px-3 font-semibold text-slate-300">
                      <span className="flex items-center justify-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Team 4
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => {
                    const deadlineDate = new Date(row.deadline_date);
                    const isPast = deadlineDate < now;
                    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const isUrgent = diffDays >= 0 && diffDays <= 3;
                    const allSubmitted = row.teams.every((t) => t.submitted);
                    const noneSubmitted = row.teams.every((t) => !t.submitted);
                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-slate-700/30 hover:bg-slate-800/30 transition ${
                          allSubmitted ? 'opacity-60' : ''
                        } ${isUrgent && !allSubmitted ? 'bg-amber-500/[0.03]' : ''}`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-white flex items-center gap-2">
                            {allSubmitted && <span className="text-emerald-400 text-xs">✓</span>}
                            {isUrgent && !allSubmitted && <span className="text-amber-400 text-xs">⏰</span>}
                            {row.title}
                          </div>
                          {allSubmitted && (
                            <div className="text-[10px] text-emerald-400/60 mt-0.5">All teams submitted</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isPast
                              ? 'bg-slate-700/50 text-slate-400'
                              : isUrgent
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          }`}>
                            {deadlineDate.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {isUrgent && !isPast && (
                              <span className="ml-1 text-[10px]">({diffDays}d)</span>
                            )}
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
            <div className="flex items-center gap-6 px-4 py-3 border-t border-slate-700/30 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/40" /> Submitted
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500/40" /> Late (past deadline)
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-3 h-3 rounded-full bg-slate-700/50 border border-slate-600/40" /> Pending
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="text-amber-400">⏰</span> Due within 3 days
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="text-emerald-400">✓</span> All teams done
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
