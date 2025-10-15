---
description: Generate visual architecture diagrams using Mermaid including system architecture, data flow, and component relationships
model: inherit
---

# Architecture Diagram Generator

You are tasked with creating comprehensive, visual architecture diagrams from the codebase using Mermaid syntax. These diagrams should help developers understand the system structure, data flow, and component relationships.

## Step 1: Analyze Codebase Architecture

Scan and understand the project structure:

### Identify Architecture Type:
- **Monolithic**: Single codebase, tightly coupled
- **Microservices**: Multiple independent services
- **Layered**: Clear separation (presentation, business, data layers)
- **Event-Driven**: Message queues, pub/sub patterns
- **Serverless**: Cloud functions, managed services
- **Hybrid**: Combination of patterns

### Map Components:
- Frontend applications (web, mobile)
- Backend services (APIs, workers, cron jobs)
- Databases (SQL, NoSQL, cache, search engines)
- External services (third-party APIs, SaaS)
- Infrastructure (load balancers, CDN, message queues)
- Authentication/Authorization services

### Identify Relationships:
- Data flow between components
- API calls and dependencies
- Event streams and messages
- Database connections
- File storage access
- External API integrations

## Step 2: Generate System Architecture Diagram

Create a high-level overview using Mermaid:

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Application<br/>React.js]
        MOBILE[Mobile App<br/>React Native]
    end

    subgraph "API Layer"
        GATEWAY[API Gateway<br/>Express.js]
        AUTH[Auth Service<br/>JWT]
    end

    subgraph "Business Logic Layer"
        USER_SVC[User Service]
        ORDER_SVC[Order Service]
        PAYMENT_SVC[Payment Service]
        NOTIFICATION_SVC[Notification Service]
    end

    subgraph "Data Layer"
        POSTGRES[(PostgreSQL<br/>Primary DB)]
        REDIS[(Redis<br/>Cache)]
        ELASTICSEARCH[(Elasticsearch<br/>Search)]
    end

    subgraph "External Services"
        STRIPE[Stripe API<br/>Payments]
        SENDGRID[SendGrid<br/>Email]
        S3[AWS S3<br/>File Storage]
    end

    WEB --> GATEWAY
    MOBILE --> GATEWAY

    GATEWAY --> AUTH
    GATEWAY --> USER_SVC
    GATEWAY --> ORDER_SVC
    GATEWAY --> PAYMENT_SVC

    USER_SVC --> POSTGRES
    USER_SVC --> REDIS

    ORDER_SVC --> POSTGRES
    ORDER_SVC --> NOTIFICATION_SVC

    PAYMENT_SVC --> STRIPE
    PAYMENT_SVC --> POSTGRES

    NOTIFICATION_SVC --> SENDGRID

    USER_SVC --> S3

    style WEB fill:#e3f2fd
    style MOBILE fill:#e3f2fd
    style STRIPE fill:#fff3e0
    style SENDGRID fill:#fff3e0
    style S3 fill:#fff3e0
```

## Step 3: Generate Data Flow Diagrams

Show how data moves through the system:

### User Authentication Flow:
```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant AuthService
    participant Database
    participant Cache

    Client->>Gateway: POST /auth/login<br/>{email, password}
    Gateway->>AuthService: Validate credentials
    AuthService->>Database: Query user by email
    Database-->>AuthService: User data
    AuthService->>AuthService: Verify password hash
    AuthService->>Cache: Store session
    AuthService-->>Gateway: JWT token
    Gateway-->>Client: {token, user}

    Note over Client,Cache: Token valid for 24 hours
```

### Order Processing Flow:
```mermaid
sequenceDiagram
    participant Client
    participant OrderService
    participant InventoryService
    participant PaymentService
    participant NotificationService
    participant Database
    participant MessageQueue

    Client->>OrderService: Create Order
    OrderService->>InventoryService: Check availability
    InventoryService-->>OrderService: Items available
    OrderService->>PaymentService: Process payment
    PaymentService-->>OrderService: Payment successful
    OrderService->>Database: Save order
    OrderService->>MessageQueue: Publish OrderCreated event
    MessageQueue->>NotificationService: Consume event
    NotificationService->>Client: Send confirmation email
    OrderService-->>Client: Order created
