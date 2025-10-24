---
description: Generate realistic test data, fixtures, and mock factories for testing
argument-hint: [entity-name or model-name]
model: inherit
---

# Test Data Factory Generation Command

You are tasked with generating comprehensive test data factories that create realistic, consistent test data for your tests. These factories should make it easy to generate valid test instances with sensible defaults while allowing customization.

## Step 1: Identify Target Entities

**If the user provided entity/model names:**
- Locate the corresponding data models, classes, or type definitions
- Identify all properties and their types
- Understand relationships between entities

**If no specific entities are provided:**
- Scan the codebase for data models
- Suggest common entities: User, Product, Order, etc.
- Show recently modified models

**Common entity locations:**
- TypeScript: `interfaces`, `types`, `models`
- Python: `models.py`, `schemas.py`, dataclasses
- Java: entity classes, DTOs
- Go: structs

## Step 2: Analyze Entity Structure

For each entity, extract:

### Basic Properties
- Property names
- Data types (string, number, boolean, date, etc.)
- Required vs optional fields
- Default values
- Constraints (min/max, length, format)

### Complex Properties
- Nested objects
- Arrays and collections
- Enums and unions
- Relationships (foreign keys, references)

### Validation Rules
- Format requirements (email, URL, phone)
- Range constraints (min, max values)
- Length limits
- Regular expression patterns
- Custom validators

### Example Analysis:

```typescript
// Source: User.ts
interface User {
  id: string;              // UUID
  email: string;           // Valid email format
  firstName: string;       // 1-50 chars
  lastName: string;        // 1-50 chars
  age?: number;           // Optional, 18-120
  role: 'admin' | 'user'; // Enum
  createdAt: Date;
  settings: UserSettings; // Nested object
  orders: Order[];        // Array of related entities
}
```

## Step 3: Detect Faker/Mock Library

Identify available data generation libraries:

### JavaScript/TypeScript
- **@faker-js/faker** (recommended): Comprehensive fake data
- **chance**: Random data generator
- **casual**: Fake data for testing
- Install if not present: `npm install -D @faker-js/faker`

### Python
- **Faker**: Most popular Python fake data library
- **factory_boy**: Advanced factory pattern library
- **mimesis**: Fast fake data generator
- Install if not present: `pip install faker factory-boy`

### Java
- **JavaFaker**: Fake data for Java
- **Instancio**: Test data generator
- **EasyRandom**: Random Java beans

### Go
- **gofakeit**: Comprehensive fake data
- **faker**: Go faker library

## Step 4: Generate Factory Functions

Create factory functions with sensible defaults:

### For TypeScript/JavaScript (using faker):

```typescript
// factories/user.factory.ts
import { faker } from '@faker-js/faker';
import { User, UserRole } from '../models/User';

/**
 * Creates a mock User with realistic fake data.
 * All properties have sensible defaults but can be overridden.
 *
 * @param overrides - Partial user object to override defaults
 * @returns Complete User object with fake data
 *
 * @example
 * const user = createMockUser();
 * const admin = createMockUser({ role: 'admin' });
 * const specificUser = createMockUser({
 *   email: 'test@example.com',
 *   firstName: 'John'
 * });
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    age: faker.number.int({ min: 18, max: 80 }),
    role: faker.helpers.arrayElement(['admin', 'user'] as UserRole[]),
    createdAt: faker.date.past(),
    settings: createMockUserSettings(),
    orders: [],
    ...overrides,
  };
}

/**
 * Creates multiple mock users.
 *
 * @param count - Number of users to create
 * @param overrides - Shared overrides for all users
 * @returns Array of User objects
 */
export function createMockUsers(
  count: number,
  overrides: Partial<User> = {}
): User[] {
  return Array.from({ length: count }, () => createMockUser(overrides));
}

/**
 * Creates a mock admin user.
 */
export function createMockAdmin(overrides: Partial<User> = {}): User {
  return createMockUser({
    role: 'admin',
    ...overrides,
  });
}

/**
 * Creates a mock user with specific test scenarios.
 */
export const UserFixtures = {
  /**
   * Standard active user for most tests
   */
  standard: (): User => createMockUser({
    email: 'user@test.com',
    role: 'user',
    age: 30,
  }),

  /**
   * Admin user for permission tests
   */
  admin: (): User => createMockUser({
    email: 'admin@test.com',
    role: 'admin',
  }),

  /**
   * User with minimal age for boundary testing
   */
  minAge: (): User => createMockUser({
    age: 18,
  }),

  /**
   * User with maximum age for boundary testing
   */
  maxAge: (): User => createMockUser({
    age: 120,
  }),

  /**
   * User with no optional fields
   */
  minimal: (): User => {
    const user = createMockUser();
    delete user.age;
    return user;
  },

  /**
   * User with many orders for relationship testing
   */
  withManyOrders: (): User => createMockUser({
    orders: createMockOrders(10),
  }),
};
```

