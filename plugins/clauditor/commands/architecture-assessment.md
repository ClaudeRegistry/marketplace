---
description: Generate architecture diagrams, dependency graphs, sequence diagrams, and component interaction maps from codebase analysis
model: inherit
---

You MUST generate comprehensive architecture diagrams and documentation following every single section below. DO NOT summarize or abbreviate. Output the full detailed analysis for each section exactly as specified:

# Architecture Diagram Generation Report

## System Architecture Discovery

### Component Identification
Scan and analyze the codebase to identify:

- **Application Services**: Web servers, APIs, microservices
- **Data Layer**: Databases, caches, message queues, file storage
- **External Dependencies**: Third-party APIs, SaaS services, external databases
- **Infrastructure Components**: Load balancers, proxies, CDNs, firewalls
- **Client Applications**: Web frontends, mobile apps, desktop clients

### Technology Stack Mapping

| Component Type | Technologies Detected | Instances | Communication Protocols |
|---------------|----------------------|-----------|------------------------|
| Web Servers | Express.js, Spring Boot, FastAPI | 5 | HTTP/HTTPS, WebSocket |
| Databases | PostgreSQL, MongoDB, Redis | 8 | TCP, SSL |
| Message Queues | RabbitMQ, Apache Kafka | 3 | AMQP, TCP |
| Caches | Redis, Memcached | 4 | TCP, Redis Protocol |
| Search Engines | Elasticsearch, Solr | 2 | HTTP, REST |
| File Storage | AWS S3, MinIO | 2 | HTTP, S3 API |

## High-Level Architecture Diagram

### System Overview (C4 Model - Level 1)

```mermaid
graph TD
    U[Users] --> WEB[Web Application]
    M[Mobile Users] --> API[API Gateway]
    A[Administrators] --> ADMIN[Admin Portal]

    WEB --> API
    ADMIN --> API

    API --> USER[User Service]
    API --> ORDER[Order Service]
    API --> PAYMENT[Payment Service]
    API --> NOTIFICATION[Notification Service]

    USER --> DB1[(User Database)]
    ORDER --> DB2[(Order Database)]
    PAYMENT --> DB3[(Payment Database)]

    ORDER --> QUEUE[Message Queue]
    PAYMENT --> QUEUE
    NOTIFICATION --> QUEUE

    PAYMENT --> EXT1[Payment Gateway]
    NOTIFICATION --> EXT2[Email Service]

    style U fill:#e1f5fe
    style M fill:#e1f5fe
    style A fill:#e1f5fe
    style EXT1 fill:#ffebee
    style EXT2 fill:#ffebee
```

### Container Diagram (C4 Model - Level 2)

```mermaid
graph TB
    subgraph "User Interfaces"
        WEB[Web Application<br/>React.js]
        MOBILE[Mobile App<br/>React Native]
        ADMIN[Admin Portal<br/>Vue.js]
    end

    subgraph "API Layer"
        GATEWAY[API Gateway<br/>Kong/NGINX]
        AUTH[Auth Service<br/>Node.js]
    end

    subgraph "Core Services"
        USER[User Service<br/>Java Spring Boot]
        ORDER[Order Service<br/>Python FastAPI]
        PAYMENT[Payment Service<br/>Go Gin]
        PRODUCT[Product Service<br/>Node.js Express]
        NOTIFICATION[Notification Service<br/>Python Celery]
    end

    subgraph "Data Layer"
        USERDB[(User DB<br/>PostgreSQL)]
        ORDERDB[(Order DB<br/>MongoDB)]
        PRODUCTDB[(Product DB<br/>PostgreSQL)]
        CACHE[(Cache<br/>Redis)]
        SEARCH[(Search<br/>Elasticsearch)]
    end

    subgraph "Message Layer"
        QUEUE[Message Queue<br/>RabbitMQ]
        STREAM[Event Stream<br/>Apache Kafka]
    end

    subgraph "External Services"
        PAYMENT_GW[Payment Gateway<br/>Stripe API]
        EMAIL[Email Service<br/>SendGrid]
        SMS[SMS Service<br/>Twilio]
        STORAGE[File Storage<br/>AWS S3]
    end

    WEB --> GATEWAY
    MOBILE --> GATEWAY
    ADMIN --> GATEWAY

    GATEWAY --> AUTH
    GATEWAY --> USER
    GATEWAY --> ORDER
    GATEWAY --> PAYMENT
    GATEWAY --> PRODUCT

    USER --> USERDB
    USER --> CACHE
    ORDER --> ORDERDB
    ORDER --> CACHE
    PRODUCT --> PRODUCTDB
    PRODUCT --> SEARCH

    ORDER --> QUEUE
    PAYMENT --> QUEUE
    NOTIFICATION --> QUEUE

    ORDER --> STREAM
    USER --> STREAM

    PAYMENT --> PAYMENT_GW
    NOTIFICATION --> EMAIL
    NOTIFICATION --> SMS
    PRODUCT --> STORAGE
```

