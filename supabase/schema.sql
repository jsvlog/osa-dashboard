-- ============================================
-- OSA Dashboard — Supabase Schema
-- ============================================

-- Report templates created by admin
CREATE TABLE public.report_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('monthly', 'quarterly', 'semestral', 'annual', 'others')),
  deadline_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submissions marked by admin per team
CREATE TABLE public.submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_template_id UUID NOT NULL REFERENCES public.report_templates(id) ON DELETE CASCADE,
  team_number INT NOT NULL CHECK (team_number BETWEEN 1 AND 4),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_template_id, team_number)
);

-- Index for fast lookups
CREATE INDEX idx_submissions_template ON public.submissions(report_template_id);
CREATE INDEX idx_templates_category ON public.report_templates(category);

-- RLS: Public read access (anyone can view)
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Public read templates" ON public.report_templates
  FOR SELECT USING (true);

CREATE POLICY "Public read submissions" ON public.submissions
  FOR SELECT USING (true);

-- Only authenticated users (admin) can insert/update/delete
CREATE POLICY "Admin insert templates" ON public.report_templates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin delete templates" ON public.report_templates
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin insert submissions" ON public.submissions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin delete submissions" ON public.submissions
  FOR DELETE USING (auth.role() = 'authenticated');
