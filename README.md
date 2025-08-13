# Deano Task Manager

A comprehensive full-stack task management application with strong dependency logic and an agent-friendly API. Built with Node.js, TypeScript, Express, Prisma, PostgreSQL, and Next.js.

## 🚀 Features

- **Task Management**: Create, update, delete, and organize tasks with hierarchical subtasks
- **Dependency Logic**: Define task dependencies with cycle detection and validation
- **Smart Scheduling**: Deterministic scheduling algorithm that respects dependencies and working hours
- **Agent-Friendly API**: RESTful API designed for LLM/agent integration
- **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS
- **Real-time Updates**: Live task status updates and dependency management
- **Export/Import**: Bulk import and export tasks in JSON/CSV formats
- **CLI Tools**: Command-line interface for scheduling and task management

## 🏗️ Architecture Overview

### Tech Stack

- **Backend**: Node.js 20, TypeScript, Express, Prisma ORM, PostgreSQL
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS
- **Infrastructure**: Docker Compose for local development
- **Testing**: Vitest + Supertest for API testing
- **Documentation**: OpenAPI/Swagger for API documentation
- **Validation**: Zod for runtime type validation

### Project Structure

```
Deano2/
├── packages/
│   ├── api/                 # Backend API service
│   │   ├── src/
│   │   │   ├── controllers/ # API route handlers
│   │   │   ├── services/    # Business logic layer
│   │   │   ├── lib/         # Utilities and configuration
│   │   │   ├── routes/      # Express route definitions
│   │   │   └── scripts/     # CLI and seed scripts
│   │   ├── prisma/          # Database schema and migrations
│   │   └── Dockerfile       # API container configuration
│   └── web/                 # Frontend Next.js application
│       ├── src/
│       │   ├── app/         # Next.js App Router pages
│       │   ├── components/  # React components
│       │   └── types/       # TypeScript type definitions
│       └── Dockerfile       # Frontend container configuration
├── docker-compose.yml       # Local development environment
└── package.json            # Monorepo configuration
```

## 📊 Domain Model

### Task Entity

```typescript
interface Task {
  id: string;                           // Unique identifier
  title: string;                        // Task title (3-200 chars)
  description?: string;                 // Optional description
  status: TaskStatus;                   // Todo | InProgress | Blocked | Completed | Canceled
  priority: Priority;                   // Low | Medium | High
  dueAt?: Date;                         // Optional due date
  estimatedDurationMinutes: number;     // Duration estimate (default: 30)
  allowParentAutoComplete: boolean;     // Auto-complete children when parent completes
  parentId?: string;                    // Parent task reference
  scheduledStart?: Date;                // Calculated start time
  scheduledEnd?: Date;                  // Calculated end time
  createdAt: Date;                      // Creation timestamp
  updatedAt: Date;                      // Last update timestamp
}
```

### Dependency Entity

```typescript
interface Dependency {
  id: string;              // Unique identifier
  taskId: string;          // Dependent task
  dependsOnTaskId: string; // Blocker task
  createdAt: Date;         // Creation timestamp
}
```

## 🧠 Business Rules

### Task Hierarchy
- Tasks can have parent/child relationships (subtasks)
- A parent can only be "Completed" if:
  - All subtasks are completed, OR
  - `allowParentAutoComplete` is true (auto-completes incomplete children)
- Deleting a parent task requires all children to be deleted or reassigned first

### Dependency Management
- Tasks can depend on other tasks (blocking relationships)
- Self-dependencies are not allowed
- Circular dependencies are detected and prevented
- Dependencies are enforced during scheduling but don't block manual status changes
- Users can set status to "Blocked" if dependencies are incomplete

### Task Completion Logic
- Completing a subtask does not auto-complete the parent
- Attempting to complete a parent with incomplete children:
  - Returns 409 error if `allowParentAutoComplete = false`
  - Auto-completes children if `allowParentAutoComplete = true`
- Only completed tasks can be reopened

## ⏰ Scheduling Algorithm

### Overview
The scheduling algorithm is deterministic and produces a suggested plan based on:
- Task dependencies (DAG)
- Due dates and priorities
- Estimated durations
- Working hours and daily capacity
- Parent/child relationships

### Algorithm Steps

1. **Dependency Analysis**
   - Build dependency graph from tasks
   - Detect cycles using DFS (returns 422 error if cycles found)
   - Perform topological sort

2. **Task Ordering**
   - Overdue tasks first
   - Earliest due date
   - Priority (High > Medium > Low)
   - Shortest duration
   - Creation date

3. **Scheduling Logic**
   - Start from specified start date (default: now, rounded to next 15-min slot)
   - For each task:
     - Wait for all blockers to complete
     - Align to working hours window
     - Respect daily capacity limits
     - Check for due date violations
     - Handle parent/child constraints

4. **Output**
   - Array of scheduled tasks with start/end times
   - Constraint violations and notes
   - Summary statistics