```

## Step 4: Generate Component Relationship Diagram

Show dependencies and connections:

```mermaid
graph LR
    subgraph "Frontend"
        A[React App]
        B[Mobile App]
    end

    subgraph "Backend Services"
        C[API Gateway]
        D[User Service]
        E[Order Service]
        F[Payment Service]
        G[Notification Service]
    end

    subgraph "Data Stores"
        H[(Main Database)]
        I[(Cache)]
        J[(Search Index)]
    end

    subgraph "External"
        K[Payment Provider]
        L[Email Service]
        M[File Storage]
    end

    A -->|REST API| C
    B -->|REST API| C

    C -->|Route| D
    C -->|Route| E
    C -->|Route| F

    D -->|Read/Write| H
    D -->|Cache| I

    E -->|Read/Write| H
    E -->|Notify| G

    F -->|Process| K
    F -->|Record| H

    G -->|Send| L

    D -->|Upload| M
    E -->|Query| J

    style A fill:#4fc3f7
    style B fill:#4fc3f7
    style K fill:#ffab91
    style L fill:#ffab91
    style M fill:#ffab91
```

## Step 5: Generate Database Schema Diagram

Document data relationships:

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER ||--o{ PAYMENT_METHOD : has
    USER ||--o{ ADDRESS : owns

    ORDER ||--o{ ORDER_ITEM : contains
    ORDER ||--|| PAYMENT : "paid by"
    ORDER ||--|| ADDRESS : "ships to"

    PRODUCT ||--o{ ORDER_ITEM : "ordered in"
    PRODUCT ||--|| CATEGORY : "belongs to"
    PRODUCT ||--o{ INVENTORY : "has stock in"

    PAYMENT ||--|| PAYMENT_METHOD : "uses"

    USER {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        timestamp created_at
        boolean is_active
    }

    ORDER {
        uuid id PK
        uuid user_id FK
        decimal total_amount
        string status
        timestamp created_at
    }

    PRODUCT {
        uuid id PK
        string name
        string sku UK
        decimal price
        text description
        uuid category_id FK
    }

    ORDER_ITEM {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        integer quantity
        decimal price
    }

    PAYMENT {
        uuid id PK
        uuid order_id FK
        decimal amount
        string status
        string transaction_id
    }
```

## Step 6: Generate Deployment Architecture

Show infrastructure and deployment:

```mermaid
graph TB
    subgraph "CDN"
        CDN[CloudFlare CDN]
    end

    subgraph "Load Balancer"
        LB[AWS ALB]
    end

    subgraph "Application Tier"
        APP1[App Server 1<br/>Docker Container]
        APP2[App Server 2<br/>Docker Container]
        APP3[App Server 3<br/>Docker Container]
    end

    subgraph "Database Tier"
        PRIMARY[(Primary DB<br/>RDS PostgreSQL)]
        REPLICA[(Read Replica<br/>RDS PostgreSQL)]
        CACHE[ElastiCache<br/>Redis Cluster]
    end

    subgraph "Storage"
        S3[S3 Bucket<br/>File Storage]
    end

    subgraph "Monitoring"
        CW[CloudWatch<br/>Logs & Metrics]
    end

    CDN --> LB
    LB --> APP1
    LB --> APP2
    LB --> APP3

    APP1 --> PRIMARY
    APP2 --> PRIMARY
    APP3 --> PRIMARY

    APP1 --> REPLICA
    APP2 --> REPLICA
    APP3 --> REPLICA

    APP1 --> CACHE
    APP2 --> CACHE
    APP3 --> CACHE

    APP1 --> S3
    APP2 --> S3
    APP3 --> S3

    APP1 --> CW
    APP2 --> CW
    APP3 --> CW

    PRIMARY --> REPLICA

    style CDN fill:#e8f5e9
    style CW fill:#fff9c4
```

## Step 7: Generate State Machine Diagrams

For complex workflows:

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Submitted: Submit Order
    Submitted --> Validated: Validation Pass
    Submitted --> Rejected: Validation Fail
    Validated --> Processing: Start Processing
    Processing --> PaymentPending: Request Payment
    PaymentPending --> Paid: Payment Success
    PaymentPending --> Failed: Payment Failed
    Paid --> Fulfilling: Start Fulfillment
    Fulfilling --> Shipped: Ship Order
    Shipped --> Delivered: Confirm Delivery
    Delivered --> [*]
    Failed --> [*]
    Rejected --> [*]

    note right of Validated
        Inventory checked
        Prices verified
    end note

    note right of Paid
        Payment captured
        Receipt sent
    end note
```

## Step 8: Generate Class Diagrams

For object-oriented codebases:

```mermaid
classDiagram
    class User {
        +String id
        +String email
        +String name
        +String passwordHash
        +Date createdAt
        +authenticate(password)
        +updateProfile(data)
        +delete()
    }

    class Order {
        +String id
        +User user
        +OrderItem[] items
        +Decimal totalAmount
        +OrderStatus status
        +Date createdAt
        +addItem(product, quantity)
        +removeItem(itemId)
        +calculateTotal()
        +submit()
        +cancel()
    }

    class OrderItem {
        +String id
        +Product product
        +Integer quantity
        +Decimal price
        +calculateSubtotal()
    }

    class Product {
        +String id
        +String name
        +String sku
        +Decimal price
        +Category category
        +updatePrice(newPrice)
        +checkAvailability()
    }

    class Payment {
        +String id
        +Order order
        +Decimal amount
        +PaymentStatus status
        +String transactionId
        +process()
        +refund()
    }

    User "1" --> "*" Order : places
    Order "1" --> "*" OrderItem : contains
    OrderItem "*" --> "1" Product : references
    Order "1" --> "1" Payment : paid by
