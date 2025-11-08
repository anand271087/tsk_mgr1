/*
  # Add vector search capabilities to tasks table

  1. Extensions
    - Enable `vector` extension for similarity search

  2. Schema Changes
    - Add `embedding` column to tasks table (vector with 384 dimensions for gte-small model)
    - Create index for fast vector similarity search

  3. Functions
    - Create function to search tasks by vector similarity

  4. Important Notes
    - Uses pgvector for efficient similarity search
    - Embedding dimension is 384 (matches gte-small model from OpenAI)
    - Cosine similarity is used for matching
    - Only returns results with similarity > 0.7
*/

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS embedding vector(384);

CREATE INDEX IF NOT EXISTS tasks_embedding_idx ON tasks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE OR REPLACE FUNCTION match_tasks(
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  user_id_param uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  priority text,
  status text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tasks.id,
    tasks.title,
    tasks.priority,
    tasks.status,
    1 - (tasks.embedding <=> query_embedding) AS similarity
  FROM tasks
  WHERE tasks.user_id = user_id_param
    AND tasks.embedding IS NOT NULL
    AND 1 - (tasks.embedding <=> query_embedding) > match_threshold
  ORDER BY tasks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;