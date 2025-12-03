-- Leave Requests Table Setup
-- Run this in Supabase SQL Editor

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  staff_email TEXT,
  staff_position TEXT,
  staff_department TEXT,
  
  -- Leave details
  leave_type TEXT NOT NULL CHECK (leave_type IN ('vacation', 'sick', 'personal', 'fmla', 'bereavement', 'jury', 'military', 'unpaid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  return_date DATE,
  partial_days BOOLEAN DEFAULT FALSE,
  
  -- Request details
  reason TEXT,
  emergency_contact TEXT,
  work_coverage TEXT,
  medical_certification BOOLEAN DEFAULT FALSE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'cancelled')),
  
  -- Approval/Denial
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  denial_reason TEXT,
  
  -- Performance impact
  performance_impact TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leave_balances table
CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE UNIQUE,
  vacation_days DECIMAL(5,2) DEFAULT 15,
  sick_days DECIMAL(5,2) DEFAULT 8,
  personal_days DECIMAL(5,2) DEFAULT 3,
  fmla_weeks DECIMAL(5,2) DEFAULT 12,
  vacation_accrual_rate DECIMAL(5,2) DEFAULT 1.25, -- per month
  sick_accrual_rate DECIMAL(5,2) DEFAULT 0.67, -- per month
  year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_staff_id ON leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_balances_staff_id ON leave_balances(staff_id);

-- Enable RLS
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all access for leave_requests" ON leave_requests;
DROP POLICY IF EXISTS "Enable all access for leave_balances" ON leave_balances;

-- Create policies
CREATE POLICY "Enable all access for leave_requests" ON leave_requests FOR ALL USING (true);
CREATE POLICY "Enable all access for leave_balances" ON leave_balances FOR ALL USING (true);

-- Function to update leave balance after request is approved
CREATE OR REPLACE FUNCTION update_leave_balance_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    -- Deduct from leave balance
    UPDATE leave_balances
    SET 
      vacation_days = CASE WHEN NEW.leave_type = 'vacation' THEN vacation_days - NEW.total_days ELSE vacation_days END,
      sick_days = CASE WHEN NEW.leave_type = 'sick' THEN sick_days - NEW.total_days ELSE sick_days END,
      personal_days = CASE WHEN NEW.leave_type = 'personal' THEN personal_days - NEW.total_days ELSE personal_days END,
      updated_at = NOW()
    WHERE staff_id = NEW.staff_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic balance update
DROP TRIGGER IF EXISTS trigger_update_leave_balance ON leave_requests;
CREATE TRIGGER trigger_update_leave_balance
  AFTER UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_balance_on_approval();

-- Insert sample leave balances for existing staff
INSERT INTO leave_balances (staff_id, vacation_days, sick_days, personal_days, fmla_weeks)
SELECT id, 15, 8, 3, 12
FROM staff
WHERE id NOT IN (SELECT staff_id FROM leave_balances WHERE staff_id IS NOT NULL)
ON CONFLICT (staff_id) DO NOTHING;

SELECT 'Leave requests tables created successfully!' as result;

