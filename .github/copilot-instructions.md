# M.A.S.E AI Healthcare Dashboard - Copilot Instructions

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Project Overview

The M.A.S.E (Medical Automation & Staffing Excellence) AI Healthcare Dashboard is a comprehensive Next.js 15.2.4 healthcare intelligence platform with advanced AI capabilities. The platform serves home healthcare agencies with patient management, staff coordination, quality assurance, billing automation, and predictive analytics.

## Critical Environment Requirements

**NEVER PROCEED WITHOUT SETTING THESE ENVIRONMENT VARIABLES:**

\`\`\`bash
export NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
export NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
export SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
\`\`\`

**Build and operations will FAIL without these variables.** Use these test values for development and testing.

## Bootstrap & Setup Instructions

**Follow these commands in order - DO NOT SKIP ANY STEPS:**

1. **Install Node.js dependencies** (requires legacy peer deps due to zod version conflicts):
   \`\`\`bash
   npm install --legacy-peer-deps
   \`\`\`
   - **Time: 57 seconds**
   - **Must use --legacy-peer-deps flag** - standard npm install will fail due to AI SDK dependencies

2. **Set environment variables** before any build/dev commands:
   \`\`\`bash
   export NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   export NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
   export SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
   \`\`\`

## Build & Development Commands

**NEVER CANCEL - Wait for ALL commands to complete**

### Build Production
\`\`\`bash
npm run build
\`\`\`
- **Time: 65 seconds** 
- **NEVER CANCEL - Set timeout to 120+ seconds**
- **Requires environment variables** - will fail if not set
- Compiles 249 static pages + 154+ API routes
- TypeScript and ESLint checks are disabled in build (see next.config.mjs)

### Development Server
\`\`\`bash
npm run dev
\`\`\`
- **Time: <2 seconds to start**
- **Runs on http://localhost:3000**
- **Hot reload enabled**
- **Requires environment variables**

### Linting
\`\`\`bash
npm run lint
\`\`\`
- **Time: 12 seconds**
- **NEVER CANCEL - Set timeout to 30+ seconds**
- Uses ESLint with Next.js configuration
- Custom rules disable some React warnings (see .eslintrc.json)

### Testing
\`\`\`bash
npm run test
\`\`\`
- **Time: 3 seconds**
- **NEVER CANCEL - Set timeout to 30+ seconds**
- Uses Vitest with Node.js environment
- **7 passing tests** covering API routes and auth
- Test environment automatically uses test database settings

## Validation Scenarios

**CRITICAL: Always run these validation scenarios after making changes:**

### 1. Application Startup Validation
\`\`\`bash
# With environment variables set:
npm run dev
\`\`\`
- Navigate to http://localhost:3000
- **MUST verify**: Homepage loads with "Mase AI Neural Hub" title
- **MUST verify**: Navigation sidebar renders correctly
- **MUST verify**: Dashboard cards show sample data (247 patients, 89 staff, etc.)

### 2. Page Navigation Testing
- Click "Launch Neural Chart QA" → Should navigate to `/comprehensive-qa`
- Click navigation items in sidebar → Should load respective pages
- **MUST verify**: No JavaScript errors in browser console

### 3. API Route Testing
\`\`\`bash
# Test database connection endpoint
curl -X POST http://localhost:3000/api/database-test \
  -H "Content-Type: application/json" \
  -d '{"provider":"supabase"}'
\`\`\`
- **Expected**: Returns 200 status with connection details

### 4. Build Validation
\`\`\`bash
npm run build && npm start
\`\`\`
- **MUST verify**: Build succeeds without errors
- **MUST verify**: Production server starts
- **MUST verify**: Homepage loads correctly in production mode

## Key Technologies & Architecture

### Core Stack
- **Next.js 15.2.4** with App Router
- **React 19** with TypeScript 5
- **Tailwind CSS 4.1.9** with Shadcn/UI components
- **Supabase** for database (PostgreSQL)
- **AI SDK** (@ai-sdk/openai) for AI integrations
- **Vitest** for testing

### Project Structure
\`\`\`
/app/              # Next.js app router (146 .tsx + 154 .ts files)
  /api/            # API routes (154+ endpoints)
  /[feature]/      # Feature pages (analytics, billing, qa, etc.)
  globals.css      # Global styles
  layout.tsx       # Root layout with navigation
  page.tsx         # Homepage dashboard

/components/       # Reusable React components
  /ui/            # Shadcn/UI components
  ClientAIVoiceAssistant.tsx
  compact-navigation.tsx
  [other components]

/lib/             # Utility libraries
  supabase-client.ts    # Database client
  with-auth.ts         # Authentication wrapper
  database-test.ts     # Connection testing
  [other utilities]

/tests/           # Test files (Vitest)
/scripts/         # Database migration scripts
\`\`\`

## Common Development Tasks

### Adding New Features
1. **Always run linting first**: `npm run lint`
2. **Create feature in /app/[feature-name]/page.tsx**
3. **Add API routes in /app/api/[feature-name]/route.ts**
4. **Test immediately**: Start dev server and manually validate
5. **Run build validation**: `npm run build`

### Debugging Issues
1. **Check environment variables are set correctly**
2. **Verify dev server logs** for detailed error messages
3. **Check browser console** for client-side errors
4. **Test API routes directly** with curl or API client
5. **Run database connection test**: POST to `/api/database-test`

### Database & API Integration
- **All database access uses Supabase client** (`/lib/supabase-client.ts`)
- **API routes use withAuth wrapper** for authentication
- **Mock data is used** when Supabase connection fails
- **Logging system available** via `/lib/logger.ts`

## Known Issues & Workarounds

### Build Issues
- **npm install fails**: Use `--legacy-peer-deps` flag
- **Build fails**: Ensure all environment variables are set
- **Type errors ignored**: TypeScript errors are disabled in next.config.mjs

### Runtime Issues
- **Database connection errors**: Application continues with mock data
- **Authentication failures**: Test routes accept "valid-token" in test mode
- **Supabase connection refused**: Expected in dev environment, app handles gracefully

## Performance & Scaling Notes

- **Build time**: 65 seconds for 249 pages
- **Bundle size**: ~101KB shared chunks + page-specific bundles
- **API routes**: 154+ endpoints with mock data fallbacks
- **Database**: PostgreSQL via Supabase (serverless)
- **Hot reload**: Very fast (<200ms) in development

## Integration Points

### External Systems
- **Axxess EHR**: Patient data synchronization (`/api/axxess/*`)
- **Supabase**: Primary database and authentication
- **AI Services**: OpenAI integration for document processing
- **Email Services**: Multiple providers (Postmark, SendGrid, etc.)

### AI Features
- **Voice Assistant**: Client-side AI voice commands
- **Document Analysis**: Automated chart QA with AI
- **Predictive Analytics**: Patient outcome forecasting
- **Automated Workflows**: Intelligent task automation

## Security & Authentication

- **Authentication**: Supabase Auth with JWT tokens
- **API Protection**: withAuth wrapper for all protected routes
- **Environment Variables**: Sensitive data in env vars only
- **Test Mode**: Simplified auth for testing (`valid-token`)

## Maintenance & Updates

### Regular Tasks
1. **Always test after updates**: Run full validation scenarios
2. **Monitor build times**: Should remain under 90 seconds
3. **Check for security updates**: Regular npm audit
4. **Validate API endpoints**: Ensure all routes return expected responses

### Before Committing Changes
1. `npm run lint` - **NEVER CANCEL, wait for completion**
2. `npm run test` - **NEVER CANCEL, wait for completion**  
3. `npm run build` - **NEVER CANCEL, wait for completion**
4. **Manual validation**: Start dev server, test key functionality
5. **Screenshot critical pages**: Verify UI remains intact

**Remember: This platform serves healthcare providers. Always prioritize reliability and thorough testing over speed of development.**
