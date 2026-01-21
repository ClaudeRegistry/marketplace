---
description: Generate comprehensive OpenAPI/Swagger documentation from REST APIs, GraphQL schemas, or RPC definitions
model: inherit
---

# API Documentation Generator

You are tasked with generating professional, comprehensive API documentation from code. Support multiple API styles (REST, GraphQL, gRPC) and output in standard formats (OpenAPI/Swagger, GraphQL Schema, etc.).

## Step 1: Identify API Type and Structure

Scan the codebase to determine:

### REST APIs:
- Express.js routes (app.get, app.post, router.use)
- FastAPI endpoints (@app.get, @app.post)
- Spring Boot controllers (@RestController, @GetMapping)
- Flask routes (@app.route)
- Django views and URLs
- ASP.NET Core controllers ([HttpGet], [HttpPost])

### GraphQL APIs:
- Schema definitions (.graphql files)
- Resolver implementations
- Type definitions (TypeDefs)
- Mutations and Queries

### gRPC APIs:
- Protocol buffer definitions (.proto files)
- Service definitions
- Message types

### Generic APIs:
- HTTP handlers
- RPC endpoints
- WebSocket handlers

## Step 2: Extract API Endpoint Information

For each endpoint, gather:

### Endpoint Metadata:
- **HTTP Method**: GET, POST, PUT, DELETE, PATCH, etc.
- **Path**: /api/v1/users/{id}
- **Path Parameters**: {id}, {userId}, etc.
- **Query Parameters**: ?page=1&limit=10
- **Request Headers**: Authorization, Content-Type, etc.
- **Request Body**: Schema and examples
- **Response Codes**: 200, 201, 400, 401, 404, 500, etc.
- **Response Body**: Schema for each response code
- **Authentication**: Required? Type? (Bearer, OAuth2, API Key)
- **Rate Limiting**: Limits and headers
- **Deprecation**: Is it deprecated?

### Code Analysis:
- Read route handler implementations
- Extract validation logic (required fields, types, constraints)
- Identify error handling patterns
- Find authentication/authorization middleware
- Detect request/response transformations
- Locate example responses in code or tests

## Step 3: Generate OpenAPI 3.0 Specification

Create a complete OpenAPI document:

