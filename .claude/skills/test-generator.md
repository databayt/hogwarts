# Test Generator Skill

**Purpose**: TDD patterns, comprehensive test case generation, 95%+ coverage target for Vitest and Playwright

## Test Philosophy

### Test-Driven Development (TDD) Cycle
1. **Red**: Write failing test first
2. **Green**: Write minimum code to pass
3. **Refactor**: Improve code while tests pass
4. **Document**: Update test descriptions
5. **Coverage**: Ensure 95%+ coverage

### Testing Pyramid
```
         /\
        /E2E\         (5%)  - Critical user journeys
       /------\
      /Component\     (25%) - Integration tests
     /----------\
    /Unit Tests   \   (70%) - Fast, isolated tests
   /--------------\
```

## Test Types & Patterns

### 1. Unit Tests (Vitest)

#### Basic Structure
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Categories
  describe('Rendering', () => {
    it('should render with default props', () => {
      // Arrange
      const props = { name: 'Test' };

      // Act
      render(<Component {...props} />);

      // Assert
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should handle click events', async () => {
      // Arrange
      const handleClick = vi.fn();
      const user = userEvent.setup();

      // Act
      render(<Button onClick={handleClick}>Click</Button>);
      await user.click(screen.getByRole('button'));

      // Assert
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data gracefully', () => {
      render(<List items={[]} />);
      expect(screen.getByText('No items')).toBeInTheDocument();
    });
  });
});
```

### 2. Server Action Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createStudent } from './actions';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    student: {
      create: vi.fn(),
      findUnique: vi.fn()
    }
  }
}));

describe('createStudent Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create student with valid data', async () => {
    // Arrange
    const formData = new FormData();
    formData.append('name', 'Harry Potter');
    formData.append('email', 'harry@hogwarts.edu');
    formData.append('schoolId', 'test-school-id');

    db.student.create.mockResolvedValue({
      id: '1',
      name: 'Harry Potter',
      email: 'harry@hogwarts.edu'
    });

    // Act
    const result = await createStudent(formData);

    // Assert
    expect(db.student.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Harry Potter',
        email: 'harry@hogwarts.edu',
        schoolId: 'test-school-id'
      })
    });
  });

  it('should validate required fields', async () => {
    // Arrange
    const formData = new FormData();
    // Missing required fields

    // Act & Assert
    await expect(createStudent(formData)).rejects.toThrow('Validation error');
  });
});
```

### 3. Hook Tests

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStudent } from './use-student';

describe('useStudent Hook', () => {
  it('should fetch student data', async () => {
    // Arrange & Act
    const { result } = renderHook(() => useStudent('student-1'));

    // Assert - Loading state
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Wait for data
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Assert - Data loaded
    expect(result.current.data).toEqual({
      id: 'student-1',
      name: 'Test Student'
    });
  });

  it('should handle errors gracefully', async () => {
    // Arrange
    const { result } = renderHook(() => useStudent('invalid-id'));

    // Act & Assert
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
      expect(result.current.error.message).toBe('Student not found');
    });
  });
});
```

### 4. Component Integration Tests

```typescript
describe('StudentForm Integration', () => {
  it('should complete full form submission flow', async () => {
    // Arrange
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <StudentForm onSubmit={onSubmit} schoolId="test-school" />
    );

    // Act - Fill form
    await user.type(screen.getByLabelText('Name'), 'Harry Potter');
    await user.type(screen.getByLabelText('Email'), 'harry@hogwarts.edu');
    await user.selectOptions(screen.getByLabelText('Year'), '1');
    await user.click(screen.getByLabelText('Active'));

    // Submit
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    // Assert
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Harry Potter',
        email: 'harry@hogwarts.edu',
        yearLevel: '1',
        isActive: true,
        schoolId: 'test-school'
      });
    });
  });
});
```

### 5. E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Student Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@hogwarts.edu');
    await page.fill('[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create new student', async ({ page }) => {
    // Navigate to students
    await page.goto('/students');
    await page.click('text=Add Student');

    // Fill form
    await page.fill('[name="name"]', 'Hermione Granger');
    await page.fill('[name="email"]', 'hermione@hogwarts.edu');
    await page.selectOption('[name="yearLevel"]', '1');

    // Submit
    await page.click('button:has-text("Create Student")');

    // Verify
    await expect(page.locator('text=Student created successfully')).toBeVisible();
    await expect(page.locator('text=Hermione Granger')).toBeVisible();
  });

  test('should handle validation errors', async ({ page }) => {
    await page.goto('/students/new');

    // Submit empty form
    await page.click('button:has-text("Create Student")');

    // Check validation messages
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
  });
});
```

## Test Data Patterns