## Component Diagram (C4 Model - Level 3)

### User Service Internal Architecture

```mermaid
graph TB
    subgraph "User Service"
        CTRL[User Controller]
        SVC[User Service Layer]
        REPO[User Repository]
        VALID[Validation Layer]
        CACHE_L[Cache Layer]

        CTRL --> VALID
        VALID --> SVC
        SVC --> REPO
        SVC --> CACHE_L

        subgraph "Domain Models"
            USER_M[User Model]
            PROFILE_M[Profile Model]
            ROLE_M[Role Model]
        end

        SVC --> USER_M
        SVC --> PROFILE_M
        SVC --> ROLE_M
    end

    REPO --> USERDB[(User Database)]
    CACHE_L --> REDIS[(Redis Cache)]

    CTRL --> API_GW[API Gateway]
    SVC --> AUTH_SVC[Auth Service]
    SVC --> AUDIT_SVC[Audit Service]
```

### Order Service Internal Architecture

```mermaid
graph TB
    subgraph "Order Service"
        API[REST API Layer]
        BL[Business Logic]
        SAGA[Saga Orchestrator]
        REPO_L[Repository Layer]
        EVENT[Event Publisher]

        API --> BL
        BL --> SAGA
        BL --> REPO_L
        BL --> EVENT

        subgraph "Domain Models"
            ORDER_M[Order Model]
            ITEM_M[OrderItem Model]
            STATUS_M[OrderStatus Model]
        end

        BL --> ORDER_M
        BL --> ITEM_M
        BL --> STATUS_M

        subgraph "Saga Steps"
            VALIDATE[Validate Order]
            RESERVE[Reserve Inventory]
            PROCESS_PAY[Process Payment]
            FULFILL[Fulfill Order]
        end

        SAGA --> VALIDATE
        SAGA --> RESERVE
        SAGA --> PROCESS_PAY
        SAGA --> FULFILL
    end

    REPO_L --> ORDERDB[(Order Database)]
    EVENT --> KAFKA[Event Stream]

    RESERVE --> INVENTORY_SVC[Inventory Service]
    PROCESS_PAY --> PAYMENT_SVC[Payment Service]
    FULFILL --> SHIPPING_SVC[Shipping Service]
```

## Data Flow Diagrams

### User Registration Flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant UserService
    participant AuthService
    participant Database
    participant EmailService
    participant AuditService

    Client->>Gateway: POST /users/register
    Gateway->>UserService: Create User Request

    UserService->>UserService: Validate Input
    UserService->>Database: Check Email Exists
    Database-->>UserService: Email Available

    UserService->>AuthService: Generate Password Hash
    AuthService-->>UserService: Hashed Password

    UserService->>Database: Save User
    Database-->>UserService: User Created

    UserService->>EmailService: Send Welcome Email
    UserService->>AuditService: Log User Creation

    UserService-->>Gateway: User Created Response
    Gateway-->>Client: 201 Created
