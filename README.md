# EASE Backend - NestJS with PostgreSQL

A comprehensive NestJS backend with PostgreSQL, featuring JWT authentication, TypeORM entities, and REST endpoints for the EASE application.

## Features

- ✅ **Authentication**: Email/password signup and login with JWT access and refresh tokens
- ✅ **Secure Password Hashing**: Using bcrypt for password security
- ✅ **Protected Routes**: JWT-based middleware for route protection
- ✅ **10 Database Entities**: User, Goal, Program, DayPlan, Task, AudioTrack, Quiz, QuizAttempt, Progress, RewardEvent
- ✅ **TypeORM**: UUID primary keys, timestamps, and foreign key relationships
- ✅ **Validation**: DTOs with class-validator decorators
- ✅ **Mock Program Generation**: Deterministic sample data (AI integration ready)

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure PostgreSQL Database

Create a PostgreSQL database for the application:

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ease_db;

# Exit psql
\q
```

### 3. Configure Environment Variables

Update the `.env` file with your PostgreSQL credentials:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_postgres_password
DATABASE_NAME=ease_db

JWT_SECRET=your-secret-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this-in-production
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

PORT=3000
```

**Important**: Replace `your_postgres_password` with your actual PostgreSQL password, and update the JWT secrets with secure random strings.

### 4. Start the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000/api`

## API Endpoints

### Authentication

#### Signup
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

### User Endpoints (Protected)

#### Get Current User
```bash
GET /api/me
Authorization: Bearer {accessToken}
```

#### Update User Settings
```bash
PATCH /api/me/settings
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "settings": {
    "theme": "dark",
    "notifications": true
  }
}
```

### Goals (Protected)

#### Create Goal
```bash
POST /api/goals
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "Learn Guitar",
  "description": "Master basic chords and strumming patterns",
  "category": "skill",
  "targetDate": "2026-06-01"
}
```

#### Get All Goals
```bash
GET /api/goals
Authorization: Bearer {accessToken}
```

### Programs (Protected)

#### Generate Program (Mock Data)
```bash
POST /api/programs/generate
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "goalId": "goal-uuid",
  "duration": 30
}
```

**Note**: This endpoint generates mock program data with sample day plans, tasks, audio tracks, and quizzes. Replace with AI integration later.

#### Get Program Details
```bash
GET /api/programs/{programId}
Authorization: Bearer {accessToken}
```

#### Get Today's Plan
```bash
GET /api/programs/{programId}/today
Authorization: Bearer {accessToken}
```

### Tasks (Protected)

#### Update Task
```bash
PATCH /api/tasks/{taskId}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "completed": true
}
```

### Quizzes (Protected)

#### Submit Quiz Attempt
```bash
POST /api/quizzes/{quizId}/attempts
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "answers": [0, 1, 2, 0]
}
```

**Response includes automatic scoring:**
```json
{
  "id": "uuid",
  "score": 75,
  "passed": true,
  "answers": [0, 1, 2, 0]
}
```

### Progress (Protected)

#### Create Check-in
```bash
POST /api/progress/checkin
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "mood": "motivated",
  "notes": "Great progress today!",
  "metrics": {
    "energy": 8,
    "focus": 9
  }
}
```

## Database Schema

The application uses TypeORM with automatic schema synchronization (in development). All entities have:
- UUID primary keys
- `created_at` and `updated_at` timestamps
- Proper foreign key relationships with cascade deletes

### Entities

1. **User** - Authentication and user data
2. **Goal** - User goals
3. **Program** - Generated programs linked to goals
4. **DayPlan** - Daily plans within programs
5. **Task** - Tasks within day plans
6. **AudioTrack** - Audio content for day plans
7. **Quiz** - Knowledge checks for day plans
8. **QuizAttempt** - User quiz submissions with scoring
9. **Progress** - User check-ins and progress tracking
10. **RewardEvent** - Gamification and rewards

## Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── dto/             # Login and signup DTOs
│   ├── guards/          # JWT auth guard
│   └── strategies/      # JWT strategy
├── users/               # User management
├── goals/               # Goals CRUD
├── programs/            # Program generation (mock)
│   └── entities/        # Program and DayPlan entities
├── tasks/               # Task updates
├── quizzes/             # Quiz attempts and scoring
│   └── entities/        # Quiz and QuizAttempt entities
├── progress/            # Progress check-ins
├── audio/               # Audio track entities
├── rewards/             # Reward event entities
└── common/              # Shared decorators and utilities
```

## Development Notes

### TypeScript Circular Dependencies
Some TypeScript lint warnings about circular entity imports are expected with TypeORM and will resolve at runtime. These are normal for bidirectional relationships.

### Database Synchronization
The app uses `synchronize: true` in development, which automatically creates/updates database tables. **Set to `false` in production** and use migrations instead.

### Next Steps for Production

1. Replace mock program generation with AI integration
2. Add database migrations (TypeORM CLI)
3. Implement refresh token rotation
4. Add rate limiting
5. Set up logging (Winston/Pino)
6. Add comprehensive error handling
7. Write unit and integration tests
8. Set up CI/CD pipeline

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## License

MIT
