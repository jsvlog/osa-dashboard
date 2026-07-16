import { createClient } from '@/lib/supabase/server';
import type { ReportCategory } from '@/lib/types';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/lib/types';
import Link from 'next/link';
import { TeamLeaderboard } from '@/components/TeamLeaderboard';

export const dynamic = 'force-dynamic';

interface CategorySummary {
  category: ReportCategory;
  totalReports: number;
  totalSubmissions: number;
  completionRate: number;
  lateCount: number;
  teamStats: { teamNumber: number; submitted: number; total: number; pct: number }[];
}

export default async function HomePage() {
  const supabase = await createClient();

  let templates: any[] = [];
  let submissions: any[] = [];
  try {
    const [tRes, sRes] = await Promise.all([
      supabase.from('report_templates').select('*').order('created_at', { ascending: false }),
      supabase.from('submissions').select('*'),
    ]);
    templates = tRes.data || [];
    submissions = sRes.data || [];
  } catch (e) {
    console.error(e);
  }

  const now = new Date();

  const summaries: CategorySummary[] = CATEGORY_ORDER.map((category) => {
    const catTemplates = templates.filter((t) => t.category === category);
    const totalReports = catTemplates.length;

    const catSubmissions = submissions.filter((s) => {
      const tpl = templates.find((t) => t.id === s.report_template_id);
      return tpl?.category === category;
    });

    const totalSubmissions = catSubmissions.length;
    const maxPossible = totalReports * 4; // 4 teams
    const completionRate = maxPossible > 0 ? Math.round((totalSubmissions / maxPossible) * 100) : 0;

    // Count late: deadline passed + not submitted
    let lateCount = 0;
    for (const tpl of catTemplates) {
      const deadline = new Date(tpl.deadline_date);
      if (deadline < now) {
        for (let tn = 1; tn <= 4; tn++) {
          const hasSubmitted = catSubmissions.some(
            (s) => s.report_template_id === tpl.id && s.team_number === tn
          );
          if (!hasSubmitted) lateCount++;
        }
      }
    }

    const teamStats = [1, 2, 3, 4].map((tn) => {
      const submitted = catSubmissions.filter((s) => {
        const tpl = templates.find((t) => t.id === s.report_template_id);
        return tpl?.category === category && s.team_number === tn;
      }).length;
      return { teamNumber: tn, submitted, total: totalReports, pct: totalReports > 0 ? Math.round((submitted / totalReports) * 100) : 0 };
    });

    return { category, totalReports, totalSubmissions, completionRate, lateCount, teamStats };
  });

  // Build overall team stats for leaderboard
  const totalReportsAll = summaries.reduce((s, c) => s + c.totalReports, 0);
  const teamOverall = [1, 2, 3, 4].map((tn) => {
    const totalSubmitted = summaries.reduce((s, c) => {
      const ts = c.teamStats.find((t) => t.teamNumber === tn);
      return s + (ts?.submitted || 0);
    }, 0);
    const totalPossible = totalReportsAll;
    const pct = totalPossible > 0 ? Math.round((totalSubmitted / totalPossible) * 100) : 0;

    // Count on-time vs late across all categories
    let onTimeCount = 0;
    let lateCount = 0;
    for (const cat of summaries) {
      const catTemplates = templates.filter((t) => t.category === cat.category);
      const catSubs = submissions.filter((s) => {
        const tpl = templates.find((t) => t.id === s.report_template_id);
        return tpl?.category === cat.category && s.team_number === tn;
      });
      for (const tpl of catTemplates) {
        const sub = catSubs.find((s) => s.report_template_id === tpl.id);
        const deadline = new Date(tpl.deadline_date);
        if (sub) {
          onTimeCount++;
        } else if (deadline < now) {
          lateCount++;
        }
      }
    }

    return { teamNumber: tn, totalSubmitted, totalPossible, pct, lateCount, onTimeCount };
  });

  const categoryIcons: Record<string, string> = {
    monthly: '📅',
    quarterly: '📊',
    semestral: '📋',
    annual: '🏆',
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #162d54 50%, #0f2240 100%)' }}>
      {/* Background decorative orbs */}
      <div className="fixed top-10 right-20 w-80 h-80 rounded-full opacity-[0.04] pointer-events-none" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', filter: 'blur(60px)' }} />
      <div className="fixed bottom-20 left-10 w-96 h-96 rounded-full opacity-[0.04] pointer-events-none" style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', filter: 'blur(80px)' }} />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <header className="text-center mb-10 fade-in-up">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            OSA <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Document Submission Tracking across all teams
          </p>
          {/* Quick stats bar */}
          <div className="flex items-center justify-center gap-6 mt-5">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-slate-400">{totalReportsAll} reports</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-400">{submissions.length} submitted</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-slate-400">{summaries.reduce((s, c) => s + c.lateCount, 0)} overdue</span>
            </div>
          </div>
        </header>

        {/* Team Leaderboard */}
        {totalReportsAll > 0 && (
          <div className="mb-8">
            <TeamLeaderboard teams={teamOverall} />
          </div>
        )}

        {/* Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {summaries.map((s, i) => (
            <Link
              key={s.category}
              href={`/category/${s.category}`}
              className="glass-card p-6 hover:border-blue-500/40 transition-all group cursor-pointer block fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* Card header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{categoryIcons[s.category]}</span>
                  <h2 className="text-lg font-bold text-white group-hover:text-blue-300 transition">
                    {CATEGORY_LABELS[s.category]}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {s.completionRate === 100 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ✓ Complete
                    </span>
                  )}
                  <span className="text-slate-500 group-hover:text-slate-400 transition">→</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div>
                  <div className="text-2xl font-bold text-white count-up" style={{ animationDelay: `${i * 0.1 + 0.2}s` }}>{s.totalReports}</div>
                  <div className="text-xs text-slate-500">Reports</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-300 count-up" style={{ animationDelay: `${i * 0.1 + 0.3}s` }}>{s.completionRate}%</div>
                  <div className="text-xs text-slate-500">Complete</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold count-up ${s.lateCount > 0 ? 'text-red-400' : 'text-emerald-400'}`} style={{ animationDelay: `${i * 0.1 + 0.4}s` }}>
                    {s.lateCount}
                  </div>
                  <div className="text-xs text-slate-500">Late</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 rounded-full bg-slate-700/50 mb-4 overflow-hidden animated-bar">
                <div
                  className="h-full rounded-full bar-fill transition-all"
                  style={{
                    width: `${s.completionRate}%`,
                    background: s.completionRate === 100
                      ? 'linear-gradient(90deg, #10b981, #34d399)'
                      : 'linear-gradient(90deg, #2563eb, #06b6d4)',
                    animationDelay: `${i * 0.1 + 0.3}s`,
                  }}
                />
              </div>

              {/* Per-team mini bars with competition indicators */}
              <div className="grid grid-cols-4 gap-2">
                {s.teamStats.map((ts) => {
                  const isLeading = ts.pct === Math.max(...s.teamStats.map((t) => t.pct)) && ts.pct > 0;
                  const isLagging = ts.pct === Math.min(...s.teamStats.map((t) => t.pct)) && ts.pct < Math.max(...s.teamStats.map((t) => t.pct));
                  return (
                    <div key={ts.teamNumber} className="text-center tooltip-trigger relative">
                      <div className="text-[10px] text-slate-500 mb-1 flex items-center justify-center gap-0.5">
                        Team {ts.teamNumber}
                        {isLeading && <span className="text-[8px]">👑</span>}
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden mb-0.5">
                        <div
                          className="h-full rounded-full bar-fill"
                          style={{
                            width: `${ts.pct}%`,
                            background: ts.pct === 100 ? '#34d399' : ts.pct >= 50 ? '#60a5fa' : '#f59e0b',
                            animationDelay: `${i * 0.1 + 0.5}s`,
                          }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400">{ts.submitted}/{ts.total}</div>
                      {isLagging && ts.pct < 100 && (
                        <div className="tooltip-content absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded-lg bg-slate-800 border border-slate-600 text-[10px] text-amber-300 whitespace-nowrap z-30">
                          ⚡ {Math.max(...s.teamStats.map((t) => t.pct)) - ts.pct}% behind
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Link>
          ))}
        </div>

        {summaries.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-slate-300 mb-2">No reports yet</h2>
            <p className="text-slate-500 text-sm">The admin hasn&apos;t added any report templates yet.</p>
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