```yaml
openapi: 3.0.3
info:
  title: [Project Name] API
  description: |
    [Multi-line description of the API]

    ## Authentication
    [Describe authentication methods]

    ## Rate Limiting
    [Describe rate limiting policies]

    ## Versioning
    [Describe versioning strategy]
  version: 1.0.0
  contact:
    name: [Team Name]
    email: [contact@example.com]
    url: [https://example.com]
  license:
    name: [License Type]
    url: [License URL]

servers:
  - url: https://api.example.com/v1
    description: Production server
  - url: https://staging-api.example.com/v1
    description: Staging server
  - url: http://localhost:3000/v1
    description: Development server

tags:
  - name: Users
    description: User management operations
  - name: Orders
    description: Order processing and management
  - name: Products
    description: Product catalog operations

paths:
  /users:
    get:
      tags:
        - Users
      summary: List all users
      description: |
        Retrieves a paginated list of users. Supports filtering,
        sorting, and searching.
      operationId: listUsers
      parameters:
        - name: page
          in: query
          description: Page number for pagination
          required: false
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          description: Number of items per page
          required: false
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: search
          in: query
          description: Search term for filtering users
          required: false
          schema:
            type: string
        - name: sort
          in: query
          description: Sort field and order (e.g., "name:asc", "created_at:desc")
          required: false
          schema:
            type: string
            enum: [name:asc, name:desc, created_at:asc, created_at:desc]
      responses:
        '200':
          description: Successful response with user list
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
              examples:
                success:
                  summary: Example successful response
                  value:
                    data:
                      - id: "usr_123456"
                        email: "john@example.com"
                        name: "John Doe"
                        created_at: "2024-01-15T10:30:00Z"
                      - id: "usr_789012"
                        email: "jane@example.com"
                        name: "Jane Smith"
                        created_at: "2024-01-16T14:20:00Z"
                    pagination:
                      page: 1
                      limit: 20
                      total: 150
                      total_pages: 8
        '400':
          description: Invalid request parameters
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
              examples:
                invalid_page:
                  summary: Invalid page parameter
                  value:
                    error:
                      code: "INVALID_PARAMETER"
                      message: "Page must be a positive integer"
                      field: "page"
        '401':
          $ref: '#/components/responses/Unauthorized'
        '429':
          $ref: '#/components/responses/RateLimitExceeded'
      security:
        - bearerAuth: []

    post:
      tags:
        - Users
      summary: Create a new user
      description: Creates a new user account with the provided information
      operationId: createUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserCreate'
            examples:
              basic:
                summary: Basic user creation
                value:
                  email: "newuser@example.com"
                  name: "New User"
                  password: "securePassword123!"
      responses:
        '201':
          description: User created successfully
          headers:
            Location:
              description: URL of the created user
              schema:
                type: string
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          description: Invalid user data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '409':
          description: User already exists
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
      security:
        - bearerAuth: []

  /users/{userId}:
    get:
      tags:
        - Users
      summary: Get user by ID
      description: Retrieves detailed information about a specific user
      operationId: getUserById
      parameters:
        - name: userId
          in: path
          description: Unique identifier of the user
          required: true
          schema:
            type: string
            pattern: '^usr_[a-zA-Z0-9]+$'
          example: "usr_123456"
      responses:
        '200':
          description: User found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          $ref: '#/components/responses/NotFound'
      security:
        - bearerAuth: []

    put:
      tags:
        - Users
      summary: Update user
      description: Updates all fields of an existing user (full update)
      operationId: updateUser
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserUpdate'
      responses:
        '200':
          description: User updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          $ref: '#/components/responses/NotFound'
      security:
        - bearerAuth: []

    delete:
      tags:
        - Users
      summary: Delete user
      description: Permanently deletes a user account
      operationId: deleteUser
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: User deleted successfully
        '404':
          $ref: '#/components/responses/NotFound'
      security:
        - bearerAuth: []

components:
  schemas:
    User:
      type: object
      required:
        - id
        - email
        - name
      properties:
        id:
          type: string
          description: Unique identifier for the user
          example: "usr_123456"
        email:
          type: string
          format: email
          description: User's email address
          example: "john@example.com"
        name:
          type: string
          description: User's full name
          minLength: 1
          maxLength: 100
          example: "John Doe"
        avatar_url:
          type: string
          format: uri
          description: URL to user's avatar image
          nullable: true
          example: "https://cdn.example.com/avatars/user123.jpg"
        role:
          type: string
          enum: [user, admin, moderator]
          description: User's role in the system
          default: user
        is_active:
          type: boolean
          description: Whether the user account is active
          default: true
        created_at:
          type: string
          format: date-time
          description: Timestamp when the user was created
          example: "2024-01-15T10:30:00Z"
        updated_at:
          type: string
          format: date-time
          description: Timestamp when the user was last updated
          example: "2024-01-20T15:45:00Z"

    UserCreate:
      type: object
      required:
        - email
        - name
        - password
      properties:
        email:
          type: string
          format: email
          description: User's email address (must be unique)
        name:
          type: string
          minLength: 1
          maxLength: 100
          description: User's full name
        password:
          type: string
          format: password
          minLength: 8
          description: User's password (min 8 characters)
        role:
          type: string
          enum: [user, admin]
          default: user

    UserUpdate:
      type: object
      properties:
        email:
          type: string
          format: email
        name:
          type: string
          minLength: 1
          maxLength: 100
        avatar_url:
          type: string
          format: uri
          nullable: true
        is_active:
          type: boolean

    Pagination:
      type: object
      properties:
        page:
          type: integer
          description: Current page number
        limit:
          type: integer
          description: Items per page
        total:
          type: integer
          description: Total number of items
        total_pages:
          type: integer
          description: Total number of pages

    Error:
      type: object
      required:
        - error
      properties:
        error:
          type: object
          required:
            - code
            - message
          properties:
            code:
              type: string
              description: Machine-readable error code
              example: "INVALID_PARAMETER"
            message:
              type: string
              description: Human-readable error message
              example: "The provided email is invalid"
            field:
              type: string
              description: Field that caused the error (if applicable)
              example: "email"
            details:
              type: object
              description: Additional error details
              additionalProperties: true

  responses:
    Unauthorized:
      description: Authentication required or invalid token
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error:
              code: "UNAUTHORIZED"
              message: "Valid authentication token required"

    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error:
              code: "NOT_FOUND"
              message: "The requested resource was not found"

    RateLimitExceeded:
      description: Too many requests
      headers:
        X-RateLimit-Limit:
          description: Request limit per time window
          schema:
            type: integer
        X-RateLimit-Remaining:
          description: Remaining requests in current window
          schema:
            type: integer
        X-RateLimit-Reset:
          description: Time when the rate limit resets (Unix timestamp)
          schema:
            type: integer
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error:
              code: "RATE_LIMIT_EXCEEDED"
              message: "Too many requests. Please try again later."

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: |
        JWT token obtained from the /auth/login endpoint.
        Include in the Authorization header as: `Bearer <token>`

    apiKey:
      type: apiKey
      in: header
      name: X-API-Key
      description: API key for service-to-service communication

    oauth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://auth.example.com/oauth/authorize
          tokenUrl: https://auth.example.com/oauth/token
          scopes:
            read:users: Read user information
            write:users: Modify user information
            admin: Full administrative access
```

