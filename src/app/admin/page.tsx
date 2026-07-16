'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { ReportCategory } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';
import Link from 'next/link';

const CATEGORIES: ReportCategory[] = ['monthly', 'quarterly', 'semestral', 'annual', 'others'];

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();

  const [templates, setTemplates] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  /* Form state */
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReportCategory>('monthly');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    const [tRes, sRes] = await Promise.all([
      supabase.from('report_templates').select('*').order('created_at', { ascending: false }),
      supabase.from('submissions').select('*'),
    ]);
    setTemplates(tRes.data || []);
    setSubmissions(sRes.data || []);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      setUser(data.user);
      loadData().then(() => setLoading(false));
    });
  }, [supabase, router, loadData]);

  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadlineDate) return;
    setSaving(true);
    const { error } = await supabase.from('report_templates').insert({
      title: title.trim(),
      category,
      deadline_date: deadlineDate,
    });
    if (error) setMessage(`Error: ${error.message}`);
    else { setMessage('Added!'); setTitle(''); setDeadlineDate(''); await loadData(); }
    setSaving(false);
  };

  const handleDeleteReport = async (id: string) => {
    await supabase.from('report_templates').delete().eq('id', id);
    await loadData();
  };

  const handleToggleSubmission = async (templateId: string, teamNumber: number) => {
    const existing = submissions.find(
      (s: any) => s.report_template_id === templateId && s.team_number === teamNumber
    );
    if (existing) {
      await supabase.from('submissions').delete().eq('id', existing.id);
    } else {
      await supabase.from('submissions').insert({
        report_template_id: templateId,
        team_number: teamNumber,
        submitted_at: new Date().toISOString(),
      });
    }
    await loadData();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const getSubmissionForTeam = (templateId: string, teamNum: number) =>
    submissions.find((s: any) => s.report_template_id === templateId && s.team_number === teamNum);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1628' }}>
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #162d54 50%, #0f2240 100%)' }}>
      {/* Top nav */}
      <header className="border-b border-slate-700/30 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xl">📋</span>
            <h1 className="text-lg font-bold text-white">OSA Admin</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-blue-400 hover:text-blue-300 transition">View Dashboard ↗</Link>
            <span className="text-xs text-slate-500 hidden sm:inline">{user?.email}</span>
            <button onClick={handleSignOut} className="text-xs px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Report */}
        <section className="glass-card p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">➕ Add Report Template</h2>
          {message && (
            <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm ${message.startsWith('Error') ? 'bg-red-900/30 border border-red-500/30 text-red-300' : 'bg-emerald-900/30 border border-emerald-500/30 text-emerald-300'}`}>
              {message}
            </div>
          )}
          <form onSubmit={handleAddReport} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Report Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                placeholder="e.g., Q1 Performance Report"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-600 bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as ReportCategory)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-600 bg-slate-800/50 text-white focus:outline-none focus:border-blue-500 transition text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Deadline</label>
              <input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-600 bg-slate-800/50 text-white focus:outline-none focus:border-blue-500 transition text-sm" />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button type="submit" disabled={saving}
                className="px-6 py-2.5 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}>
                {saving ? 'Adding...' : 'Add Report'}
              </button>
            </div>
          </form>
        </section>

        {/* Template list */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4">📁 Report Templates ({templates.length})</h2>
          {templates.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <span className="text-4xl block mb-3">📝</span>
              <p className="text-slate-400">No report templates yet. Add your first one above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((tpl: any) => (
                <div key={tpl.id} className="glass-card p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{tpl.title}</h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {CATEGORY_LABELS[tpl.category as ReportCategory] || tpl.category}
                        </span>
                        <span className="text-xs text-slate-500">
                          Deadline: {new Date(tpl.deadline_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteReport(tpl.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition shrink-0">
                      🗑 Delete
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((teamNum) => {
                      const sub = getSubmissionForTeam(tpl.id, teamNum);
                      return (
                        <button key={teamNum} onClick={() => handleToggleSubmission(tpl.id, teamNum)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                            sub
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
                              : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-500'
                          }`}>
                          <span className={`w-2 h-2 rounded-full ${sub ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                          Team {teamNum}
                          {sub && <span className="ml-auto text-xs">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