### Complexity
- **Time**: O(V + E) for dependency analysis + O(V log V) for sorting + O(V) for scheduling = O(V log V + E)
- **Space**: O(V + E) for dependency graph storage

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker and Docker Compose
- PostgreSQL (provided via Docker)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd Deano2
npm install
```

### 2. Environment Configuration

```bash
# Copy environment files
cp packages/api/env.example packages/api/.env
cp packages/web/env.example packages/web/.env

# Edit configuration as needed
```

### 3. Start Development Environment

```bash
# Start all services
npm run setup

# Or start individually:
npm run docker:up      # Start PostgreSQL
npm run db:migrate     # Run database migrations
npm run db:seed        # Seed sample data
npm run dev            # Start API and frontend
```

### 4. Access Applications

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs
- **Database**: localhost:5432 (deano/deano_password)

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start both API and frontend
npm run dev:api          # Start API only
npm run dev:web          # Start frontend only

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed sample data
npm run db:studio        # Open Prisma Studio

# Testing
npm run test             # Run all tests
npm run test:api         # Run API tests
npm run test:web         # Run frontend tests

# Building
npm run build            # Build both packages
npm run build:api        # Build API
npm run build:web        # Build frontend

# CLI Tools
npm run cli schedule     # Run scheduler
npm run cli list         # List tasks
npm run cli create       # Create task
npm run cli complete     # Complete task
```

### CLI Usage Examples

```bash
# Plan a schedule
npm run cli schedule --working-hours "09:00-17:30" --daily-capacity 480

# List high priority tasks
npm run cli list --priority High

# Create a task
npm run cli create "Review code" --priority High --due "2024-01-15"

# Complete a task
npm run cli complete clm123456 --force-parent-auto-complete
```

## 📚 API Documentation

### Core Endpoints

#### Tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks` - List tasks with filtering
- `GET /api/tasks/:id` - Get task details
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

#### Subtasks
- `POST /api/tasks/:id/subtasks` - Add subtask

#### Dependencies
- `POST /api/tasks/:id/dependencies` - Add dependency
- `PUT /api/tasks/:id/dependencies` - Set all dependencies
- `DELETE /api/tasks/:id/dependencies/:dependsOnTaskId` - Remove dependency

#### Task Actions
- `POST /api/tasks/:id/complete` - Complete task
- `POST /api/tasks/:id/reopen` - Reopen task

#### Scheduling
- `POST /api/schedule/plan` - Plan schedule

#### Bulk Operations
- `POST /api/tasks/bulkImport` - Bulk import tasks
- `GET /api/tasks/export` - Export tasks

### Example API Calls

#### Create Task
```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review pull request",
    "description": "Review the new feature implementation",
    "priority": "High",
    "dueAt": "2024-01-15T17:00:00Z",
    "estimatedDurationMinutes": 60
  }'
```

#### Plan Schedule
```bash
curl -X POST http://localhost:3001/api/schedule/plan \
  -H "Content-Type: application/json" \
  -d '{
    "workingHours": {
      "start": "09:00",
      "end": "17:30"
    },
    "dailyCapacity": 480,
    "commit": false
  }'
```

#### Complete Task with Children
```bash
curl -X POST http://localhost:3001/api/tasks/clm123456/complete \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "forceParentAutoComplete"
  }'
```

## 🤖 Agent Integration

The API is designed to be agent-friendly with:

- **Consistent Response Format**: All responses follow `{ data?, error? }` pattern
- **Comprehensive Error Codes**: Detailed error information for debugging
- **Bulk Operations**: Import/export capabilities for batch processing
- **Deterministic Scheduling**: Predictable scheduling algorithm
- **OpenAPI Documentation**: Machine-readable API specification

### Example Agent Workflow

```typescript
// 1. Create tasks
const tasks = await api.post('/tasks/bulkImport', {
  tasks: [
    { title: "Setup project", priority: "High" },
    { title: "Write tests", priority: "Medium" },
    { title: "Deploy", priority: "High", dependencies: ["Setup project", "Write tests"] }
  ]
});

// 2. Plan schedule
const schedule = await api.post('/schedule/plan', {
  workingHours: { start: "09:00", end: "17:30" },
  dailyCapacity: 480
});

// 3. Monitor progress
const progress = await api.get('/tasks?status=InProgress');
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm run test:api
npm run test:web

# Watch mode
npm run test:watch
```

### Test Coverage

The application maintains ≥80% test coverage on the service layer, including:
- Business rule validation
- Dependency cycle detection
- Scheduling algorithm
- Task completion logic
- Error handling

## 🚀 Deployment

### Docker Production

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Or build individually
docker build -f packages/api/Dockerfile -t deano-api .
docker build -f packages/web/Dockerfile -t deano-web .
```

### Environment Variables

#### Production API
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
NODE_ENV=production
JWT_SECRET=your-secure-jwt-secret
BYPASS_AUTH=false
```

#### Production Frontend
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NODE_ENV=production
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation at `/api/docs`
- Review the CLI help: `npm run cli --help`

---

Built with ❤️ using modern web technologies and best practices.
