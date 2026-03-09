
-- Generated Posts table
CREATE TABLE public.generated_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  caption text,
  image_url text,
  scheduled_time timestamptz,
  status text NOT NULL DEFAULT 'generated', -- generated, scheduled, published
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view generated_posts" ON public.generated_posts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert generated_posts" ON public.generated_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update generated_posts" ON public.generated_posts FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete generated_posts" ON public.generated_posts FOR DELETE USING (true);

-- Agent Logs table
CREATE TABLE public.agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  platform text,
  timestamp timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view agent_logs" ON public.agent_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert agent_logs" ON public.agent_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update agent_logs" ON public.agent_logs FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete agent_logs" ON public.agent_logs FOR DELETE USING (true);