```

### Order Processing Flow

```mermaid
sequenceDiagram
    participant Client
    participant OrderService
    participant InventoryService
    participant PaymentService
    participant NotificationService
    participant EventBus

    Client->>OrderService: Create Order

    Note over OrderService: Saga Transaction Begins

    OrderService->>InventoryService: Reserve Items
    InventoryService-->>OrderService: Items Reserved

    OrderService->>PaymentService: Process Payment
    PaymentService-->>OrderService: Payment Successful

    OrderService->>OrderService: Create Order Record
    OrderService->>EventBus: Publish OrderCreated Event

    EventBus->>NotificationService: OrderCreated Event
    NotificationService->>Client: Send Order Confirmation

    OrderService-->>Client: Order Created Successfully

    Note over OrderService: Saga Transaction Complete
```

### Error Handling Flow

```mermaid
sequenceDiagram
    participant Client
    participant OrderService
    participant InventoryService
    participant PaymentService
    participant EventBus

    Client->>OrderService: Create Order

    OrderService->>InventoryService: Reserve Items
    InventoryService-->>OrderService: Items Reserved

    OrderService->>PaymentService: Process Payment
    PaymentService-->>OrderService: Payment Failed

    Note over OrderService: Saga Compensation Begins

    OrderService->>InventoryService: Release Reserved Items
    InventoryService-->>OrderService: Items Released

    OrderService->>EventBus: Publish OrderFailed Event
    OrderService-->>Client: Order Failed - Payment Issue

    Note over OrderService: Saga Compensation Complete
```

## Network Architecture Diagram

### Infrastructure Layout

```mermaid
graph TB
    subgraph "Internet"
        USERS[Users]
        MOBILE[Mobile Users]
    end

    subgraph "DMZ"
        LB[Load Balancer<br/>HAProxy]
        WAF[Web Application Firewall]
        CDN[CDN<br/>CloudFlare]
    end

    subgraph "Public Subnet"
        WEB1[Web Server 1]
        WEB2[Web Server 2]
        API_GW[API Gateway]
    end

    subgraph "Private Subnet - App Tier"
        APP1[App Server 1<br/>User Service]
        APP2[App Server 2<br/>Order Service]
        APP3[App Server 3<br/>Payment Service]
        APP4[App Server 4<br/>Product Service]
    end

    subgraph "Private Subnet - Data Tier"
        DB_PRIMARY[(Primary DB<br/>PostgreSQL)]
        DB_REPLICA[(Replica DB<br/>PostgreSQL)]
        CACHE_CLUSTER[Redis Cluster]
        SEARCH_CLUSTER[Elasticsearch Cluster]
    end

    subgraph "Message Layer"
        MQ_CLUSTER[RabbitMQ Cluster]
        KAFKA_CLUSTER[Kafka Cluster]
    end

    USERS --> CDN
    MOBILE --> CDN
    CDN --> WAF
    WAF --> LB

    LB --> WEB1
    LB --> WEB2
    LB --> API_GW

    WEB1 --> APP1
    WEB2 --> APP2
    API_GW --> APP1
    API_GW --> APP2
    API_GW --> APP3
    API_GW --> APP4

    APP1 --> DB_PRIMARY
    APP2 --> DB_PRIMARY
    APP3 --> DB_PRIMARY
    APP4 --> DB_PRIMARY

    APP1 --> DB_REPLICA
    APP2 --> DB_REPLICA
    APP4 --> DB_REPLICA

    APP1 --> CACHE_CLUSTER
    APP2 --> CACHE_CLUSTER
    APP4 --> CACHE_CLUSTER
    APP4 --> SEARCH_CLUSTER

    APP2 --> MQ_CLUSTER
    APP3 --> MQ_CLUSTER
    APP1 --> KAFKA_CLUSTER
    APP2 --> KAFKA_CLUSTER
