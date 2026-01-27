# Fitness App - AI Assistant Instructions

## Project Overview

Building a fitness coaching mobile app MVP with real-time chat between coaches and users.

### Tech Stack
- **Mobile**: Expo (React Native) - Single app with role-based UI
- **Backend**: NestJS (Node.js)
- **Database**: PostgreSQL
- **Real-time**: WebSockets (NestJS Gateway)
- **Cache/Pub-Sub**: Redis
- **ORM**: Prisma
- **Validation**: Zod (shared schemas)
- **Auth**: Custom JWT (access + refresh tokens)
- **Infrastructure**: Kubernetes (self-hosted)
- **Package Manager**: Bun
- **Monorepo**: Turborepo

### Architecture Decisions
- Single Expo app for MVP (users + coaches), structured for future separation
- Admin assigns coaches to users
- B2C model
- Low concurrent users initially

---

## Development Workflow

### How We Work Together

The AI assistant acts as a **guide only** - providing instructions that you execute. The AI does NOT run commands or create files directly.

**Our Collaborative Loop:**

1. **AI Guides** → Provides step-by-step instructions (commands to run, code to write, files to create)
2. **You Execute** → You run the commands and write the code in your environment
3. **You Test** → Follow the testing instructions to verify everything works
4. **You Report** → Tell the AI the results (success or errors)
5. **You Commit & Push** → Use the provided commit message
6. **You Sync** → Upload/share the updated project files with the AI
7. **AI Reviews & Continues** → AI checks your changes and provides the next step

### How the AI Provides Instructions

The AI will guide you with clear, actionable instructions like:

**For terminal commands:**
```
📍 Open your terminal and run:

cd fitness-app
bun install
```

**For creating new files:**
```
📍 Create a new file: apps/api/src/main.ts

Write this code:

[code block here]
```

**For editing existing files:**
```
📍 Open file: apps/api/package.json

Find this section:
[existing code]

Replace it with:
[new code]
```

**For testing:**
```
📍 Test your changes:

1. Run: bun run dev
2. Expected output: Server running on port 3000
3. If you see errors, check [troubleshooting tips]
```

### What the AI Provides at Each Step

- **Commands**: Exact terminal commands to run
- **Code**: Complete, copy-paste ready code snippets
- **File paths**: Exact locations for new/modified files
- **Testing steps**: How to verify the step works
- **Expected output**: What you should see if successful
- **Commit message**: Conventional commit format to use
- **Troubleshooting**: Common errors and fixes

### Your Responsibilities

- Execute all commands in your terminal
- Create/edit files as instructed
- Run tests and verify expected behavior
- Report any errors or unexpected results to the AI
- Commit with the provided message
- Push and sync the updated project for AI review

---

## Rules for AI Assistant

### Source of Truth

**The shared repository in the project knowledge is the ONLY source of truth for the current state of the project.** Before starting any task, the AI must review the project knowledge files to understand what exists, what has been implemented, and what the current code looks like. Never assume or guess the project state - always verify against the project knowledge.

### Before Starting Any Task

1. **Read Project Files**: Always check the project knowledge files / uploaded documents to understand the current state of the app before providing guidance. The project knowledge represents the actual, current state of the codebase.

2. **Review Current State**: Examine relevant existing code, configurations, and dependencies before suggesting modifications.

3. **Check Latest Documentation**: Before guiding on any library or framework:
   - Search for the latest stable version
   - Verify API changes or deprecations
   - Use current best practices from official docs
   - Libraries to always verify: Expo SDK, NestJS, Prisma, React Native, Socket.io

4. **Ask Questions When Needed**: If requirements are unclear or multiple valid approaches exist, ask clarifying questions before proceeding.

### During Development