```

## Step 9: Generate Directory Structure Diagram

Visualize project organization:

```mermaid
graph TD
    ROOT[Project Root]

    ROOT --> SRC[src/]
    ROOT --> TESTS[tests/]
    ROOT --> DOCS[docs/]
    ROOT --> CONFIG[config/]

    SRC --> CONTROLLERS[controllers/]
    SRC --> SERVICES[services/]
    SRC --> MODELS[models/]
    SRC --> UTILS[utils/]
    SRC --> MIDDLEWARE[middleware/]

    CONTROLLERS --> USER_CTRL[UserController.ts]
    CONTROLLERS --> ORDER_CTRL[OrderController.ts]

    SERVICES --> USER_SVC[UserService.ts]
    SERVICES --> ORDER_SVC[OrderService.ts]

    MODELS --> USER_MODEL[User.ts]
    MODELS --> ORDER_MODEL[Order.ts]

    TESTS --> UNIT[unit/]
    TESTS --> INTEGRATION[integration/]
    TESTS --> E2E[e2e/]

    style ROOT fill:#e1f5fe
    style SRC fill:#c5e1a5
    style TESTS fill:#fff59d
```

## Step 10: Save Diagrams and Generate Documentation

Create a comprehensive architecture document:

```markdown
# System Architecture Documentation

## Overview
[Brief description of the system architecture]

## Architecture Style
[Describe the architectural pattern used]

## System Components

### Frontend Layer
[Description of frontend applications]

### Backend Layer
[Description of backend services]

### Data Layer
[Description of databases and caches]

### External Dependencies
[List of third-party services]

## Architecture Diagrams

### System Overview
[Include Mermaid diagram or image]

### Data Flow
[Include sequence diagrams]

### Component Relationships
[Include component diagram]

### Database Schema
[Include ER diagram]

### Deployment Architecture
[Include infrastructure diagram]

## Key Design Decisions

### Decision 1: [Title]
**Context:** [Why this decision was needed]
**Decision:** [What was decided]
**Consequences:** [Impact of this decision]

### Decision 2: [Title]
**Context:** [Why this decision was needed]
**Decision:** [What was decided]
**Consequences:** [Impact of this decision]

## Scalability Considerations
[How the architecture scales]

## Security Architecture
[Security measures and patterns]

## Performance Optimizations
[Caching, load balancing, etc.]

## Monitoring and Observability
[How the system is monitored]

## Disaster Recovery
[Backup and recovery strategies]

## Future Architecture Evolution
[Planned improvements]
```

Save to: `docs/architecture/README.md`

## Important Guidelines:

- **DO** analyze actual code structure to create diagrams
- **DO** use correct Mermaid syntax
- **DO** include component names found in the codebase
- **DO** show real dependencies and relationships
- **DO** use different diagram types for different views
- **DO** add explanatory notes to complex diagrams
- **DO NOT** create placeholder or fake components
- **DO NOT** show dependencies that don't exist in code
- **DO** use consistent naming across all diagrams
- **DO** color-code different types of components

## Mermaid Diagram Tips:

### Graph Types:
- `graph TB` - Top to bottom
- `graph LR` - Left to right
- `sequenceDiagram` - For interactions
- `erDiagram` - For database schemas
- `classDiagram` - For OOP structures
- `stateDiagram-v2` - For state machines

### Styling:
```mermaid
style NodeId fill:#color
style NodeId stroke:#color
style NodeId stroke-width:2px
```

## Summary Report:

```markdown
✅ Architecture Diagrams Generated

Diagrams Created:
├─ System Architecture (High-level overview)
├─ Data Flow Diagrams (2 sequences)
├─ Component Relationships
├─ Database Schema (ER Diagram)
├─ Deployment Architecture
└─ State Machine (Order workflow)

Files Created:
- docs/architecture/README.md
- docs/architecture/diagrams.md

Components Documented: [X]
Relationships Mapped: [Y]
External Dependencies: [Z]

View Diagrams:
- Copy Mermaid code to https://mermaid.live for preview
- Use VSCode Mermaid extension for inline viewing
- Include in documentation for team reference

Next Steps:
1. Review diagrams for accuracy
2. Add to project wiki or documentation site
3. Keep updated as architecture evolves
4. Share with team for feedback
```

---

Begin by analyzing the project structure to identify all components, then generate comprehensive diagrams showing different architectural views.
