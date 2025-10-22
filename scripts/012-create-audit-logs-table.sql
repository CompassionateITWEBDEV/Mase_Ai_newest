-- Create audit_logs table for tracking user actions
-- This is based on the schema from 003-init-core-tables.sql

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.staff(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details JSONB,
    ip_address TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON public.audit_logs(resource_id);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all to select audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow all to insert audit_logs" ON public.audit_logs;

-- Create permissive policies for development
CREATE POLICY "Allow all to select audit_logs"
ON public.audit_logs FOR SELECT USING (true);

CREATE POLICY "Allow all to insert audit_logs"
ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT ON public.audit_logs TO anon;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;

-- Insert some sample audit logs for testing
INSERT INTO public.audit_logs (user_id, action, resource_type, details, ip_address)
VALUES 
  (NULL, 'system_startup', 'system', '{"message": "System initialized"}', '127.0.0.1'),
  (NULL, 'table_created', 'audit_logs', '{"message": "Audit logs table created"}', '127.0.0.1')
ON CONFLICT DO NOTHING;

