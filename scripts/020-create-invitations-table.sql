-- Create invitations table for tracking candidate invitations
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    position VARCHAR(100) NOT NULL,
    template_type VARCHAR(50) NOT NULL DEFAULT 'general',
    subject VARCHAR(500) NOT NULL,
    email_body TEXT NOT NULL,
    personal_message TEXT,
    sent_by UUID REFERENCES public.staff(id),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'clicked', 'applied', 'bounced', 'failed')),
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    applied_at TIMESTAMP WITH TIME ZONE,
    application_id UUID REFERENCES public.job_applications(id),
    bounce_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_recipient_email ON public.invitations(recipient_email);
CREATE INDEX IF NOT EXISTS idx_invitations_sent_by ON public.invitations(sent_by);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_sent_at ON public.invitations(sent_at);
CREATE INDEX IF NOT EXISTS idx_invitations_position ON public.invitations(position);

-- Create RLS policies
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Allow staff to view all invitations
CREATE POLICY "Staff can view all invitations" ON public.invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.staff 
            WHERE staff.id = auth.uid()
        )
    );

-- Allow staff to insert invitations
CREATE POLICY "Staff can insert invitations" ON public.invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.staff 
            WHERE staff.id = auth.uid()
        )
    );

-- Allow staff to update invitations
CREATE POLICY "Staff can update invitations" ON public.invitations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.staff 
            WHERE staff.id = auth.uid()
        )
    );

-- Allow anonymous users to update invitation status (for tracking)
CREATE POLICY "Anonymous can update invitation status" ON public.invitations
    FOR UPDATE USING (true);

-- Create invitation templates table
CREATE TABLE IF NOT EXISTS public.invitation_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.staff(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for templates
ALTER TABLE public.invitation_templates ENABLE ROW LEVEL SECURITY;

-- Allow staff to manage templates
CREATE POLICY "Staff can manage templates" ON public.invitation_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.staff 
            WHERE staff.id = auth.uid()
        )
    );

-- Allow anonymous users to read active templates
CREATE POLICY "Anyone can read active templates" ON public.invitation_templates
    FOR SELECT USING (is_active = true);

-- Insert sample invitation templates
INSERT INTO public.invitation_templates (name, subject, body, template_type) VALUES
('General Healthcare', 'Join Our Healthcare Team at Serenity Rehabilitation Center', 
'Dear [Name],

We hope this message finds you well. Serenity Rehabilitation Center is currently seeking dedicated healthcare professionals to join our compassionate team.

We believe your skills and experience would be a valuable addition to our organization. We invite you to apply for positions that match your expertise:

• Registered Nurse (RN)
• Physical Therapist (PT)
• Occupational Therapist (OT)
• Home Health Aide (HHA)
• Master of Social Work (MSW)
• Speech Therapist (ST)

To apply, please visit our online application portal: [APPLICATION_LINK]

What we offer:
✓ Competitive compensation
✓ Comprehensive benefits package
✓ Professional development opportunities
✓ Supportive work environment
✓ Flexible scheduling options

If you have any questions about our positions or the application process, please do not hesitate to contact our HR team.

We look forward to hearing from you!

Best regards,
Serenity Rehabilitation Center HR Team
673 Martin Luther King Jr Blvd N, Pontiac, MI 48342
Phone: (248) 555-0123', 'general'),

('Registered Nurse', 'Registered Nurse Position - Serenity Rehabilitation Center',
'Dear [Name],

We are excited to invite you to apply for a Registered Nurse position at Serenity Rehabilitation Center. Your nursing expertise and dedication to patient care make you an ideal candidate for our team.

Position Highlights:
• Home health and rehabilitation nursing
• Competitive salary: $28-35/hour
• Full benefits package including health, dental, and vision
• Continuing education support
• Flexible scheduling

Requirements:
• Current Michigan RN license
• Minimum 2 years clinical experience
• CPR certification
• Reliable transportation

Apply now: [APPLICATION_LINK]

We would love to discuss this opportunity with you further.

Sincerely,
Nursing Department
Serenity Rehabilitation Center', 'rn'),

('Physical Therapist', 'Physical Therapist Opportunity - Serenity Rehabilitation Center',
'Dear [Name],

Serenity Rehabilitation Center is seeking a skilled Physical Therapist to join our rehabilitation team. We believe your expertise would greatly benefit our patients and organization.

Position Details:
• Home-based and clinic physical therapy
• Competitive salary: $35-42/hour
• Comprehensive benefits
• Professional development opportunities
• Collaborative team environment

Requirements:
• Michigan PT license
• DPT or equivalent degree
• Experience in home health preferred
• Strong communication skills

Start your application: [APPLICATION_LINK]

We look forward to welcoming you to our team!

Best regards,
Rehabilitation Services
Serenity Rehabilitation Center', 'pt');