```typescript
// factories/order.factory.ts
import { faker } from '@faker-js/faker';
import { Order, OrderStatus } from '../models/Order';

export function createMockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: faker.string.uuid(),
    orderNumber: `ORD-${faker.string.numeric(6)}`,
    userId: faker.string.uuid(),
    items: createMockOrderItems(faker.number.int({ min: 1, max: 5 })),
    total: faker.number.float({ min: 10, max: 1000, precision: 0.01 }),
    status: faker.helpers.arrayElement([
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled'
    ] as OrderStatus[]),
    createdAt: faker.date.past(),
    shippingAddress: createMockAddress(),
    ...overrides,
  };
}

export function createMockOrders(count: number): Order[] {
  return Array.from({ length: count }, () => createMockOrder());
}

export const OrderFixtures = {
  pending: (): Order => createMockOrder({ status: 'pending' }),
  delivered: (): Order => createMockOrder({ status: 'delivered' }),
  cancelled: (): Order => createMockOrder({ status: 'cancelled' }),
  highValue: (): Order => createMockOrder({
    total: faker.number.float({ min: 1000, max: 10000, precision: 0.01 })
  }),
  empty: (): Order => createMockOrder({ items: [] }),
};
```

### For Python (using faker and factory_boy):

```python
# factories/user_factory.py
from faker import Faker
from datetime import datetime
from typing import Optional, List
from models.user import User, UserRole

fake = Faker()

def create_mock_user(**overrides) -> User:
    """
    Creates a mock User with realistic fake data.

    Args:
        **overrides: Field values to override defaults

    Returns:
        User object with fake data

    Example:
        user = create_mock_user()
        admin = create_mock_user(role=UserRole.ADMIN)
        specific = create_mock_user(email='test@example.com')
    """
    defaults = {
        'id': fake.uuid4(),
        'email': fake.email(),
        'first_name': fake.first_name(),
        'last_name': fake.last_name(),
        'age': fake.random_int(min=18, max=80),
        'role': fake.random_element([UserRole.ADMIN, UserRole.USER]),
        'created_at': fake.date_time_this_year(),
        'settings': create_mock_user_settings(),
        'orders': [],
    }
    defaults.update(overrides)
    return User(**defaults)

def create_mock_users(count: int, **overrides) -> List[User]:
    """Creates multiple mock users."""
    return [create_mock_user(**overrides) for _ in range(count)]

def create_mock_admin(**overrides) -> User:
    """Creates a mock admin user."""
    return create_mock_user(role=UserRole.ADMIN, **overrides)

class UserFixtures:
    """Predefined user fixtures for common test scenarios."""

    @staticmethod
    def standard() -> User:
        """Standard active user for most tests."""
        return create_mock_user(
            email='user@test.com',
            role=UserRole.USER,
            age=30,
        )

    @staticmethod
    def admin() -> User:
        """Admin user for permission tests."""
        return create_mock_user(
            email='admin@test.com',
            role=UserRole.ADMIN,
        )

    @staticmethod
    def min_age() -> User:
        """User with minimal age for boundary testing."""
        return create_mock_user(age=18)

    @staticmethod
    def max_age() -> User:
        """User with maximum age for boundary testing."""
        return create_mock_user(age=120)

    @staticmethod
    def with_many_orders() -> User:
        """User with many orders for relationship testing."""
        return create_mock_user(orders=create_mock_orders(10))

# Using factory_boy (alternative approach)
import factory
from factory.faker import Faker as FactoryFaker

class UserFactory(factory.Factory):
    """Factory for creating User test instances."""

    class Meta:
        model = User

    id = FactoryFaker('uuid4')
    email = FactoryFaker('email')
    first_name = FactoryFaker('first_name')
    last_name = FactoryFaker('last_name')
    age = FactoryFaker('random_int', min=18, max=80)
    role = FactoryFaker('random_element', elements=[UserRole.ADMIN, UserRole.USER])
    created_at = FactoryFaker('date_time_this_year')

# Usage:
# user = UserFactory()
# admin = UserFactory(role=UserRole.ADMIN)
# users = UserFactory.create_batch(10)
```

