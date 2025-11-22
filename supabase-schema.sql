-- Among Us IRL - Supabase Database Schema
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create games table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code TEXT UNIQUE NOT NULL,
    host_name TEXT,
    stage TEXT NOT NULL DEFAULT 'waiting',
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    meetings_used INTEGER DEFAULT 0,
    game_ended BOOLEAN DEFAULT false,
    winner TEXT,
    meeting_type TEXT,
    meeting_caller TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '4 hours')
);

-- Create players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT,
    ready BOOLEAN DEFAULT true,
    alive BOOLEAN DEFAULT true,
    tasks JSONB DEFAULT '[]'::jsonb,
    tasks_completed INTEGER DEFAULT 0,
    voted_for TEXT,
    emergency_meetings_used INTEGER DEFAULT 0,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, name)
);

-- Create indexes for performance
CREATE INDEX idx_games_room_code ON games(room_code);
CREATE INDEX idx_games_expires_at ON games(expires_at);
CREATE INDEX idx_players_game_id ON players(game_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for games table
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to cleanup expired games
CREATE OR REPLACE FUNCTION cleanup_expired_games()
RETURNS void AS $$
BEGIN
    DELETE FROM games WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- RLS Policies for games table
CREATE POLICY "Anyone can view games"
    ON games FOR SELECT
    USING (true);

CREATE POLICY "Anyone can create games"
    ON games FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Can update recent games"
    ON games FOR UPDATE
    USING (created_at > NOW() - INTERVAL '4 hours');

-- RLS Policies for players table
CREATE POLICY "Anyone can view players"
    ON players FOR SELECT
    USING (true);

CREATE POLICY "Anyone can join games"
    ON players FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Players can update themselves"
    ON players FOR UPDATE
    USING (true);

CREATE POLICY "Players can leave games"
    ON players FOR DELETE
    USING (true);

-- Enable Realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- Grant permissions
GRANT ALL ON games TO anon, authenticated;
GRANT ALL ON players TO anon, authenticated;

-- Migration: Add host_name column if it doesn't exist (for existing databases)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'games' AND column_name = 'host_name') THEN
        ALTER TABLE games ADD COLUMN host_name TEXT;
    END IF;
END $$;
