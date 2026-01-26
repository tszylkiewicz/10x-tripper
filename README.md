# Tripper

AI-powered trip planning application that converts user notes into detailed, multi-day travel itineraries.

## Overview

Tripper is a web application that helps users plan trips by leveraging generative AI to transform simplified notes into comprehensive travel plans. The MVP focuses on:

- User account management and travel preferences
- Creating and storing trip plans
- AI-powered plan generation, editing, and acceptance
- Mobile-first responsive design

## Tech Stack

### Frontend
- [Astro](https://astro.build/) v5 - Modern web framework with SSR
- [React](https://react.dev/) v19 - Interactive UI components
- [TypeScript](https://www.typescriptlang.org/) v5 - Type-safe development
- [Tailwind CSS](https://tailwindcss.com/) v4 - Utility-first styling
- [Shadcn/ui](https://ui.shadcn.com/) - Accessible UI components

### Backend
- [Supabase](https://supabase.com/) - Backend-as-a-Service
  - PostgreSQL database
  - Built-in authentication
  - Row-Level Security (RLS)

### AI
- [Openrouter.ai](https://openrouter.ai/) - AI model access
  - Multiple model providers (OpenAI, Anthropic, Google)
  - API key limits and usage control

### CI/CD & Hosting
- GitHub Actions - CI/CD pipelines
- [Cloudflare Pages](https://pages.cloudflare.com/) - Hosting platform
  - Unlimited bandwidth (free tier)
  - Automatic preview deployments
  - Global edge network

## Prerequisites

- Node.js v22.14.0 (use `.nvmrc` for version management)
- npm (comes with Node.js)
- Supabase account (for backend services)
- Openrouter.ai API key (for AI features)

## Getting Started

1. Clone the repository:

```bash
git clone <repository-url>
cd 10x-tripper
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory based on `.env.example`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=your_preferred_model # e.g., anthropic/claude-3.5-sonnet
PUBLIC_APP_URL=http://localhost:3000
PUBLIC_ENV_NAME=local
```

4. Set up Supabase:

```bash
# Run database migrations
npm run db:migrate
```

5. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run dev:e2e` - Start development server in test mode
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier

### Database
- `npm run db:migrate` - Run Supabase migrations

### Testing
- `npm test` - Run unit tests
- `npm run test:ui` - Run tests with UI
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run test:e2e` - Run E2E tests with Playwright
- `npm run test:e2e:ui` - Run E2E tests with Playwright UI
- `npm run test:e2e:debug` - Debug E2E tests
- `npm run test:e2e:codegen` - Generate E2E test code

## Project Structure

```
.
├── src/
│   ├── pages/              # Astro pages and routes
│   │   ├── api/            # API endpoints
│   │   ├── trip-plans/     # Trip plan pages
│   │   ├── index.astro     # Landing page
│   │   ├── login.astro     # Login page
│   │   ├── register.astro  # Registration page
│   │   └── preferences.astro # User preferences page
│   ├── components/         # UI components
│   │   ├── ui/             # Shadcn/ui components
│   │   ├── landing/        # Landing page components
│   │   ├── auth/           # Authentication components
│   │   ├── dashboard/      # Dashboard components
│   │   ├── trip-plans/     # Trip plan components
│   │   └── navigation/     # Navigation components
│   ├── layouts/            # Astro layouts
│   ├── lib/                # Business logic
│   │   ├── services/       # Service layer (business logic)
│   │   ├── validators/     # Zod validation schemas
│   │   ├── utils/          # Utility functions
│   │   └── constants/      # Application constants
│   ├── preferences/        # User preferences feature
│   │   ├── components/     # Preference components
│   │   └── hooks/          # React hooks for preferences
│   ├── db/                 # Database configuration
│   │   ├── supabase.client.ts    # Supabase client
│   │   └── database.types.ts     # Generated DB types
│   ├── middleware/         # Astro middleware
│   ├── features/           # Feature flags
│   ├── errors/             # Custom error classes
│   ├── styles/             # Global styles
│   └── types.ts            # Shared TypeScript types
├── supabase/               # Supabase configuration
│   └── migrations/         # Database migrations
├── public/                 # Static assets
└── .ai/                    # AI development documentation
    ├── prd.md              # Product Requirements Document
    └── tech-stack.md       # Technical stack documentation
```

## Key Features

- **User Authentication** - Email/password registration and login with email verification
- **User Preferences** - Save and manage travel preference templates
- **AI Trip Generation** - Generate detailed trip plans using AI
- **Plan Editing** - Edit AI-generated plans before saving
- **Plan Management** - View, edit, and delete saved trip plans
- **Mobile-First Design** - Fully responsive on screens < 400px
- **Analytics** - Track AI vs. user-edited plans

## Deployment

This project is configured for deployment on **Cloudflare Pages**.

### Deploy to Cloudflare Pages

1. Connect your repository to Cloudflare Pages
2. Configure build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node.js version:** `22` (set via environment variable `NODE_VERSION`)
3. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL`
   - `PUBLIC_APP_URL`
   - `PUBLIC_ENV_NAME=production`

### Preview Deployments

Every pull request automatically gets a preview deployment URL for easy review before merging.

## Development Guidelines

- See `CLAUDE.md` for detailed development guidelines and architecture patterns
- Use `.astro` files for static content, React components for interactivity
- All API endpoints use `export const prerender = false`
- Database access through `context.locals.supabase` in Astro routes
- Validate all API inputs with Zod schemas
- Follow soft-delete pattern for user data

## License

MIT
