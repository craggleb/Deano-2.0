# Testing Guide for Deano Task Manager

This document provides comprehensive information about the testing setup for the Deano Task Manager project.

## Overview

The project uses a comprehensive testing strategy with:
- **Unit Tests**: Testing individual functions and components
- **Integration Tests**: Testing API endpoints and database interactions
- **Component Tests**: Testing React components with user interactions
- **Coverage Reports**: Ensuring adequate test coverage

## Test Structure

### API Tests (`packages/api/`)

#### Unit Tests
- **TaskService Tests** (`src/services/__tests__/taskService.test.ts`)
  - Task creation, updating, and deletion
  - Task hierarchy (parent-child relationships)
  - Dependency management
  - Task completion and reopening
  - Scheduling functionality
  - Business rule validation

- **LabelService Tests** (`src/services/__tests__/labelService.test.ts`)
  - Label CRUD operations
  - Label assignment to tasks
  - Task count tracking
  - Validation and error handling

#### Integration Tests
- **API Integration Tests** (`src/__tests__/api.integration.test.ts`)
  - All REST API endpoints
  - Request/response validation
  - Error handling
  - Database state verification

### Web Tests (`packages/web/`)

#### Component Tests
- **TaskList Tests** (`src/components/__tests__/TaskList.test.tsx`)
  - Component rendering
  - User interactions (edit, delete, complete)
  - Task hierarchy display
  - Label display
  - Accessibility features

- **CreateTaskModal Tests** (`src/components/__tests__/CreateTaskModal.test.tsx`)
  - Form validation
  - User input handling
  - Modal interactions
  - Error handling
  - Loading states

#### Utility Tests
- **Date Utils Tests** (`src/lib/__tests__/dateUtils.test.ts`)
  - Date formatting
  - Duration formatting
  - Timezone handling
  - Edge cases

## Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Using the Test Runner Script

The project includes a comprehensive test runner script:

```bash
# Run all tests with coverage
./scripts/test-runner.sh --coverage

# Run only API tests
./scripts/test-runner.sh --api-only

# Run only web tests
./scripts/test-runner.sh --web-only

# Skip linting
./scripts/test-runner.sh --no-lint

# Skip type checking
./scripts/test-runner.sh --no-type-check

# Show help
./scripts/test-runner.sh --help
```

### Individual Package Testing

#### API Package
```bash
cd packages/api

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test -- --watch

# Run tests with UI
npm run test:ui

# Run linting
npm run lint

# Run type checking
npm run type-check
```

#### Web Package
```bash
cd packages/web

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test -- --watch

# Run tests with UI
npm run test:ui

# Run linting
npm run lint

# Run type checking
npm run type-check
```

## Test Configuration

### API Test Setup
- **Framework**: Vitest
- **Database**: Uses Docker container for integration tests
- **Coverage**: V8 coverage provider
- **Setup**: `src/test/setup.ts` handles database connection

### Web Test Setup
- **Framework**: Vitest with React Testing Library
- **Environment**: jsdom for DOM simulation
- **Coverage**: V8 coverage provider
- **Setup**: `src/test/setup.ts` handles Next.js mocking

## Coverage Reports

Coverage reports are generated in HTML format and can be viewed in a browser:

- **API Coverage**: `packages/api/coverage/index.html`
- **Web Coverage**: `packages/web/coverage/index.html`

### Coverage Targets
- **Statements**: 80%+
- **Branches**: 80%+
- **Functions**: 80%+
- **Lines**: 80%+

## Test Data and Fixtures

### API Test Data
Tests use a clean database for each test run:
- Database is reset before each test
- Test data is created as needed
- No persistent test data

### Web Test Data
- Mock data is defined in test files
- API calls are mocked using `vi.mock()`
- User interactions are simulated with `@testing-library/user-event`

## Best Practices

### Writing Tests

1. **Test Structure**: Use descriptive test names and group related tests
2. **Arrange-Act-Assert**: Structure tests with clear sections
3. **Isolation**: Each test should be independent
4. **Coverage**: Aim for high coverage but focus on critical paths
5. **Readability**: Tests should be easy to understand and maintain

### Example Test Structure
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something specific', async () => {
    // Arrange
    const user = userEvent.setup();
    
    // Act
    await user.click(button);
    
    // Assert
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Mocking Guidelines

1. **API Calls**: Mock external dependencies
2. **Time**: Mock date/time functions for consistent tests
3. **Browser APIs**: Mock browser-specific APIs in web tests
4. **Database**: Use test database for integration tests

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Ensure Docker is running
docker-compose up -d db

# Wait for database to be ready
sleep 10
```

#### Test Environment Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules packages/*/node_modules
npm install
```

#### Coverage Report Issues
```bash
# Clear coverage cache
rm -rf packages/*/coverage
npm run test:coverage
```

### Debugging Tests

#### API Tests
```bash
# Run specific test file
npm test -- taskService.test.ts

# Run with verbose output
npm test -- --reporter=verbose

# Run with debug logging
DEBUG=* npm test
```

#### Web Tests
```bash
# Run specific test file
npm test -- TaskList.test.tsx

# Run with UI for debugging
npm run test:ui
```

## Continuous Integration

The test suite is designed to run in CI environments:
- Uses Docker for database dependencies
- Includes linting and type checking
- Generates coverage reports
- Fails fast on any test failure

## Performance

### Test Performance Tips
1. **Parallel Execution**: Tests run in parallel where possible
2. **Database Optimization**: Use transactions for faster database tests
3. **Mocking**: Mock expensive operations
4. **Selective Testing**: Use focused test runs during development

### Monitoring Test Performance
```bash
# Run tests with timing
npm test -- --reporter=verbose

# Profile test performance
npm test -- --profile
```

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain or improve coverage
4. Update this documentation if needed

### Adding New Tests
1. Create test file in appropriate directory
2. Follow existing naming conventions
3. Include both positive and negative test cases
4. Add integration tests for new API endpoints
5. Update coverage expectations if needed