```

## Service Dependency Graph

### Service Interconnection Map

```mermaid
graph TD
    subgraph "External Services"
        STRIPE[Stripe Payment API]
        SENDGRID[SendGrid Email API]
        TWILIO[Twilio SMS API]
        S3[AWS S3 Storage]
    end

    subgraph "Core Services"
        API_GATEWAY[API Gateway]
        USER_SVC[User Service]
        ORDER_SVC[Order Service]
        PAYMENT_SVC[Payment Service]
        PRODUCT_SVC[Product Service]
        INVENTORY_SVC[Inventory Service]
        NOTIFICATION_SVC[Notification Service]
        AUTH_SVC[Auth Service]
    end

    subgraph "Data Stores"
        USER_DB[(User DB)]
        ORDER_DB[(Order DB)]
        PRODUCT_DB[(Product DB)]
        CACHE[(Redis Cache)]
        SEARCH[(Elasticsearch)]
        MQ[Message Queue]
    end

    API_GATEWAY --> USER_SVC
    API_GATEWAY --> ORDER_SVC
    API_GATEWAY --> PAYMENT_SVC
    API_GATEWAY --> PRODUCT_SVC

    USER_SVC --> AUTH_SVC
    USER_SVC --> USER_DB
    USER_SVC --> CACHE
    USER_SVC --> MQ

    ORDER_SVC --> USER_SVC
    ORDER_SVC --> INVENTORY_SVC
    ORDER_SVC --> PAYMENT_SVC
    ORDER_SVC --> ORDER_DB
    ORDER_SVC --> MQ

    PAYMENT_SVC --> USER_SVC
    PAYMENT_SVC --> STRIPE
    PAYMENT_SVC --> MQ

    PRODUCT_SVC --> PRODUCT_DB
    PRODUCT_SVC --> SEARCH
    PRODUCT_SVC --> S3
    PRODUCT_SVC --> CACHE

    INVENTORY_SVC --> PRODUCT_DB
    INVENTORY_SVC --> MQ

    NOTIFICATION_SVC --> MQ
    NOTIFICATION_SVC --> SENDGRID
    NOTIFICATION_SVC --> TWILIO

    AUTH_SVC --> USER_DB
    AUTH_SVC --> CACHE

    style STRIPE fill:#ffebee
    style SENDGRID fill:#ffebee
    style TWILIO fill:#ffebee
    style S3 fill:#ffebee
```

### Dependency Risk Analysis

| Service | Critical Dependencies | Fallback Strategy | Risk Level |
|---------|----------------------|-------------------|------------|
| Order Service | User Service, Payment Service, Inventory Service | Queue orders for later processing | HIGH |
| Payment Service | Stripe API, User Service | Cache payment info, retry logic | CRITICAL |
| User Service | Auth Service, User Database | Read replicas, caching | MEDIUM |
| Product Service | Product Database, Elasticsearch | Database fallback for search | LOW |
| Notification Service | SendGrid, Twilio, Message Queue | Queue notifications, multiple providers | MEDIUM |

## Database Relationship Diagram

### Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER ||--o{ PAYMENT_METHOD : owns
    USER ||--o{ ADDRESS : has
    USER ||--o{ REVIEW : writes

    ORDER ||--o{ ORDER_ITEM : contains
    ORDER ||--|| PAYMENT : "paid with"
    ORDER ||--|| ADDRESS : "shipped to"
    ORDER ||--o{ ORDER_STATUS_HISTORY : tracks

    PRODUCT ||--o{ ORDER_ITEM : "ordered as"
    PRODUCT ||--o{ REVIEW : receives
    PRODUCT ||--|| CATEGORY : "belongs to"
    PRODUCT ||--o{ PRODUCT_IMAGE : displays
    PRODUCT ||--|| INVENTORY : stocks

    CATEGORY ||--o{ PRODUCT : contains

    PAYMENT_METHOD ||--o{ PAYMENT : "used for"

    USER {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        string phone
        timestamp created_at
        timestamp updated_at
        boolean is_active
        string role
    }

    ORDER {
        uuid id PK
        uuid user_id FK
        uuid shipping_address_id FK
        decimal total_amount
        string status
        timestamp created_at
        timestamp updated_at
    }

    PRODUCT {
        uuid id PK
        uuid category_id FK
        string name
        text description
        decimal price
        decimal weight
        string sku UK
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    ORDER_ITEM {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        integer quantity
        decimal unit_price
        decimal total_price
    }

    PAYMENT {
        uuid id PK
        uuid order_id FK
        uuid payment_method_id FK
        decimal amount
        string status
        string transaction_id
        timestamp processed_at
    }
```

