
-- Email Logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  status text NOT NULL, -- sent, failed
  timestamp timestamptz NOT NULL DEFAULT now(),
  error_message text
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view email_logs" ON public.email_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert email_logs" ON public.email_logs FOR INSERT WITH CHECK (true);