## Step 4: Generate for Other API Types

### For GraphQL APIs:

Create GraphQL Schema documentation:

```graphql
"""
User type represents a registered user in the system
"""
type User {
  """
  Unique identifier for the user
  """
  id: ID!

  """
  User's email address (unique)
  """
  email: String!

  """
  User's display name
  """
  name: String!

  """
  User's avatar image URL
  """
  avatarUrl: String

  """
  User's role in the system
  """
  role: Role!

  """
  Timestamp when the user was created
  """
  createdAt: DateTime!

  """
  Orders placed by this user
  """
  orders(
    """
    Number of orders to return
    """
    limit: Int = 10

    """
    Offset for pagination
    """
    offset: Int = 0
  ): [Order!]!
}

"""
User role enum
"""
enum Role {
  USER
  ADMIN
  MODERATOR
}

"""
Input type for creating a new user
"""
input CreateUserInput {
  email: String!
  name: String!
  password: String!
  role: Role = USER
}

type Query {
  """
  Get a user by ID

  Example:
  query {
    user(id: "usr_123") {
      id
      name
      email
    }
  }
  """
  user(id: ID!): User

  """
  List all users with optional filtering and pagination
  """
  users(
    limit: Int = 20
    offset: Int = 0
    search: String
  ): UserConnection!
}

type Mutation {
  """
  Create a new user account

  Example:
  mutation {
    createUser(input: {
      email: "john@example.com"
      name: "John Doe"
      password: "secret123"
    }) {
      id
      email
    }
  }
  """
  createUser(input: CreateUserInput!): User!

  """
  Update an existing user
  """
  updateUser(id: ID!, input: UpdateUserInput!): User!

  """
  Delete a user account
  """
  deleteUser(id: ID!): Boolean!
}
```

### For gRPC APIs:

Document Protocol Buffers with comments:

```protobuf
syntax = "proto3";

package api.v1;

// User service provides operations for user management
service UserService {
  // GetUser retrieves a user by their unique identifier
  rpc GetUser(GetUserRequest) returns (User) {}

  // ListUsers retrieves a paginated list of users
  rpc ListUsers(ListUsersRequest) returns (ListUsersResponse) {}

  // CreateUser creates a new user account
  rpc CreateUser(CreateUserRequest) returns (User) {}

  // UpdateUser updates an existing user
  rpc UpdateUser(UpdateUserRequest) returns (User) {}

  // DeleteUser removes a user account
  rpc DeleteUser(DeleteUserRequest) returns (google.protobuf.Empty) {}
}

// User represents a registered user in the system
message User {
  // Unique identifier for the user
  string id = 1;

  // User's email address
  string email = 2;

  // User's display name
  string name = 3;

  // User's role (USER, ADMIN, MODERATOR)
  string role = 4;

  // Timestamp when user was created
  google.protobuf.Timestamp created_at = 5;
}

// Request message for GetUser RPC
message GetUserRequest {
  // ID of the user to retrieve
  string id = 1;
}

// Request message for ListUsers RPC
message ListUsersRequest {
  // Page number for pagination (starts at 1)
  int32 page = 1;

  // Number of items per page (max 100)
  int32 limit = 2;

  // Optional search query
  string search = 3;
}

// Response message for ListUsers RPC
message ListUsersResponse {
  // List of users
  repeated User users = 1;

  // Total number of users matching the query
  int32 total = 2;
}
```