## API Interaction Diagrams

### REST API Architecture

```mermaid
graph LR
    subgraph "Client Layer"
        WEB[Web App]
        MOBILE[Mobile App]
        ADMIN[Admin Panel]
    end

    subgraph "API Gateway"
        GATEWAY[Kong Gateway]
        AUTH_MW[Auth Middleware]
        RATE_MW[Rate Limiting]
        LOG_MW[Logging Middleware]
    end

    subgraph "Service Layer"
        USER_API[User API<br/>/api/v1/users]
        ORDER_API[Order API<br/>/api/v1/orders]
        PRODUCT_API[Product API<br/>/api/v1/products]
        PAYMENT_API[Payment API<br/>/api/v1/payments]
    end

    WEB --> GATEWAY
    MOBILE --> GATEWAY
    ADMIN --> GATEWAY

    GATEWAY --> AUTH_MW
    AUTH_MW --> RATE_MW
    RATE_MW --> LOG_MW

    LOG_MW --> USER_API
    LOG_MW --> ORDER_API
    LOG_MW --> PRODUCT_API
    LOG_MW --> PAYMENT_API
```

### GraphQL Schema Relationships

```mermaid
graph TB
    subgraph "GraphQL Schema"
        QUERY[Query Type]
        MUTATION[Mutation Type]
        SUBSCRIPTION[Subscription Type]

        USER_TYPE[User Type]
        ORDER_TYPE[Order Type]
        PRODUCT_TYPE[Product Type]
        PAYMENT_TYPE[Payment Type]

        USER_INPUT[User Input Types]
        ORDER_INPUT[Order Input Types]
        PRODUCT_INPUT[Product Input Types]
    end

    QUERY --> USER_TYPE
    QUERY --> ORDER_TYPE
    QUERY --> PRODUCT_TYPE

    MUTATION --> USER_INPUT
    MUTATION --> ORDER_INPUT
    MUTATION --> PRODUCT_INPUT

    SUBSCRIPTION --> ORDER_TYPE
    SUBSCRIPTION --> USER_TYPE

    USER_TYPE --> ORDER_TYPE
    ORDER_TYPE --> PRODUCT_TYPE
    ORDER_TYPE --> PAYMENT_TYPE
    ORDER_TYPE --> USER_TYPE
```

## Event-Driven Architecture

### Event Flow Diagram

```mermaid
graph TD
    subgraph "Event Sources"
        USER_SVC[User Service]
        ORDER_SVC[Order Service]
        PAYMENT_SVC[Payment Service]
        INVENTORY_SVC[Inventory Service]
    end

    subgraph "Event Bus"
        KAFKA[Apache Kafka]

        subgraph "Topics"
            USER_EVENTS[user.events]
            ORDER_EVENTS[order.events]
            PAYMENT_EVENTS[payment.events]
            INVENTORY_EVENTS[inventory.events]
        end
    end

    subgraph "Event Consumers"
        NOTIFICATION_SVC[Notification Service]
        ANALYTICS_SVC[Analytics Service]
        AUDIT_SVC[Audit Service]
        RECOMMENDATION_SVC[Recommendation Service]
    end

    USER_SVC --> USER_EVENTS
    ORDER_SVC --> ORDER_EVENTS
    PAYMENT_SVC --> PAYMENT_EVENTS
    INVENTORY_SVC --> INVENTORY_EVENTS

    USER_EVENTS --> NOTIFICATION_SVC
    USER_EVENTS --> ANALYTICS_SVC
    USER_EVENTS --> RECOMMENDATION_SVC

    ORDER_EVENTS --> NOTIFICATION_SVC
    ORDER_EVENTS --> ANALYTICS_SVC
    ORDER_EVENTS --> AUDIT_SVC

    PAYMENT_EVENTS --> AUDIT_SVC
    PAYMENT_EVENTS --> ANALYTICS_SVC

    INVENTORY_EVENTS --> ANALYTICS_SVC
    INVENTORY_EVENTS --> NOTIFICATION_SVC
```