### 1. Fixtures
```typescript
// fixtures/students.ts
export const mockStudent = {
  id: 'student-1',
  name: 'Harry Potter',
  email: 'harry@hogwarts.edu',
  schoolId: 'hogwarts-school',
  yearLevel: 1,
  isActive: true
};

export const mockStudents = [
  mockStudent,
  { ...mockStudent, id: 'student-2', name: 'Hermione Granger' },
  { ...mockStudent, id: 'student-3', name: 'Ron Weasley' }
];
```

### 2. Factories
```typescript
// factories/student.factory.ts
import { faker } from '@faker-js/faker';

export function createStudent(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    schoolId: 'test-school',
    yearLevel: faker.number.int({ min: 1, max: 7 }),
    isActive: true,
    ...overrides
  };
}
```

### 3. Builders
```typescript
// builders/student.builder.ts
export class StudentBuilder {
  private student = {
    id: '1',
    name: 'Test Student',
    email: 'test@example.com',
    schoolId: 'test-school'
  };

  withName(name: string) {
    this.student.name = name;
    return this;
  }

  withEmail(email: string) {
    this.student.email = email;
    return this;
  }

  inactive() {
    this.student.isActive = false;
    return this;
  }

  build() {
    return this.student;
  }
}

// Usage
const student = new StudentBuilder()
  .withName('Harry Potter')
  .inactive()
  .build();
```

## Coverage Requirements

### Minimum Coverage Targets
- **Overall**: 95%
- **Statements**: 95%
- **Branches**: 90%
- **Functions**: 95%
- **Lines**: 95%

### Critical Path Coverage
- **Authentication**: 100%
- **Authorization**: 100%
- **Payment Processing**: 100%
- **Multi-tenant Logic**: 100%
- **Data Validation**: 100%

### Coverage Configuration
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'test/',
        '*.config.*',
        '**/*.d.ts',
        '**/*.test.*',
        '**/fixtures/**'
      ],
      thresholds: {
        statements: 95,
        branches: 90,
        functions: 95,
        lines: 95
      }
    }
  }
});
```

## Test Organization

### File Structure
```
src/
  components/
    platform/
      students/
        content.tsx
        content.test.tsx      # Unit tests
        form.tsx
        form.test.tsx         # Component tests
        actions.ts
        actions.test.ts       # Server action tests
        use-student.ts
        use-student.test.ts   # Hook tests
tests/
  e2e/
    students.spec.ts          # E2E tests
  integration/
    student-flow.test.ts      # Integration tests
  fixtures/
    students.ts               # Test data
  utils/
    test-helpers.ts           # Shared utilities
```

### Test Naming Conventions
```typescript
// Unit tests
describe('ComponentName', () => {
  it('should [expected behavior] when [condition]', () => {});
  it('should handle [edge case]', () => {});
  it('should throw error when [invalid input]', () => {});
});

// E2E tests
test('user can [complete action]', async () => {});
test('system prevents [invalid action]', async () => {});
```

## Mocking Strategies

### 1. Module Mocks
```typescript
vi.mock('@/lib/db');
vi.mock('next/navigation');
vi.mock('@/auth');
```

### 2. Partial Mocks
```typescript
vi.mock('@/lib/utils', async () => {
  const actual = await vi.importActual('@/lib/utils');
  return {
    ...actual,
    cn: vi.fn((..classes) => classes.join(' '))
  };
});
```

### 3. Spy Functions
```typescript
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
```

## Performance Testing

### Load Testing Patterns
```typescript
describe('Performance', () => {
  it('should render 1000 items in < 100ms', () => {
    const start = performance.now();
    render(<LargeList items={generateItems(1000)} />);
    const end = performance.now();

    expect(end - start).toBeLessThan(100);
  });
});
```

## Accessibility Testing

```typescript
import { axe } from 'vitest-axe';

it('should be accessible', async () => {
  const { container } = render(<StudentForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Multi-Tenant Testing

```typescript
describe('Multi-tenant Isolation', () => {
  it('should scope queries by schoolId', async () => {
    // Test with different school contexts
    const school1Result = await getStudents('school-1');
    const school2Result = await getStudents('school-2');

    // Verify isolation
    expect(school1Result).not.toContainEqual(
      expect.objectContaining({ schoolId: 'school-2' })
    );
  });
});
```

## Usage

### When to Generate Tests
- Before writing new features (TDD)
- After bug fixes (regression tests)
- During refactoring (safety net)
- For critical paths (100% coverage)
- After API changes (contract tests)

### Example Commands
```bash
"Generate unit tests for StudentForm component"
"Create E2E test for student enrollment flow"
"Add integration tests for payment processing"
"Generate performance tests for dashboard"
```

## References
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [TDD Best Practices](https://www.agilealliance.org/glossary/tdd/)