export type ReportCategory = 'monthly' | 'quarterly' | 'semestral' | 'annual' | 'others';

export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semestral: 'Semestral',
  annual: 'Annual',
  others: 'Others',
};

export const CATEGORY_ORDER: ReportCategory[] = ['monthly', 'quarterly', 'semestral', 'annual'];

export interface ReportTemplate {
  id: string;
  title: string;
  category: ReportCategory;
  deadline_date: string;
  created_at: string;
}

export interface Submission {
  id: string;
  report_template_id: string;
  team_number: number; // 1-4
  submitted_at: string;
  created_at: string;
}

export interface TeamProgress {
  teamNumber: number;
  teamName: string;
  submittedCount: number;
  totalReports: number;
  percentage: number; // 0-100
  stage: TreeStage; // 0-5
}

export type TreeStage = 0 | 1 | 2 | 3 | 4 | 5;

export const STAGE_LABELS: Record<TreeStage, string> = {
  0: 'Seed',
  1: 'Sprout',
  2: 'Growing',
  3: 'Flowering',
  4: 'Fruiting',
  5: 'Full Bloom',
};

export interface CategoryTree {
  category: ReportCategory;
  teams: TeamProgress[];
}