### For Java (using JavaFaker):

```java
// factories/UserFactory.java
package com.example.factories;

import com.github.javafaker.Faker;
import com.example.models.User;
import com.example.models.UserRole;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class UserFactory {
    private static final Faker faker = new Faker();

    /**
     * Creates a mock User with realistic fake data.
     *
     * @return User object with fake data
     */
    public static User createMockUser() {
        return User.builder()
            .id(UUID.randomUUID().toString())
            .email(faker.internet().emailAddress())
            .firstName(faker.name().firstName())
            .lastName(faker.name().lastName())
            .age(faker.number().numberBetween(18, 80))
            .role(faker.options().option(UserRole.class))
            .createdAt(LocalDateTime.now())
            .settings(UserSettingsFactory.createMockUserSettings())
            .orders(new ArrayList<>())
            .build();
    }

    /**
     * Creates multiple mock users.
     *
     * @param count Number of users to create
     * @return List of User objects
     */
    public static List<User> createMockUsers(int count) {
        List<User> users = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            users.add(createMockUser());
        }
        return users;
    }

    /**
     * Creates a mock admin user.
     */
    public static User createMockAdmin() {
        User user = createMockUser();
        user.setRole(UserRole.ADMIN);
        return user;
    }

    /**
     * Predefined fixtures for common test scenarios.
     */
    public static class Fixtures {
        public static User standard() {
            User user = createMockUser();
            user.setEmail("user@test.com");
            user.setRole(UserRole.USER);
            user.setAge(30);
            return user;
        }

        public static User admin() {
            User user = createMockUser();
            user.setEmail("admin@test.com");
            user.setRole(UserRole.ADMIN);
            return user;
        }

        public static User minAge() {
            User user = createMockUser();
            user.setAge(18);
            return user;
        }

        public static User maxAge() {
            User user = createMockUser();
            user.setAge(120);
            return user;
        }
    }
}
```

## Step 5: Generate Mock API Responses

Create mock API response factories:

```typescript
// factories/api-responses.factory.ts
import { faker } from '@faker-js/faker';

export const MockApiResponses = {
  /**
   * Successful API response
   */
  success: <T>(data: T) => ({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  }),

  /**
   * Paginated API response
   */
  paginated: <T>(items: T[], page = 1, pageSize = 10) => ({
    success: true,
    data: items,
    pagination: {
      page,
      pageSize,
      total: items.length,
      totalPages: Math.ceil(items.length / pageSize),
    },
  }),

  /**
   * Error API response
   */
  error: (message: string, code = 'ERROR', status = 400) => ({
    success: false,
    error: {
      message,
      code,
      status,
      timestamp: new Date().toISOString(),
    },
  }),

  /**
   * Validation error response
   */
  validationError: (fields: Record<string, string>) => ({
    success: false,
    error: {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      status: 422,
      fields,
    },
  }),
};
```

## Step 6: Generate Database Fixtures

Create database seeding fixtures:

```typescript
// fixtures/database.fixtures.ts
import { createMockUser, createMockUsers } from '../factories/user.factory';
import { createMockOrders } from '../factories/order.factory';

export const DatabaseFixtures = {
  /**
   * Seeds database with test users
   */
  async seedUsers(db: Database) {
    const users = [
      createMockUser({ email: 'user1@test.com' }),
      createMockUser({ email: 'user2@test.com' }),
      createMockAdmin({ email: 'admin@test.com' }),
    ];

    for (const user of users) {
      await db.users.create(user);
    }

    return users;
  },

  /**
   * Seeds database with complete test dataset
   */
  async seedAll(db: Database) {
    await this.seedUsers(db);
    await this.seedProducts(db);
    await this.seedOrders(db);
  },

  /**
   * Clears all test data
   */
  async clearAll(db: Database) {
    await db.orders.deleteMany({});
    await db.users.deleteMany({});
    await db.products.deleteMany({});
  },
};
```

