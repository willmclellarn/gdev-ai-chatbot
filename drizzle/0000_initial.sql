-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  chunk_size TEXT NOT NULL,
  chunk_overlap TEXT NOT NULL,
  total_chunks TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "documents_select_policy" ON documents
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "documents_insert_policy" ON documents
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
