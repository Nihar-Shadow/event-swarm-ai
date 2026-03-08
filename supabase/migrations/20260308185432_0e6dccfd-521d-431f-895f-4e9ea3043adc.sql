
-- Create participants table
CREATE TABLE public.participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  team_name TEXT,
  college TEXT,
  phone TEXT,
  segment TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to manage participants (organizer tool)
CREATE POLICY "Authenticated users can view participants"
  ON public.participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert participants"
  ON public.participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update participants"
  ON public.participants FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete participants"
  ON public.participants FOR DELETE
  TO authenticated
  USING (true);

-- Also allow anon access for demo/dev purposes
CREATE POLICY "Anon users can view participants"
  ON public.participants FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon users can insert participants"
  ON public.participants FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon users can update participants"
  ON public.participants FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Anon users can delete participants"
  ON public.participants FOR DELETE
  TO anon
  USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON public.participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for search
CREATE INDEX idx_participants_name ON public.participants USING GIN (to_tsvector('english', name));
CREATE INDEX idx_participants_team ON public.participants (team_name);
CREATE INDEX idx_participants_college ON public.participants (college);
CREATE INDEX idx_participants_segment ON public.participants (segment);
