-- Migration: Add meeting-related columns
-- Run this in your Supabase SQL Editor to add missing columns

-- Add meeting columns to games table
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS meeting_type TEXT,
  ADD COLUMN IF NOT EXISTS meeting_caller TEXT;

-- Add emergency_meetings_used column to players table
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS emergency_meetings_used INTEGER DEFAULT 0;

-- Update existing players to have 0 emergency meetings if NULL
UPDATE players SET emergency_meetings_used = 0 WHERE emergency_meetings_used IS NULL;
