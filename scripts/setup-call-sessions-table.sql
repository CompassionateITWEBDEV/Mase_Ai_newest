-- Call Sessions Table for Real-Time Video Calling
-- This table stores active call requests between users

-- Drop existing table if exists
DROP TABLE IF EXISTS call_sessions CASCADE;

-- Create call_sessions table
CREATE TABLE call_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caller_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    callee_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    call_type VARCHAR(20) NOT NULL DEFAULT 'direct', -- 'direct' or 'group'
    status VARCHAR(20) NOT NULL DEFAULT 'ringing', -- 'ringing', 'accepted', 'rejected', 'ended', 'missed'
    peer_session_id VARCHAR(100) NOT NULL, -- Unique ID for PeerJS connection
    caller_peer_id VARCHAR(100), -- Actual PeerJS peer ID of the caller
    callee_peer_id VARCHAR(100), -- Actual PeerJS peer ID of the callee  
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    answered_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_call_sessions_caller ON call_sessions(caller_id);
CREATE INDEX idx_call_sessions_callee ON call_sessions(callee_id);
CREATE INDEX idx_call_sessions_status ON call_sessions(status);
CREATE INDEX idx_call_sessions_peer_session ON call_sessions(peer_session_id);

-- Enable RLS
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their calls" ON call_sessions;
DROP POLICY IF EXISTS "Users can create calls" ON call_sessions;
DROP POLICY IF EXISTS "Users can update their calls" ON call_sessions;

-- RLS Policies
CREATE POLICY "Users can view their calls" ON call_sessions
    FOR SELECT USING (true);

CREATE POLICY "Users can create calls" ON call_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their calls" ON call_sessions
    FOR UPDATE USING (true);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_call_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS call_sessions_updated_at ON call_sessions;

-- Create trigger
CREATE TRIGGER call_sessions_updated_at
    BEFORE UPDATE ON call_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_call_sessions_updated_at();

-- Auto-expire old ringing calls (older than 60 seconds)
CREATE OR REPLACE FUNCTION expire_old_calls()
RETURNS void AS $$
BEGIN
    UPDATE call_sessions 
    SET status = 'missed', ended_at = NOW()
    WHERE status = 'ringing' 
    AND started_at < NOW() - INTERVAL '60 seconds';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE call_sessions IS 'Stores video call sessions between users';
COMMENT ON COLUMN call_sessions.peer_session_id IS 'Unique identifier used by PeerJS for connection';
COMMENT ON COLUMN call_sessions.status IS 'Call status: ringing, accepted, rejected, ended, missed';

