-- Create RAG resources table
CREATE TABLE IF NOT EXISTS rag_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  filename TEXT NOT NULL,
  chunk_size INTEGER NOT NULL,
  chunk_overlap INTEGER NOT NULL,
  total_chunks INTEGER NOT NULL
);

-- Add RLS policies
ALTER TABLE rag_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON rag_resources
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON rag_resources
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