### Saga Pattern Implementation

```mermaid
graph TD
    subgraph "Order Processing Saga"
        START[Start Order]

        VALIDATE[Validate Order]
        RESERVE[Reserve Inventory]
        CHARGE[Charge Payment]
        FULFILL[Fulfill Order]
        COMPLETE[Complete Order]

        COMP_RELEASE[Compensate: Release Inventory]
        COMP_REFUND[Compensate: Refund Payment]
        COMP_CANCEL[Compensate: Cancel Order]

        START --> VALIDATE
        VALIDATE --> RESERVE
        RESERVE --> CHARGE
        CHARGE --> FULFILL
        FULFILL --> COMPLETE

        VALIDATE -->|Fail| COMP_CANCEL
        RESERVE -->|Fail| COMP_CANCEL
        CHARGE -->|Fail| COMP_RELEASE
        FULFILL -->|Fail| COMP_REFUND
    end
```

## Security Architecture Diagram

### Security Layers

```mermaid
graph TB
    subgraph "External Threats"
        ATTACKER[Malicious Actors]
        BOT[Automated Bots]
    end

    subgraph "Security Perimeter"
        WAF[Web Application Firewall]
        DDOS[DDoS Protection]
        RATE_LIMIT[Rate Limiting]
    end

    subgraph "Authentication Layer"
        OAUTH[OAuth2 Provider]
        JWT_VAL[JWT Validator]
        MFA[Multi-Factor Auth]
    end

    subgraph "Authorization Layer"
        RBAC[Role-Based Access Control]
        POLICY[Policy Engine]
        SCOPE[API Scopes]
    end

    subgraph "Application Security"
        INPUT_VAL[Input Validation]
        SANITIZER[Data Sanitization]
        CSRF[CSRF Protection]
        XSS[XSS Protection]
    end

    subgraph "Data Security"
        ENCRYPT[Data Encryption]
        HASH[Password Hashing]
        MASK[Data Masking]
        AUDIT[Audit Logging]
    end

    subgraph "Network Security"
        TLS[TLS/SSL]
        VPN[VPN Access]
        FIREWALL[Network Firewall]
        ISOLATION[Network Isolation]
    end

    ATTACKER --> WAF
    BOT --> DDOS
    WAF --> RATE_LIMIT
    DDOS --> RATE_LIMIT

    RATE_LIMIT --> OAUTH
    OAUTH --> JWT_VAL
    JWT_VAL --> MFA

    MFA --> RBAC
    RBAC --> POLICY
    POLICY --> SCOPE

    SCOPE --> INPUT_VAL
    INPUT_VAL --> SANITIZER
    SANITIZER --> CSRF
    CSRF --> XSS

    XSS --> ENCRYPT
    ENCRYPT --> HASH
    HASH --> MASK
    MASK --> AUDIT

    AUDIT --> TLS
    TLS --> VPN
    VPN --> FIREWALL
    FIREWALL --> ISOLATION
```

## Deployment Architecture

### Container Orchestration

```mermaid
graph TB
    subgraph "Kubernetes Cluster"
        subgraph "Namespace: production"
            subgraph "Web Tier"
                WEB_POD1[Web Pod 1]
                WEB_POD2[Web Pod 2]
                WEB_SVC[Web Service]
            end

            subgraph "API Tier"
                API_POD1[API Pod 1]
                API_POD2[API Pod 2]
                API_POD3[API Pod 3]
                API_SVC[API Service]
            end

            subgraph "App Tier"
                USER_POD[User Service Pod]
                ORDER_POD[Order Service Pod]
                PAYMENT_POD[Payment Service Pod]
            end
        end

        subgraph "System Pods"
            INGRESS[Ingress Controller]
            DNS[CoreDNS]
            METRICS[Metrics Server]
        end

        subgraph "Storage"
            PV1[Persistent Volume 1]
            PV2[Persistent Volume 2]
            PVC1[PVC Database]
            PVC2[PVC Files]
        end
    end

    subgraph "External Load Balancer"
        ELB[AWS ELB]
    end

    ELB --> INGRESS
    INGRESS --> WEB_SVC
    WEB_SVC --> WEB_POD1
    WEB_SVC --> WEB_POD2

    WEB_POD1 --> API_SVC
    WEB_POD2 --> API_SVC
    API_SVC --> API_POD1
    API_SVC --> API_POD2
    API_SVC --> API_POD3

    API_POD1 --> USER_POD
    API_POD2 --> ORDER_POD
    API_POD3 --> PAYMENT_POD

    USER_POD --> PVC1
    ORDER_POD --> PVC1
    PVC1 --> PV1
    PVC2 --> PV2
```