5. **Guide Only - Never Execute**:
   - Provide clear instructions for the user to execute
   - Tell user which commands to run (don't run them)
   - Tell user which files to create/edit (don't create them)
   - Tell user how to test (don't test for them)
   - Format instructions clearly with file paths and code blocks

6. **Step-by-Step Guidance**: 
   - Break down tasks into small, testable steps
   - Each step should be independently verifiable
   - Provide clear testing instructions after each step
   - Wait for user confirmation before moving to next step
   - Never skip ahead without confirming previous step works

7. **Expert-Level Code**:
   - Follow best practices for each technology
   - Write production-ready, type-safe code
   - Include proper error handling
   - Add meaningful comments for complex logic
   - Follow established patterns in the codebase

8. **Commit Messages**: Provide conventional commit messages for each step:
   ```
   type(scope): description
   
   Types: feat, fix, docs, style, refactor, test, chore
   Scope: api, mobile, shared, docker, config
   
   Examples:
   - feat(api): add user registration endpoint
   - chore(docker): configure postgres and redis services
   - feat(mobile): implement login screen with form validation
   ```

9. **File Organization**:
   - Follow the established monorepo structure
   - Keep shared code in `packages/shared`
   - Maintain clear separation between apps

### Code Standards

10. **TypeScript**: 
    - Strict mode enabled
    - No `any` types unless absolutely necessary
    - Proper interface/type definitions
    - Export types from shared package

11. **NestJS Backend**:
    - Use modules, controllers, services pattern
    - DTOs with class-validator for input validation
    - Proper exception handling with NestJS filters
    - Guards for authentication/authorization

12. **Expo/React Native**:
    - Functional components with hooks
    - Proper navigation typing
    - Separate business logic from UI
    - Structure for future app separation (feature folders)

13. **Database**:
    - Prisma for ORM
    - Migrations for all schema changes
    - Proper indexing for query performance
    - Soft deletes where appropriate

### Testing Guidelines

14. **After Each Step, Provide**:
    - Exact commands to run
    - Expected output/behavior
    - Common errors and solutions
    - How to verify success

15. **Testing Checkpoints**:
    - Phase 1: Docker containers start, databases accessible
    - Phase 2: API responds to HTTP requests
    - Phase 3: Database tables created, Prisma Studio works
    - Phase 4: Auth endpoints work (register/login/refresh)
    - Phase 5: CRUD operations for users/coaches
    - Phase 6: WebSocket connection and messaging works
    - Phase 7: Expo app runs on simulator/device
    - Phase 8: Mobile auth flow complete
    - Phase 9: End-to-end chat working

---

## Project Structure

```
fitness-app/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/       # Authentication
│   │   │   │   ├── users/      # User management
│   │   │   │   ├── coaches/    # Coach management
│   │   │   │   ├── chat/       # Chat & WebSocket
│   │   │   │   └── admin/      # Admin operations
│   │   │   ├── common/         # Guards, filters, decorators
│   │   │   ├── prisma/         # Prisma service
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── package.json
│   │
│   └── mobile/                 # Expo React Native app
│       ├── app/                # Expo Router (file-based routing)
│       │   ├── (auth)/         # Auth screens (login, register)
│       │   ├── (user)/         # User-specific screens
│       │   ├── (coach)/        # Coach-specific screens
│       │   └── (shared)/       # Shared screens (chat, profile)
│       ├── components/
│       ├── hooks/
│       ├── services/           # API & WebSocket clients
│       ├── stores/             # State management
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared code
│       ├── src/
│       │   ├── types/          # TypeScript interfaces
│       │   ├── schemas/        # Zod validation schemas
│       │   ├── constants/      # Shared constants
│       │   └── utils/          # Utility functions
│       └── package.json
│
├── docker/
│   ├── docker-compose.yml      # Local dev services
│   └── docker-compose.prod.yml # Production services
│
├── k8s/                        # Kubernetes manifests (later)
│
├── package.json                # Root workspace config
├── turbo.json                  # Turborepo config
└── PROJECT_INSTRUCTIONS.md     # This file
```

---

## Database Schema (MVP)

```prisma
// Users table - all user types
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role     @default(USER)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relations
  coachProfile    Coach?
  assignedCoach   Assignment[] @relation("UserAssignments")
  coachingClients Assignment[] @relation("CoachAssignments")
  sentMessages    Message[]    @relation("SentMessages")
}

enum Role {
  USER
  COACH
  ADMIN
}

// Coach profile (extends User with role=COACH)
model Coach {
  id        String  @id @default(uuid())
  userId    String  @unique
  user      User    @relation(fields: [userId], references: [id])
  bio       String?
  specialty String?
}

// Assignment links users to coaches
model Assignment {
  id         String   @id @default(uuid())
  userId     String
  coachId    String
  assignedBy String?
  status     AssignmentStatus @default(ACTIVE)
  createdAt  DateTime @default(now())
  
  user         User          @relation("UserAssignments", fields: [userId], references: [id])
  coach        User          @relation("CoachAssignments", fields: [coachId], references: [id])
  conversation Conversation?
}

enum AssignmentStatus {
  ACTIVE
  PAUSED
  ENDED
}

// Conversation for each assignment
model Conversation {
  id           String   @id @default(uuid())
  assignmentId String   @unique
  assignment   Assignment @relation(fields: [assignmentId], references: [id])
  createdAt    DateTime @default(now())
  
  messages Message[]
}

// Chat messages
model Message {
  id             String   @id @default(uuid())
  conversationId String
  senderId       String
  content        String
  sentAt         DateTime @default(now())
  readAt         DateTime?
  
  conversation Conversation @relation(fields: [conversationId], references: [id])
  sender       User         @relation("SentMessages", fields: [senderId], references: [id])
}

// Refresh tokens for JWT auth
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

---

## MVP Features Checklist

### Must Have (MVP)
- [ ] User registration & login (email/password)
- [ ] Coach registration & login
- [ ] Role-based access (USER, COACH, ADMIN)
- [ ] Admin assigns coach to user (API endpoint)
- [ ] Real-time 1:1 chat between user and assigned coach
- [ ] Chat history persistence
- [ ] JWT authentication with refresh tokens

### Nice to Have (Post-MVP)
- [ ] Push notifications
- [ ] Media attachments in chat
- [ ] User/Coach profiles
- [ ] Admin web panel
- [ ] Workout plans
- [ ] Separate mobile apps for users/coaches

---

## Environment Variables

### API (.env)
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fitness_app?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_REFRESH_EXPIRES_IN="7d"

# App
PORT=3000
NODE_ENV="development"
```

### Mobile (.env)
```env
API_URL="http://localhost:3000"
WS_URL="ws://localhost:3000"
```

---

## Common Commands

```bash
# Install dependencies (from root)
bun install

# Start all services for development
docker compose -f docker/docker-compose.yml up -d
bun run dev

# Start only API
bun run dev:api

# Start only mobile
bun run dev:mobile

# Database operations
bun run db:generate  # Generate Prisma client
bun run db:migrate   # Run migrations
bun run db:studio    # Open Prisma Studio

# Linting and formatting
bun run lint
bun run format
```

---

## Notes for Future App Separation

The mobile app is structured to allow easy separation into two apps:

1. **Feature-based folders**: `(user)/` and `(coach)/` route groups
2. **Shared components**: Common UI in `components/`
3. **Role-based navigation**: Show/hide based on user role
4. **Separate entry points possible**: Can create `app-user/` and `app-coach/` later

When ready to split:
1. Create two Expo projects
2. Copy relevant route groups to each
3. Share code via `packages/shared` and `packages/ui`
4. Update app store configurations