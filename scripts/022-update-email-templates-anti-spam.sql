-- Update email templates with less spammy subject lines and content
UPDATE public.invitation_templates 
SET 
  subject = 'Healthcare Career Opportunity - Serenity Rehabilitation Center',
  body = 'Dear [Name],

We hope this message finds you well. Serenity Rehabilitation Center is currently seeking dedicated healthcare professionals to join our compassionate team.

We believe your skills and experience would be a valuable addition to our organization. We invite you to explore positions that match your expertise:

• Registered Nurse (RN)
• Physical Therapist (PT)
• Occupational Therapist (OT)
• Home Health Aide (HHA)
• Master of Social Work (MSW)
• Speech Therapist (ST)

To learn more about our opportunities, please visit: [APPLICATION_LINK]

What we offer:
✅ Competitive compensation
✅ Comprehensive benefits package
✅ Professional development opportunities
✅ Supportive work environment
✅ Flexible scheduling options

If you have any questions about our positions or the application process, please do not hesitate to contact our HR team.

We look forward to hearing from you!

Best regards,
Serenity Rehabilitation Center HR Team
673 Martin Luther King Jr Blvd N, Pontiac, MI 48342
Phone: (248) 555-0123'
WHERE template_type = 'general';

UPDATE public.invitation_templates 
SET 
  subject = 'Registered Nurse Position - Serenity Rehabilitation Center',
  body = 'Dear [Name],

We are excited to invite you to explore a Registered Nurse position at Serenity Rehabilitation Center. Your nursing expertise and dedication to patient care make you an ideal candidate for our team.

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

Learn more: [APPLICATION_LINK]

We would love to discuss this opportunity with you further.

Sincerely,
Nursing Department
Serenity Rehabilitation Center'
WHERE template_type = 'rn';

UPDATE public.invitation_templates 
SET 
  subject = 'Physical Therapist Opportunity - Serenity Rehabilitation Center',
  body = 'Dear [Name],

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
Serenity Rehabilitation Center'
WHERE template_type = 'pt';