## Step 7: Generate Builder Pattern Factories

Create fluent builder APIs for complex objects:

```typescript
// factories/user.builder.ts
import { faker } from '@faker-js/faker';
import { User } from '../models/User';

export class UserBuilder {
  private user: Partial<User> = {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    role: 'user',
    createdAt: new Date(),
  };

  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }

  withName(firstName: string, lastName: string): this {
    this.user.firstName = firstName;
    this.user.lastName = lastName;
    return this;
  }

  asAdmin(): this {
    this.user.role = 'admin';
    return this;
  }

  withAge(age: number): this {
    this.user.age = age;
    return this;
  }

  withOrders(count: number): this {
    this.user.orders = createMockOrders(count);
    return this;
  }

  build(): User {
    return this.user as User;
  }
}

// Usage:
// const user = new UserBuilder()
//   .withEmail('test@example.com')
//   .asAdmin()
//   .withOrders(5)
//   .build();
```

## Step 8: Create Test Data Documentation

Generate documentation for the factories:

```markdown
# Test Data Factories

## User Factory

### Basic Usage

```typescript
import { createMockUser } from './factories/user.factory';

const user = createMockUser();
// Returns a User with realistic fake data
```

### Custom Properties

```typescript
const admin = createMockUser({
  email: 'admin@test.com',
  role: 'admin'
});
```

### Fixtures

```typescript
import { UserFixtures } from './factories/user.factory';

const standardUser = UserFixtures.standard();
const adminUser = UserFixtures.admin();
```

### Multiple Users

```typescript
const users = createMockUsers(10);
// Creates 10 users with unique data
```

## Order Factory

[Similar documentation for other factories]
```

## Step 9: Summary Report

Provide a comprehensive summary:

```
🏭 Test Data Factory Generation Complete

Entities Processed: [count]
Factory Files Created: [count]

Generated Factories:
✅ User Factory (factories/user.factory.ts)
   - createMockUser()
   - createMockUsers(count)
   - createMockAdmin()
   - UserFixtures (5 predefined fixtures)

✅ Order Factory (factories/order.factory.ts)
   - createMockOrder()
   - createMockOrders(count)
   - OrderFixtures (5 predefined fixtures)

✅ API Response Factory (factories/api-responses.factory.ts)
   - success(), error(), paginated()

✅ Database Fixtures (fixtures/database.fixtures.ts)
   - seedUsers(), seedAll(), clearAll()

Features:
✅ Realistic fake data using faker
✅ Override capability for custom values
✅ Predefined fixtures for common scenarios
✅ Builder pattern for complex objects
✅ Type-safe (TypeScript)
✅ Well-documented with JSDoc

Usage Example:
```typescript
import { createMockUser } from './factories/user.factory';

test('should save user', () => {
  const user = createMockUser({ email: 'test@example.com' });
  const result = saveUser(user);
  expect(result).toBeDefined();
});
```

Next Steps:
1. Install faker if needed: npm install -D @faker-js/faker
2. Import factories in your test files
3. Use fixtures for consistent test data
4. Customize factories as needed for your domain
```

## Important Guidelines

### DO:
- Generate realistic, domain-appropriate data
- Provide sensible defaults for all fields
- Allow easy overriding of any property
- Create predefined fixtures for common scenarios
- Use appropriate faker methods for each field type
- Add comprehensive documentation
- Include edge case fixtures (min, max, empty)
- Make factories type-safe

### DON'T:
- Don't use hardcoded values for variable data
- Don't create factories that return invalid data by default
- Don't forget to handle optional fields
- Don't ignore relationships between entities
- Don't create overly complex factory APIs
- Don't forget to document usage examples

## Error Handling

If you encounter issues:

- **Entity not found**: Ask user for correct path or show available models
- **No faker library**: Offer to create basic factories without faker
- **Complex relationships**: Create separate factories for related entities
- **Unknown field types**: Ask user for clarification

---

Begin by analyzing the entity structure and generating comprehensive, reusable test data factories.
