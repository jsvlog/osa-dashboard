import { createClient } from '@/lib/supabase/server';
import type { ReportCategory, TeamProgress, CategoryTree, TreeStage } from '@/lib/types';
import { CATEGORY_ORDER } from '@/lib/types';
import { TreeDashboard } from '@/components/TreeDashboard';

export const dynamic = 'force-dynamic';

function computeStage(percentage: number): TreeStage {
  if (percentage === 0) return 0;
  if (percentage <= 25) return 1;
  if (percentage <= 50) return 2;
  if (percentage <= 75) return 3;
  if (percentage <= 99) return 4;
  return 5;
}

export default async function HomePage() {
  const supabase = await createClient();

  /* Fetch all report templates */
  let templates: any[] = [];
  try {
    const { data } = await supabase.from('report_templates').select('*').order('created_at', { ascending: false });
    templates = data || [];
  } catch (e) {
    console.error('Failed to fetch templates:', e);
  }

  /* Fetch all submissions */
  let submissions: any[] = [];
  try {
    const { data } = await supabase.from('submissions').select('*');
    submissions = data || [];
  } catch (e) {
    console.error('Failed to fetch submissions:', e);
  }

  /* Group templates by category */
  const templatesByCategory: Record<string, any[]> = {};
  for (const t of templates) {
    const cat = t.category || 'others';
    if (!templatesByCategory[cat]) templatesByCategory[cat] = [];
    templatesByCategory[cat].push(t);
  }

  /* Compute progress per category per team */
  const trees: CategoryTree[] = [];

  for (const category of CATEGORY_ORDER) {
    const catTemplates = templatesByCategory[category] || [];
    const totalReports = catTemplates.length;

    const teams: TeamProgress[] = [];
    for (let teamNum = 1; teamNum <= 4; teamNum++) {
      /* Count submissions for this team in this category */
      const submittedCount = submissions.filter((s: any) => {
        const tpl = templates.find((t: any) => t.id === s.report_template_id);
        return tpl && tpl.category === category && s.team_number === teamNum;
      }).length;

      const percentage = totalReports > 0 ? Math.round((submittedCount / totalReports) * 100) : 0;
      const stage = computeStage(percentage);

      teams.push({
        teamNumber: teamNum,
        teamName: `Team ${teamNum}`,
        submittedCount,
        totalReports,
        percentage,
        stage,
      });
    }

    trees.push({ category, teams });
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #162d54 50%, #0f2240 100%)' }}>
      <TreeDashboard trees={trees} />
    </div>
  );
}