## CI/CD Pipeline Architecture

### Build and Deployment Flow

```mermaid
graph LR
    subgraph "Source Control"
        GIT[Git Repository]
        BRANCH[Feature Branch]
        MAIN[Main Branch]
    end

    subgraph "CI Pipeline"
        TRIGGER[Webhook Trigger]
        BUILD[Build Stage]
        TEST[Test Stage]
        SCAN[Security Scan]
        PACKAGE[Package Stage]
    end

    subgraph "Artifact Storage"
        REGISTRY[Container Registry]
        HELM[Helm Repository]
    end

    subgraph "CD Pipeline"
        DEPLOY_DEV[Deploy to Dev]
        DEPLOY_STAGE[Deploy to Staging]
        DEPLOY_PROD[Deploy to Production]
    end

    subgraph "Environments"
        DEV[Development]
        STAGING[Staging]
        PROD[Production]
    end

    BRANCH --> TRIGGER
    MAIN --> TRIGGER
    TRIGGER --> BUILD
    BUILD --> TEST
    TEST --> SCAN
    SCAN --> PACKAGE

    PACKAGE --> REGISTRY
    PACKAGE --> HELM

    REGISTRY --> DEPLOY_DEV
    DEPLOY_DEV --> DEV

    DEV --> DEPLOY_STAGE
    DEPLOY_STAGE --> STAGING

    STAGING --> DEPLOY_PROD
    DEPLOY_PROD --> PROD
```

## Monitoring and Observability Architecture

### Observability Stack

```mermaid
graph TB
    subgraph "Application Layer"
        APP1[User Service]
        APP2[Order Service]
        APP3[Payment Service]
    end

    subgraph "Data Collection"
        AGENT[Monitoring Agent]
        OTEL[OpenTelemetry Collector]
        FILEBEAT[Filebeat]
    end

    subgraph "Storage & Processing"
        PROMETHEUS[Prometheus]
        ES[Elasticsearch]
        JAEGER[Jaeger]
        INFLUX[InfluxDB]
    end

    subgraph "Visualization"
        GRAFANA[Grafana]
        KIBANA[Kibana]
        JAEGER_UI[Jaeger UI]
    end

    subgraph "Alerting"
        ALERT_MGR[Alert Manager]
        PAGER[PagerDuty]
        SLACK[Slack]
        EMAIL[Email]
    end

    APP1 --> AGENT
    APP2 --> AGENT
    APP3 --> AGENT

    APP1 --> OTEL
    APP2 --> OTEL
    APP3 --> OTEL

    APP1 --> FILEBEAT
    APP2 --> FILEBEAT
    APP3 --> FILEBEAT

    AGENT --> PROMETHEUS
    OTEL --> JAEGER
    FILEBEAT --> ES

    PROMETHEUS --> GRAFANA
    JAEGER --> JAEGER_UI
    ES --> KIBANA

    PROMETHEUS --> ALERT_MGR
    ALERT_MGR --> PAGER
    ALERT_MGR --> SLACK
    ALERT_MGR --> EMAIL
```

## Performance Architecture

### Caching Strategy

