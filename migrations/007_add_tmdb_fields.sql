-- Migration 007: Add TMDB fields for movie posters
-- Adds tmdb_id and poster_path columns to movies table

ALTER TABLE movies
ADD COLUMN tmdb_id INTEGER,
ADD COLUMN poster_path TEXT;

-- Add comment for documentation
COMMENT ON COLUMN movies.tmdb_id IS 'The Movie Database (TMDB) movie ID for fetching poster images';
COMMENT ON COLUMN movies.poster_path IS 'TMDB poster path (e.g., /abc123.jpg) - use with https://image.tmdb.org/t/p/{size}{path}';
