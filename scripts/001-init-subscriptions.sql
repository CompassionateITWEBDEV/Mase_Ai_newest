-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  billing_period VARCHAR(20) NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  features JSONB NOT NULL DEFAULT '[]',
  max_users INTEGER NOT NULL DEFAULT -1, -- -1 means unlimited
  max_facilities INTEGER NOT NULL DEFAULT -1,
  max_api_calls INTEGER NOT NULL DEFAULT -1,
  storage_gb INTEGER NOT NULL DEFAULT -1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, status) -- Only one active subscription per user
);

-- Create dashboard access requirements table
CREATE TABLE IF NOT EXISTS dashboard_access (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dashboard_name VARCHAR(100) NOT NULL UNIQUE,
  dashboard_path VARCHAR(200) NOT NULL UNIQUE,
  required_plan VARCHAR(50) NOT NULL,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clear existing data to avoid conflicts
DELETE FROM user_subscriptions;
DELETE FROM dashboard_access;
DELETE FROM subscription_plans;

-- Insert subscription plans
INSERT INTO subscription_plans (name, price, billing_period, features, max_users, max_facilities, max_api_calls, storage_gb) VALUES
('Starter', 99.00, 'monthly', 
 '["Basic Dashboard", "Staff Management", "Basic Reporting", "Email Support", "Up to 50 Users", "Basic Training Modules"]'::jsonb,
 50, 5, 10000, 10),
('Professional', 299.00, 'monthly',
 '["Advanced Analytics", "Quality Assurance Tools", "Financial Dashboard", "Advanced Reporting", "Priority Support", "Up to 200 Users", "Advanced Training & Certification", "GPS Tracking", "Supply Management"]'::jsonb,
 200, 20, 50000, 100),
('Enterprise', 799.00, 'monthly',
 '["All Professional Features", "Advanced Billing & Claims", "Predictive Analytics", "AI-Powered Insights", "Custom Integrations", "Dedicated Support", "Unlimited Users", "Advanced Security", "Custom Workflows", "API Access"]'::jsonb,
 -1, -1, -1, -1);

-- Insert dashboard access requirements
INSERT INTO dashboard_access (dashboard_name, dashboard_path, required_plan, is_premium, description) VALUES
-- Starter Plan Dashboards
('Main Dashboard', '/', 'starter', false, 'Main overview dashboard'),
('Staff Dashboard', '/staff-dashboard', 'starter', false, 'Staff management and overview'),
('Applications', '/applications', 'starter', false, 'Job applications management'),
('Schedule', '/schedule', 'starter', false, 'Staff scheduling system'),
('Training', '/training', 'starter', false, 'Basic training modules'),
('Communications', '/communications', 'starter', false, 'Internal communications'),
('Documents', '/documents', 'starter', false, 'Document management'),

-- Professional Plan Dashboards
('Analytics', '/analytics', 'professional', true, 'Advanced analytics and reporting'),
('Quality Assurance', '/quality', 'professional', true, 'Quality control and assurance tools'),
('Financial Dashboard', '/financial-dashboard', 'professional', true, 'Financial overview and metrics'),
('Patient Reviews', '/patient-reviews', 'professional', true, 'Patient feedback and reviews'),
('GPS Analytics', '/gps-analytics', 'professional', true, 'Location tracking and analytics'),
('Supply Management', '/wound-care-supplies', 'professional', true, 'Medical supply management'),
('Continuing Education', '/continuing-education', 'professional', true, 'Advanced training programs'),
('In-Service Training', '/in-service', 'professional', true, 'In-service training management'),
('Physician Management', '/physicians', 'professional', true, 'Physician credentialing and management'),
('Marketing Dashboard', '/marketing-dashboard', 'professional', true, 'Marketing analytics and campaigns'),
('Facility Portal', '/facility-portal', 'professional', true, 'Multi-facility management'),

-- Enterprise Plan Dashboards
('Advanced Billing', '/advanced-billing', 'enterprise', true, 'Advanced billing and claims processing'),
('Predictive Analytics', '/predictive-analytics', 'enterprise', true, 'AI-powered predictive insights'),
('Predictive Marketing', '/predictive-marketing', 'enterprise', true, 'AI-driven marketing optimization'),
('Billing Automation', '/billing-automation', 'enterprise', true, 'Automated billing workflows'),
('Mobile Billing', '/mobile-billing', 'enterprise', true, 'Mobile billing management'),
('AI Competency', '/ai-competency', 'enterprise', true, 'AI-powered competency evaluation'),
('Automated Outreach', '/automated-outreach', 'enterprise', true, 'Automated marketing campaigns'),
('MIHIN Integration', '/mihin-integration', 'enterprise', true, 'Health information exchange'),
('Integrations', '/integrations', 'enterprise', true, 'Third-party integrations management'),
('Admin Panel', '/admin/users', 'enterprise', true, 'System administration tools');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_dashboard_access_path ON dashboard_access(dashboard_path);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_name ON subscription_plans(name);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