```mermaid
graph TB
    subgraph "Client Side"
        BROWSER[Browser Cache]
        MOBILE_CACHE[Mobile App Cache]
    end

    subgraph "CDN Layer"
        CDN[Content Delivery Network]
        EDGE[Edge Caching]
    end

    subgraph "Application Layer"
        API_CACHE[API Response Cache]
        SESSION[Session Cache]
        QUERY_CACHE[Query Result Cache]
    end

    subgraph "Data Layer"
        REDIS[Redis Cache]
        MEMCACHED[Memcached]
        DB_CACHE[Database Query Cache]
    end

    subgraph "Database"
        PRIMARY_DB[(Primary Database)]
        READ_REPLICA[(Read Replica)]
    end

    BROWSER --> CDN
    MOBILE_CACHE --> CDN
    CDN --> EDGE

    EDGE --> API_CACHE
    API_CACHE --> SESSION
    SESSION --> QUERY_CACHE

    QUERY_CACHE --> REDIS
    QUERY_CACHE --> MEMCACHED
    QUERY_CACHE --> DB_CACHE

    DB_CACHE --> READ_REPLICA
    READ_REPLICA --> PRIMARY_DB
```

## Disaster Recovery Architecture

### Multi-Region Setup

```mermaid
graph TB
    subgraph "Primary Region - US East"
        subgraph "Production Environment"
            LB1[Load Balancer]
            APP1[Application Cluster]
            DB1[(Primary Database)]
            CACHE1[Cache Cluster]
        end

        subgraph "Backup Systems"
            BACKUP1[Backup Service]
            SNAPSHOT1[DB Snapshots]
        end
    end

    subgraph "Secondary Region - US West"
        subgraph "Standby Environment"
            LB2[Load Balancer]
            APP2[Application Cluster]
            DB2[(Standby Database)]
            CACHE2[Cache Cluster]
        end

        subgraph "Backup Systems"
            BACKUP2[Backup Service]
            SNAPSHOT2[DB Snapshots]
        end
    end

    subgraph "Global Services"
        DNS[Global DNS]
        MONITORING[Global Monitoring]
        ALERTING[Alerting System]
    end

    DNS --> LB1
    DNS -.->|Failover| LB2

    DB1 -->|Replication| DB2
    BACKUP1 -->|Cross-Region Backup| SNAPSHOT2

    MONITORING --> APP1
    MONITORING --> APP2
    MONITORING --> ALERTING
```

## Generated Documentation Summary

### Architecture Analysis Report

| Component | Type | Technology | Status | Dependencies | Risk Level |
|-----------|------|------------|--------|--------------|------------|
| API Gateway | Infrastructure | Kong/NGINX | Active | None | LOW |
| User Service | Core Service | Java Spring Boot | Active | Auth Service, User DB | MEDIUM |
| Order Service | Core Service | Python FastAPI | Active | User, Payment, Inventory | HIGH |
| Payment Service | Core Service | Go Gin | Active | Stripe API, User Service | CRITICAL |
| Notification Service | Support Service | Python Celery | Active | Email/SMS APIs, Message Queue | MEDIUM |

### Architectural Patterns Identified

1. **Microservices Architecture**: Services decomposed by business capability
2. **API Gateway Pattern**: Centralized request routing and cross-cutting concerns
3. **Database per Service**: Each service owns its data
4. **Event-Driven Architecture**: Asynchronous communication via message queues
5. **CQRS Pattern**: Separate read and write models in some services
6. **Saga Pattern**: Distributed transaction management
7. **Circuit Breaker Pattern**: Fault tolerance and resilience

### Technical Debt and Recommendations

#### Immediate Improvements
1. **Service Mesh Implementation**: Add Istio for better service communication
2. **API Versioning**: Implement consistent versioning strategy
3. **Monitoring Enhancement**: Add distributed tracing with OpenTelemetry
4. **Security Hardening**: Implement zero-trust networking

#### Long-term Architectural Goals
1. **Event Sourcing**: Implement for critical business events
2. **Multi-Region Deployment**: Geographic distribution for DR
3. **GraphQL Federation**: Unified API layer across services
4. **Serverless Migration**: Move support services to serverless platforms

---

**Note**: All diagrams are generated based on actual codebase analysis. Update component names, technologies, and relationships to match the specific project architecture. Include actual service endpoints, database schemas, and infrastructure components found in the codebase.