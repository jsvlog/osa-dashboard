import { createClient } from '@/lib/supabase/server';
import type { ReportCategory } from '@/lib/types';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/lib/types';
import Link from 'next/link';

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

  const categoryIcons: Record<string, string> = {
    monthly: '📅',
    quarterly: '📊',
    semestral: '📋',
    annual: '🏆',
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #162d54 50%, #0f2240 100%)' }}>
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            OSA <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Document Submission Tracking across all teams
          </p>
        </header>

        {/* Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {summaries.map((s) => (
            <Link
              key={s.category}
              href={`/category/${s.category}`}
              className="glass-card p-6 hover:border-blue-500/40 transition-all group cursor-pointer block"
            >
              {/* Card header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{categoryIcons[s.category]}</span>
                  <h2 className="text-lg font-bold text-white group-hover:text-blue-300 transition">
                    {CATEGORY_LABELS[s.category]}
                  </h2>
                </div>
                <span className="text-slate-500 group-hover:text-slate-400 transition">→</span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div>
                  <div className="text-2xl font-bold text-white">{s.totalReports}</div>
                  <div className="text-xs text-slate-500">Reports</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-300">{s.completionRate}%</div>
                  <div className="text-xs text-slate-500">Complete</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${s.lateCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {s.lateCount}
                  </div>
                  <div className="text-xs text-slate-500">Late</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-700/50 mb-4 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${s.completionRate}%`,
                    background: 'linear-gradient(90deg, #2563eb, #06b6d4)',
                  }}
                />
              </div>

              {/* Per-team mini bars */}
              <div className="grid grid-cols-4 gap-2">
                {s.teamStats.map((ts) => (
                  <div key={ts.teamNumber} className="text-center">
                    <div className="text-[10px] text-slate-500 mb-1">Team {ts.teamNumber}</div>
                    <div className="w-full h-1.5 rounded-full bg-slate-700/50 overflow-hidden mb-0.5">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${ts.pct}%`,
                          background: ts.pct === 100 ? '#34d399' : ts.pct >= 50 ? '#60a5fa' : '#f59e0b',
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400">{ts.submitted}/{ts.total}</div>
                  </div>
                ))}
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
