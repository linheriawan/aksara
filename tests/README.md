# API Testing Guide

This directory contains the test suite for the Aksara Platform API.

## Structure

```
tests/
├── setup.ts                    # Global test configuration
├── api/                        # API endpoint tests
│   ├── helpers/               # Shared test utilities
│   │   ├── request.ts        # HTTP request wrapper
│   │   ├── auth.ts           # Authentication helpers
│   │   └── assertions.ts     # Custom assertions
│   ├── health.test.ts        # Health check tests
│   ├── auth.test.ts          # Authentication tests
│   ├── connections.test.ts   # Connection CRUD tests
│   └── datasources.test.ts   # Datasource CRUD tests
└── integration/               # Integration tests
    ├── connection-flow.test.ts
    └── datasource-flow.test.ts
```

## Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run only API tests
bun test:api

# Run only integration tests
bun test:integration

# Run specific test file
bun test tests/api/health.test.ts
```

## Environment Variables

Create a `.env.test` file for test-specific configuration:

```bash
TEST_BASE_URL=http://localhost:3000
TEST_TIMEOUT=5000
TEST_USER_EMAIL=admin@aksara.dev
TEST_USER_PASSWORD=admin123
```

**Important:** The test user must exist in your database before running tests. The default credentials assume you've run the database initialization script (`bun run db:init`).

## Writing Tests

### Basic API Test

```typescript
import { describe, test, expect } from 'bun:test';
import { api } from './helpers/request';
import { assertSuccess, assertHasFields } from './helpers/assertions';

describe('My API', () => {
  test('should get data', async () => {
    const response = await api.get('/api/my-endpoint');

    assertSuccess(response);
    assertHasFields(response.data, ['id', 'name']);
  });
});
```

### Authenticated Test

```typescript
import { login, logout } from './helpers/auth';

describe('Authenticated API', () => {
  let sessionToken: string;

  beforeAll(async () => {
    sessionToken = await login();
  });

  afterAll(async () => {
    await logout(sessionToken);
  });

  test('should get protected data', async () => {
    const response = await api.get('/api/protected', sessionToken);
    assertSuccess(response);
  });
});
```

### Custom Assertions

Available custom assertions:

- `assertSuccess(response)` - Assert 2xx status
- `assertError(response, status, message?)` - Assert error status
- `assertUnauthorized(response)` - Assert 401
- `assertNotFound(response)` - Assert 404
- `assertBadRequest(response, message?)` - Assert 400
- `assertHasFields(data, fields)` - Assert object has fields
- `assertHasValidId(data)` - Assert has valid ID
- `assertIsArray(data)` - Assert is array
- `assertNotEmpty(data)` - Assert array not empty

## Best Practices

1. **Use Helpers**: Always use the provided helpers for consistency
2. **Clean Up**: Clean up test data in `afterAll` or `afterEach`
3. **Descriptive Names**: Use clear, descriptive test names
4. **Assertions**: Use custom assertions for common patterns
5. **Independent Tests**: Each test should be independent
6. **Mock External**: Mock external services when possible

## Test Data

Keep test data minimal and clean it up:

```typescript
describe('My Tests', () => {
  const testIds: string[] = [];

  afterAll(async () => {
    // Clean up created test data
    for (const id of testIds) {
      await api.delete(`/api/items/${id}`, sessionToken);
    }
  });

  test('create item', async () => {
    const response = await api.post('/api/items', { name: 'Test' }, sessionToken);
    testIds.push(response.data.id);
    // ... assertions
  });
});
```
