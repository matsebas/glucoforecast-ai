# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GlucoForecast AI is a Next.js application for diabetes management focused on Type 1 Diabetes Mellitus (DM1). It
provides:

- Continuous Glucose Monitoring (CGM) data analysis
- AI-powered glucose pattern recognition and advice
- LibreView integration for data import
- Patient parameter configuration (ISF, ICR, target ranges)
- Historical glucose metrics and visualizations

## Development Commands

**Package Manager**: Use `pnpm` (configured with pnpm@10.12.1)

```bash
# Development
pnpm dev                 # Start development server with Turbopack
pnpm build              # Build for production
pnpm start              # Start production server
pnpm lint               # Run ESLint
pnpm lint:fix           # Fix ESLint issues automatically

# Database Operations
pnpm db:generate        # Generate Drizzle migrations
pnpm db:migrate         # Apply migrations to database
pnpm db:pull            # Pull schema from database
pnpm db:push            # Push schema to database (use with caution)
```

## Architecture

### Tech Stack

- **Frontend**: Next.js 15.2.5 with React 19, TailwindCSS 4.1.7
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js 5.0.0-beta.27 with Drizzle adapter
- **AI**: Google Gemini 2.0 Flash via AI SDK
- **Deployment**: Vercel with PostgreSQL

### Database Schema

Core entities in `lib/db/schema.ts`:

- `users` - User authentication and profiles
- `csvRecords` - Individual glucose readings with timestamps, insulin, carbs
- `patientSettings` - Patient-specific parameters (ISF, ICR, target ranges)
- `glucoseMetrics` - Calculated time-in-range metrics by period
- `uploadedFiles` - File upload tracking
- Standard NextAuth tables (accounts, sessions, verificationToken)

### Service Layer Architecture

**Patient Settings Service** (`lib/services/settings/`):

- `getPatientSettings()` throws `"PATIENT_SETTINGS_NOT_CONFIGURED"` error when no settings exist
- This error is handled throughout the app to enforce configuration before AI assistance
- Uses unique constraint on `userId` for upsert operations

**Glucose Analysis Service** (`lib/services/glucose/`):

- `getUserMultiPeriodGlucoseAnalysis()` - Unified glucose data analysis
- Supports multiple time periods: "day", "7days", "14days", "30days", "90days"
- Returns both numerical metrics and human-readable text descriptions
- Calculates TIR (Time in Range), average glucose, variability

**LibreView Integration** (`lib/services/libreview/`):

- Automated CSV parsing and data import
- Progress tracking with Server-Sent Events
- Handles multiple CSV formats and validates data integrity

### AI Chat System

**Core Implementation** (`app/api/chat/route.ts`):

- Uses Google Gemini 2.0 Flash model
- Context includes glucose data, patient settings, and historical metrics
- **Critical**: Checks for patient configuration and informs user if settings missing
- Prompt is in Spanish and focuses on T1DM-specific guidance
- Provides insulin calculation assistance when settings are configured

### Error Handling Patterns

**Patient Settings Validation**:

- Services throw `"PATIENT_SETTINGS_NOT_CONFIGURED"` when settings missing
- API routes return 404 with specific error code for missing settings
- AI agent receives special instructions to inform user about required configuration

### File Structure Conventions

- `app/` - Next.js App Router structure
- `lib/services/` - Business logic organized by domain
- `lib/db/` - Database configuration and schema
- `lib/types/` - TypeScript type definitions
- `lib/validations/` - Zod schemas for data validation
- `components/ui/` - Reusable UI components (shadcn/ui based)

### Data Flow Architecture

**CSV Record Processing**:
- Unique constraint on `userId`, `timestamp`, and `recordType` prevents duplicates
- Records are parsed using strategy pattern for different CSV formats
- Progress tracking via Server-Sent Events during batch imports

**Metrics Calculation**:
- `glucoseMetrics` table stores pre-calculated TIR metrics by time period
- Unique constraint on `userId` and `timePeriod` for efficient upserts
- Metrics are recalculated when new data is imported

### Development Notes

**Language**: Code comments should be in Spanish as this is a Spanish-language medical application.

**Database Migrations**: Always run `pnpm db:generate` after schema changes, then `pnpm db:migrate` to apply.

**Environment**: Uses `.env.local` for local development. Database operations require `DATABASE_URL` environment variable.

**Testing**: No test framework currently configured. Manual testing via development server.