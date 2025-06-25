# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build production version
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests with Vitest
- `pnpm test:watch` - Run tests in watch mode

### Supabase (Local Development)

- `supabase start` - Start local Supabase instance
- `supabase stop` - Stop local Supabase instance
- `supabase db reset` - Reset database with migrations and seeds
- `supabase migration new <name>` - Create new migration

## Architecture Overview

This is a Next.js 15 + Supabase medical facility directory application with the following key architectural decisions:

### Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS v4, ShadCN UI
- **Backend**: Supabase (Auth, Database, Storage), Next.js Server Actions
- **Testing**: Vitest with React Testing Library
- **Package Manager**: pnpm (required - uses pnpm workspaces)

### Project Structure

```
src/
├── actions/           # Server Actions (preferred over API routes)
├── app/              # Next.js App Router (routing + page components only)
├── components/       # Shared components (auth, medical, nav, ui)
├── lib/              # Domain logic (medical data, localdata Python scripts)
├── utils/            # Utilities (Supabase clients, SEO)
├── middleware.ts     # Route protection & session management
└── types/            # TypeScript schemas and types
```

### Key Patterns

**Authentication Flow:**

- Uses Supabase Auth with SSR support
- Middleware handles session updates and route protection
- Protected routes: `/profile` (configurable in `src/utils/supabase/middleware.ts`)
- Auth callbacks handled at `/auth/callback`

**Data Layer:**

- Server Actions in `src/actions/` for mutations
- Supabase clients: `server.ts` (SSR), `client.ts` (CSR), `middleware.ts` (middleware)
- Medical facility data managed through typed interfaces in `src/lib/medical/`

**Component Architecture:**

- Server Components by default (Next.js 13+ pattern)
- Client Components marked with `"use client"` directive
- UI components from ShadCN in `src/components/ui/`
- Business logic components in domain folders (`auth/`, `medical/`, `nav/`)

### Database Schema

The application uses a sophisticated medical facility database with:

- **facilities**: Main medical facility data with PostGIS support
- **facility_types**: Service type categorization
- **specialties**: Medical specialties with search synonyms
- **facility_specialties**: Many-to-many relationship table

### Medical Data Domain

This application manages Korean medical facility data including:

- Hospitals, clinics, and pharmacies
- License information and operational status
- Geographic data with PostGIS integration
- CSV import/export functionality via Python scripts in `src/lib/localdata/`

## Development Conventions

### File Naming

- **Files**: kebab-case (`medical-facility.tsx`)
- **Components**: PascalCase (`MedicalFacility`)
- **Functions**: camelCase (`getMedicalFacilities`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)

### Component Organization

- One component per file
- Props interface defined above component
- Comprehensive JSDoc comments (first 100 lines)
- Export component as default, types as named exports

### Server vs Client Components

- **Server Components**: Data fetching, database queries, authentication checks
- **Client Components**: Interactive elements, form handling, state management
- Use `"use client"` directive only when necessary

### Testing Strategy

- **Unit Tests**: Vitest for utilities and pure functions
- **Component Tests**: React Testing Library for UI components
- **Integration Tests**: Server Actions and API endpoints
- Test files in `tests/__tests__/` directory

### Error Handling

- Use try-catch blocks in Server Actions
- Return structured error objects with `success: false`
- Display user-friendly error messages via toast notifications

### SEO Implementation

- Metadata utilities in `src/utils/seo/`
- Structured data with JSON-LD
- Dynamic sitemap generation
- Progressive Web App (PWA) configuration

## Key Dependencies

### Core Framework

- `next@15.3.2` - Next.js framework
- `react@19.0.0` - React library
- `@supabase/ssr` - Supabase SSR integration
- `@supabase/supabase-js` - Supabase client

### UI & Styling

- `tailwindcss@4` - Utility-first CSS framework
- `@radix-ui/*` - Headless UI components
- `lucide-react` - Icon library
- `next-themes` - Dark mode support

### Data & Forms

- `@tanstack/react-query` - Server state management
- `react-hook-form` - Form handling
- `zod` - Schema validation
- `csv-parse` - CSV processing

### Testing

- `vitest` - Test framework
- `@testing-library/react` - React testing utilities
- `jsdom` - DOM environment for tests

## Environment Setup

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_STORAGE_BUCKET=your-bucket-name
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE=your-service-role-key
SUPABASE_DB_PASSWORD=your-db-password
```

## Deployment Considerations

### Vercel Configuration

- `vercel.json` configures cron jobs and function timeouts
- Environment variables must be set in Vercel dashboard
- Automatic deployments on push to main branch

### Supabase Configuration

- Production database requires manual migration application
- Storage bucket must be configured with proper policies
- Auth redirects must include production URLs

## AI Development Guidelines

### Context Management

- Use `.cursor/` directory for maintaining project context
- Document architectural decisions in `memory-bank.mdc`
- Keep TODOs updated in `.cursor/TODO.md`

### Code Quality

- Follow TDD approach: write tests first
- Use external search for error resolution
- Maintain comprehensive documentation
- Implement incremental refactoring strategies

### Security Considerations

- Never commit sensitive data (API keys, passwords)
- Use environment variables for all secrets
- Implement proper authentication checks
- Validate all user inputs with Zod schemas

## Medical Data Processing

### Python Scripts

- Located in `src/lib/localdata/`
- Handles CSV parsing and Supabase upload
- Requires Python dependencies in `requirements-medical-data.txt`
- Run via Node.js scripts in `scripts/` directory

### Data Import Process

1. CSV files placed in `src/app/data/`
2. Python scripts process and validate data
3. Upload to Supabase via service role
4. Missing data handled by `upload-missing-rows.mjs`

### Search & Filtering

- PostgreSQL full-text search with pg_trgm extension
- Geographic search with PostGIS
- Multi-dimensional filtering (date, category, region, contact)
- Optimized with database indexes
