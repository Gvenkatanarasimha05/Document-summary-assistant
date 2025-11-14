/*
  # Document Summary Assistant Schema

  ## Overview
  This migration creates the database structure for a document summary assistant application
  that processes PDFs and images to generate AI-powered summaries.

  ## New Tables
  
  ### `documents`
  Stores metadata about uploaded documents
  - `id` (uuid, primary key) - Unique identifier for each document
  - `user_id` (uuid, nullable) - Reference to authenticated user (null for anonymous)
  - `filename` (text) - Original filename of the uploaded document
  - `file_type` (text) - MIME type (application/pdf, image/png, image/jpeg, etc.)
  - `file_size` (bigint) - File size in bytes
  - `storage_path` (text) - Path to file in Supabase Storage
  - `status` (text) - Processing status: 'uploading', 'processing', 'completed', 'failed'
  - `created_at` (timestamptz) - Upload timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `summaries`
  Stores generated summaries for documents
  - `id` (uuid, primary key) - Unique identifier for each summary
  - `document_id` (uuid, foreign key) - Reference to parent document
  - `extracted_text` (text) - Raw text extracted from document
  - `summary_short` (text) - Short summary version
  - `summary_medium` (text) - Medium summary version
  - `summary_long` (text) - Long summary version
  - `key_points` (jsonb) - Array of key points extracted
  - `error_message` (text, nullable) - Error details if processing failed
  - `created_at` (timestamptz) - Generation timestamp

  ## Security
  - Enable RLS on all tables
  - Allow public read access for demo purposes
  - Allow public insert/update for demo purposes (can be restricted later)

  ## Storage
  - Create storage bucket for document uploads
*/

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT NULL,
  filename text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  storage_path text NOT NULL,
  status text NOT NULL DEFAULT 'uploading',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  extracted_text text,
  summary_short text,
  summary_medium text,
  summary_long text,
  key_points jsonb DEFAULT '[]'::jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_summaries_document_id ON summaries(document_id);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to documents"
  ON documents FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to documents"
  ON documents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to documents"
  ON documents FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to summaries"
  ON summaries FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to summaries"
  ON summaries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to summaries"
  ON summaries FOR UPDATE
  USING (true)
  WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;