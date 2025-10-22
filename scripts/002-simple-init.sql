-- Simple initialization script for subscription system
-- This script uses basic SQL that should work with most PostgreSQL setups

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subscription plans table with basic structure
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  billing_period VARCHAR(20) NOT NULL DEFAULT 'monthly',
  max_users INTEGER NOT NULL DEFAULT -1,
  max_facilities INTEGER NOT NULL DEFAULT -1,
  max_api_calls INTEGER NOT NULL DEFAULT -1,
  storage_gb INTEGER NOT NULL DEFAULT -1,
  features TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT uuid_generate_v4(),
  plan_id INTEGER REFERENCES subscription_plans(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dashboard access table
CREATE TABLE IF NOT EXISTS dashboard_access (
  id SERIAL PRIMARY KEY,
  dashboard_name VARCHAR(100) NOT NULL,
  dashboard_path VARCHAR(200) NOT NULL UNIQUE,
  required_plan VARCHAR(50) NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  description TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_dashboard_access_path ON dashboard_access(dashboard_path);

-- Insert basic subscription plans
INSERT INTO subscription_plans (name, price, billing_period, max_users, max_facilities, max_api_calls, storage_gb, features) 
VALUES 
(
  'Starter', 
  99.00, 
  'monthly', 
  50, 
  5, 
  10000, 
  10,
  ARRAY[
    'Basic Dashboard',
    'Staff Management', 
    'Basic Reporting',
    'Email Support',
    'Up to 50 Users',
    'Basic Training Modules'
  ]
),
(
  'Professional', 
  299.00, 
  'monthly', 
  200, 
  20, 
  50000, 
  100,
  ARRAY[
    'Advanced Analytics',
    'Quality Assurance Tools',
    'Financial Dashboard',
    'Advanced Reporting',
    'Priority Support',
    'Up to 200 Users',
    'Advanced Training & Certification',
    'GPS Tracking',
    'Supply Management'
  ]
),
(
  'Enterprise', 
  799.00, 
  'monthly', 
  -1, 
  -1, 
  -1, 
  -1,
  ARRAY[
    'All Professional Features',
    'Advanced Billing & Claims',
    'Predictive Analytics',
    'AI-Powered Insights',
    'Custom Integrations',
    'Dedicated Support',
    'Unlimited Users',
    'Advanced Security',
    'Custom Workflows',
    'API Access'
  ]
)
ON CONFLICT (name) DO UPDATE SET
  price = EXCLUDED.price,
  billing_period = EXCLUDED.billing_period,
  max_users = EXCLUDED.max_users,
  max_facilities = EXCLUDED.max_facilities,
  max_api_calls = EXCLUDED.max_api_calls,
  storage_gb = EXCLUDED.storage_gb,
  features = EXCLUDED.features;

-- Insert dashboard access requirements
INSERT INTO dashboard_access (dashboard_name, dashboard_path, required_plan, is_premium, description) VALUES
('Main Dashboard', '/', 'starter', false, 'Main overview dashboard'),
('Staff Dashboard', '/staff-dashboard', 'starter', false, 'Staff management and overview'),
('Applications', '/applications', 'starter', false, 'Job applications management'),
('Schedule', '/schedule', 'starter', false, 'Staff scheduling system'),
('Training', '/training', 'starter', false, 'Basic training modules'),
('Communications', '/communications', 'starter', false, 'Internal communications'),
('Documents', '/documents', 'starter', false, 'Document management'),
('Analytics', '/analytics', 'professional', true, 'Advanced analytics and reporting'),
('Quality Assurance', '/quality', 'professional', true, 'Quality assurance tools'),
('Financial Dashboard', '/financial-dashboard', 'professional', true, 'Financial overview and metrics'),
('Patient Reviews', '/patient-reviews', 'professional', true, 'Patient feedback management'),
('GPS Analytics', '/gps-analytics', 'professional', true, 'GPS tracking and analytics'),
('Wound Care Supplies', '/wound-care-supplies', 'professional', true, 'Supply management system'),
('Continuing Education', '/continuing-education', 'professional', true, 'Advanced education tracking'),
('In-Service Training', '/in-service', 'professional', true, 'In-service training management'),
('Physicians Portal', '/physicians', 'professional', true, 'Physician management system'),
('Marketing Dashboard', '/marketing-dashboard', 'professional', true, 'Marketing analytics and tools'),
('Facility Portal', '/facility-portal', 'professional', true, 'Facility management portal'),
('Advanced Billing', '/advanced-billing', 'enterprise', true, 'Advanced billing and claims processing'),
('Predictive Analytics', '/predictive-analytics', 'enterprise', true, 'AI-powered predictive insights'),
('Predictive Marketing', '/predictive-marketing', 'enterprise', true, 'AI-driven marketing optimization'),
('Billing Automation', '/billing-automation', 'enterprise', true, 'Automated billing workflows'),
('Mobile Billing', '/mobile-billing', 'enterprise', true, 'Mobile billing management'),
('AI Competency', '/ai-competency', 'enterprise', true, 'AI-powered competency evaluation'),
('Automated Outreach', '/automated-outreach', 'enterprise', true, 'Automated marketing outreach'),
('MIHIN Integration', '/mihin-integration', 'enterprise', true, 'Michigan health information network'),
('Integrations', '/integrations', 'enterprise', true, 'Third-party integrations management'),
('Admin Users', '/admin/users', 'enterprise', true, 'User administration panel')
ON CONFLICT (dashboard_path) DO UPDATE SET
  dashboard_name = EXCLUDED.dashboard_name,
  required_plan = EXCLUDED.required_plan,
  is_premium = EXCLUDED.is_premium,
  description = EXCLUDED.description;

-- Create a demo user subscription for testing (using a fixed UUID for consistency)
INSERT INTO user_subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
SELECT 
  '550e8400-e29b-41d4-a716-446655440000'::UUID,
  id,
  'active',
  NOW(),
  NOW() + INTERVAL '1 month'
FROM subscription_plans 
WHERE name = 'Professional'
ON CONFLICT DO NOTHING;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON subscription_plans TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON user_subscriptions TO authenticated;
-- GRANT SELECT ON dashboard_access TO authenticated;