## Step 5: Save Documentation Files

Save the generated documentation to appropriate locations:

- **OpenAPI/Swagger**: `docs/api/openapi.yaml` or `docs/api/swagger.json`
- **GraphQL**: `docs/api/schema.graphql`
- **gRPC**: Update `.proto` files with comprehensive comments
- **Markdown**: `docs/api/README.md` for human-readable API guide

## Step 6: Generate API Usage Guide

Create a developer-friendly guide:

```markdown
# API Documentation

## Overview
[Brief description of the API]

## Base URL
```
Production: https://api.example.com/v1
Staging: https://staging-api.example.com/v1
```

## Authentication

### Obtaining an Access Token
```bash
curl -X POST https://api.example.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your_password"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Using the Access Token
Include the token in all API requests:
```bash
curl -X GET https://api.example.com/v1/users \
  -H "Authorization: Bearer eyJhbGci..."
```

## Quick Start Examples

### JavaScript/TypeScript
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.example.com/v1',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// Get all users
const users = await api.get('/users');

// Create a user
const newUser = await api.post('/users', {
  email: 'john@example.com',
  name: 'John Doe',
  password: 'securePassword123!'
});
```

### Python
```python
import requests

BASE_URL = 'https://api.example.com/v1'
headers = {'Authorization': f'Bearer {access_token}'}

# Get all users
response = requests.get(f'{BASE_URL}/users', headers=headers)
users = response.json()

# Create a user
new_user = requests.post(f'{BASE_URL}/users',
  headers=headers,
  json={
    'email': 'john@example.com',
    'name': 'John Doe',
    'password': 'securePassword123!'
  }
)
```

### cURL
```bash
# List users
curl -X GET 'https://api.example.com/v1/users?page=1&limit=20' \
  -H 'Authorization: Bearer YOUR_TOKEN'

# Create user
curl -X POST 'https://api.example.com/v1/users' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "john@example.com",
    "name": "John Doe",
    "password": "securePassword123!"
  }'
```

## Rate Limiting
- Rate limit: 1000 requests per hour per API key
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- When exceeded: HTTP 429 with `Retry-After` header

## Error Handling
All errors follow this format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "field": "fieldName",
    "details": {}
  }
}
```

Common error codes:
- `INVALID_PARAMETER`: Invalid request parameter
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Webhooks
[If applicable, document webhook events]

## Changelog
[Document API version changes]
```

## Step 7: Provide Summary Report

```markdown
✅ API Documentation Generated Successfully

Documentation Files Created:
- docs/api/openapi.yaml (OpenAPI 3.0 specification)
- docs/api/README.md (Human-readable API guide)
- docs/api/examples/ (Code examples in multiple languages)

API Statistics:
├─ Total Endpoints: [X]
├─ GET endpoints: [X]
├─ POST endpoints: [X]
├─ PUT/PATCH endpoints: [X]
├─ DELETE endpoints: [X]
├─ Authentication methods: [X]
└─ Schema definitions: [X]

Next Steps:
1. Review the generated documentation for accuracy
2. Test endpoints using the provided examples
3. Host documentation using Swagger UI or Redoc
4. Share with frontend developers and API consumers

Hosting Options:
- Swagger UI: https://swagger.io/tools/swagger-ui/
- Redoc: https://github.com/Redocly/redoc
- Stoplight: https://stoplight.io/
```

## Important Guidelines:

- **DO** extract actual endpoint implementations from code
- **DO** include realistic examples from tests or code
- **DO** document all response codes and error cases
- **DO** specify authentication requirements clearly
- **DO** include request/response schemas with validation rules
- **DO** provide code examples in multiple languages
- **DO NOT** generate placeholder or fake endpoints
- **DO NOT** omit authentication or rate limiting details
- **DO** follow OpenAPI 3.0 specification strictly

---

Begin by scanning for API routes and endpoints, then systematically document each one with comprehensive details.
