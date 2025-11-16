# Ubiquitous Language System - Project Setup

## Project Structure

This is a monorepo containing the Ubiquitous Language System with the following structure:

```
ubiquitous-language-system/
├── apps/
│   ├── api/          # Hono backend API
│   └── web/          # Next.js frontend
├── packages/
│   └── types/        # Shared TypeScript types and interfaces
├── package.json      # Root package.json with workspaces
├── turbo.json        # Turborepo configuration
└── tsconfig.json     # Base TypeScript configuration
```

## Technology Stack

### Frontend (apps/web)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: React 18

### Backend (apps/api)
- **Framework**: Hono
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Search**: MeiliSearch
- **AI**: OpenAI API

### Shared (packages/types)
- **Purpose**: Shared TypeScript types, interfaces, and DTOs
- **Exports**: Entity types, DTOs, Service interfaces

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database
- MeiliSearch instance (optional for search features)
- OpenAI API key (optional for AI features)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:

For the API (apps/api/.env):
```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your configuration
```

For the Web app (apps/web/.env):
```bash
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env with your configuration
```

3. Build the shared types package:
```bash
npm run build --workspace=@ubiquitous/types
```

### Development

Run all applications in development mode:
```bash
npm run dev
```

Or run individual applications:

```bash
# Run API only
npm run dev --workspace=@ubiquitous/api

# Run Web only
npm run dev --workspace=@ubiquitous/web

# Watch types package
npm run dev --workspace=@ubiquitous/types
```

### Building for Production

Build all packages:
```bash
npm run build
```

## Next Steps

1. Set up PostgreSQL database and run migrations (Task 2)
2. Implement bounded context management (Task 3)
3. Implement term management features (Task 4)
4. Continue with remaining tasks as per the implementation plan

## Package Dependencies

The `@ubiquitous/types` package is used by both `api` and `web` applications to ensure type consistency across the entire system.

## Development Workflow

1. Make changes to shared types in `packages/types/src/`
2. The types package will automatically rebuild in watch mode
3. Both API and Web apps will pick up the changes
4. Implement features according to the task list in `.kiro/specs/ubiquitous-language-system/tasks.md`
