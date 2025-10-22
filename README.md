# M.A.S.E AI Intelligence Platform

A comprehensive healthcare management platform built with Next.js, TypeScript, and Supabase.

## Features

- **Multi-Role Dashboard System**: Separate interfaces for applicants, employers, staff, and administrators
- **AI-Powered Voice Assistant**: Intelligent voice commands for healthcare operations
- **Clinical QA Management**: Automated quality assurance and compliance monitoring
- **Referral Management**: Complete referral workflow automation
- **Billing Automation**: Advanced billing and financial management
- **Integration Hub**: Connect with major healthcare systems (Axxess, CAQH, etc.)
- **Mobile-First Design**: Responsive interface for all devices

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI Components**: shadcn/ui
- **State Management**: React Hooks
- **Authentication**: Supabase Auth with role-based access control

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/CompassionateITWEBDEV/Mase_Ai_newest.git
   cd Mase_Ai_newest
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Add your Supabase credentials
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (standalone)/      # Standalone pages
│   ├── api/               # API routes
│   ├── applicant-dashboard/
│   ├── employer-dashboard/
│   └── ...                # Feature-specific pages
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── lib/                  # Utility functions and configurations
├── scripts/              # Database migration scripts
└── types/                # TypeScript type definitions
```

## Documentation

- [Quick Setup Guide](./QUICK_SETUP.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Login System Overview](./LOGIN_SYSTEM_OVERVIEW.md)
- [Roles & Permissions Testing](./ROLES_PERMISSIONS_TESTING_GUIDE.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.