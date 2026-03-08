# Mermaid Diagram Patterns Reference

Complete syntax reference and reusable patterns for all supported Mermaid diagram types.

## Node Shape Reference

Use node shapes to convey the type of component at a glance.

| Shape | Syntax | Use For |
|-------|--------|---------|
| Rectangle | `A[Label]` | Generic process, service, application |
| Rounded rectangle | `A(Label)` | Start/end points, user actions |
| Stadium / Pill | `A([Label])` | Terminal events, triggers |
| Cylinder | `A[(Label)]` | Databases, persistent storage |
| Circle | `A((Label))` | Connection points, junctions |
| Diamond / Rhombus | `A{Label}` | Decision points, conditionals |
| Hexagon | `A{{Label}}` | Preparation steps, configuration |
| Parallelogram | `A[/Label/]` | Input/output operations |
| Trapezoid | `A[/Label\]` | Manual operations |
| Double circle | `A(((Label)))` | External endpoints, events |
| Subroutine | `A[[Label]]` | Predefined process, library call |
| Asymmetric | `A>Label]` | Flags, signals, off-page connectors |

## Arrow Type Reference

Use arrow styles to communicate the nature of connections.

| Arrow | Syntax | Meaning |
|-------|--------|---------|
| Solid arrow | `-->` | Synchronous call, direct dependency |
| Dotted arrow | `-.->` | Asynchronous call, optional path |
| Thick arrow | `==>` | Primary data flow, critical path |
| Solid with label | `-->\|label\|` | Labeled synchronous connection |
| Dotted with label | `-.->\|label\|` | Labeled async connection |
| Thick with label | `==>\|label\|` | Labeled critical path |
| No arrowhead | `---` | Undirected association |
| Dotted no arrowhead | `-.-` | Weak association |
| Bidirectional | `<-->` | Two-way communication |

Longer dashes add length to arrows for layout control: `---->` is longer than `-->`.

## Flowchart / Graph Diagram

The most versatile diagram type. Use for architecture overviews, data flows, decision trees, and process maps.

### Pattern

```mermaid
graph TB
    %% E-Commerce Order Processing Pipeline

    classDef entryPoint fill:#4A90D9,stroke:#2A5F8F,color:#FFFFFF
    classDef service fill:#7B68EE,stroke:#5B48CE,color:#FFFFFF
    classDef dataStore fill:#2ECC71,stroke:#1A9B52,color:#FFFFFF
    classDef external fill:#E67E22,stroke:#C46A15,color:#FFFFFF
    classDef decision fill:#F39C12,stroke:#D4850A,color:#000000

    Client[Web Client]:::entryPoint
    API[API Gateway]:::entryPoint

    Validate{Valid Order?}:::decision
    Process[Order Processor]:::service
    Inventory[Inventory Service]:::service
    Payment[Payment Service]:::service

    OrderDB[(Order Database)]:::dataStore
    InventoryDB[(Inventory Database)]:::dataStore

    PaymentGW[Payment Gateway]:::external
    EmailSvc[Email Provider]:::external

    Client -->|POST /orders| API
    API --> Validate
    Validate -->|Yes| Process
    Validate -->|No| Client
    Process --> Inventory -->|Reserve stock| InventoryDB
    Process --> Payment -->|Charge card| PaymentGW
    Payment -->|Confirmation| Process
    Process -->|Save order| OrderDB
    Process -.->|Send receipt| EmailSvc
```

### Key Syntax Notes

- Declare `classDef` styles before node definitions for clean organization
- Apply classes with `:::className` suffix on the node declaration
- Use `|label|` on arrows to annotate the relationship
- Use `-.->` for async or optional connections (e.g., sending email)
- Add `%%` comments to describe the diagram purpose

## Sequence Diagram

Use for showing message flow between participants over time. Ideal for API call chains, authentication flows, and distributed system interactions.

### Pattern

```mermaid
sequenceDiagram
    %% User Authentication with OAuth 2.0

    actor User
    participant Browser
    participant AuthServer as Auth Server
    participant ResourceAPI as Resource API
    participant UserDB as User Database

    User->>Browser: Click "Sign In"
    Browser->>AuthServer: GET /authorize?client_id=app1
    AuthServer-->>Browser: Redirect to login page
    User->>Browser: Enter credentials
    Browser->>AuthServer: POST /login (email, password)

    alt Valid credentials
        AuthServer->>UserDB: Verify credentials
        UserDB-->>AuthServer: User record
        AuthServer-->>Browser: Redirect with auth code
        Browser->>AuthServer: POST /token (auth code)
        AuthServer-->>Browser: Access token + refresh token
        Browser->>ResourceAPI: GET /profile (Bearer token)
        ResourceAPI-->>Browser: User profile data
    else Invalid credentials
        AuthServer-->>Browser: 401 Unauthorized
        Browser-->>User: Show error message
    end
```

### Key Syntax

| Element | Syntax | Purpose |
|---------|--------|---------|
| Participant | `participant Alias as Display Name` | Define a participant with a readable label |
| Actor | `actor Name` | Define a human actor (stick figure icon) |
| Solid arrow | `->>` | Synchronous request |
| Dashed arrow | `-->>` | Response / return |
| Conditional | `alt ... else ... end` | Alternative paths |
| Optional | `opt ... end` | Optional interaction block |
| Loop | `loop Description ... end` | Repeated interaction |
| Parallel | `par ... and ... end` | Concurrent operations |
| Note | `Note over A,B: text` | Annotation spanning participants |
| Activation | `activate A` / `deactivate A` | Show active processing period |

## ER Diagram

Use for modeling database schemas, data models, and entity relationships.

### Pattern

```mermaid
erDiagram
    %% E-Commerce Data Model

    CUSTOMER {
        uuid id PK
        string email UK
        string first_name
        string last_name
        timestamp created_at
        timestamp updated_at
    }

    ORDER {
        uuid id PK
        uuid customer_id FK
        decimal total_amount
        string currency
        string status
        timestamp placed_at
        timestamp fulfilled_at
    }

    ORDER_ITEM {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        decimal unit_price
    }

    PRODUCT {
        uuid id PK
        string sku UK
        string name
        text description
        decimal price
        int stock_count
        uuid category_id FK
    }

    CATEGORY {
        uuid id PK
        string name UK
        string slug UK
        uuid parent_id FK
    }

    CUSTOMER ||--o{ ORDER : "places"
    ORDER ||--|{ ORDER_ITEM : "contains"
    PRODUCT ||--o{ ORDER_ITEM : "appears in"
    CATEGORY ||--o{ PRODUCT : "groups"
    CATEGORY |o--o{ CATEGORY : "has subcategories"
```

### Relationship Types

| Notation | Meaning | Left Side | Right Side |
|----------|---------|-----------|------------|
| `\|\|--\|\|` | One to one | Exactly one | Exactly one |
| `\|\|--o{` | One to many | Exactly one | Zero or more |
| `\|\|--\|{` | One to many (required) | Exactly one | One or more |
| `o\|--o{` | Zero-or-one to many | Zero or one | Zero or more |
| `}o--o{` | Many to many | Zero or more | Zero or more |

### Field Markers

- `PK` -- primary key
- `FK` -- foreign key
- `UK` -- unique key

## Class Diagram

Use for modeling object-oriented designs, interface hierarchies, and module APIs.

### Pattern

```mermaid
classDiagram
    %% Payment Processing Domain Model

    class PaymentProcessor {
        <<interface>>
        +processPayment(amount: Money, method: PaymentMethod) PaymentResult
        +refund(transactionId: string, amount: Money) RefundResult
        +getStatus(transactionId: string) TransactionStatus
    }

    class StripeProcessor {
        -apiKey: string
        -httpClient: HttpClient
        +processPayment(amount: Money, method: PaymentMethod) PaymentResult
        +refund(transactionId: string, amount: Money) RefundResult
        +getStatus(transactionId: string) TransactionStatus
        -buildRequest(endpoint: string, payload: object) Request
    }

    class PayPalProcessor {
        -clientId: string
        -clientSecret: string
        +processPayment(amount: Money, method: PaymentMethod) PaymentResult
        +refund(transactionId: string, amount: Money) RefundResult
        +getStatus(transactionId: string) TransactionStatus
        -authenticate() AuthToken
    }

    class Money {
        +amount: decimal
        +currency: string
        +add(other: Money) Money
        +subtract(other: Money) Money
        +isPositive() bool
    }

    class PaymentResult {
        +transactionId: string
        +status: TransactionStatus
        +timestamp: DateTime
        +isSuccessful() bool
    }

    class TransactionStatus {
        <<enumeration>>
        PENDING
        COMPLETED
        FAILED
        REFUNDED
    }

    PaymentProcessor <|.. StripeProcessor : implements
    PaymentProcessor <|.. PayPalProcessor : implements
    StripeProcessor --> Money : uses
    PayPalProcessor --> Money : uses
    PaymentProcessor --> PaymentResult : returns
    PaymentResult --> TransactionStatus : has
```

### Visibility Modifiers

| Symbol | Meaning |
|--------|---------|
| `+` | Public |
| `-` | Private |
| `#` | Protected |
| `~` | Package / Internal |

### Relationship Arrows

| Arrow | Syntax | Meaning |
|-------|--------|---------|
| Inheritance | `<\|--` | "extends" (solid line, hollow triangle) |
| Implementation | `<\|..` | "implements" (dotted line, hollow triangle) |
| Association | `-->` | "uses" (solid line, arrow) |
| Dependency | `..>` | "depends on" (dotted line, arrow) |
| Aggregation | `o--` | "has" (solid line, hollow diamond) |
| Composition | `*--` | "owns" (solid line, filled diamond) |

### Annotations

Use `<<annotation>>` inside the class body for stereotypes:
- `<<interface>>` -- interface definition
- `<<abstract>>` -- abstract class
- `<<enumeration>>` -- enum type
- `<<service>>` -- service class
- `<<record>>` -- data transfer object or value type

## State Machine Diagram

Use for modeling state transitions in order lifecycles, UI states, workflow engines, or finite state machines.

### Pattern

```mermaid
stateDiagram-v2
    %% Order Lifecycle State Machine

    [*] --> Draft : Customer starts order

    state "Order Validation" as Validating {
        [*] --> CheckInventory
        CheckInventory --> CheckPayment : Stock available
        CheckInventory --> Failed : Out of stock
        CheckPayment --> [*] : Payment valid
        CheckPayment --> Failed : Payment declined
    }

    Draft --> Validating : Submit order
    Validating --> Confirmed : Validation passed
    Validating --> Cancelled : Validation failed

    Confirmed --> Processing : Begin fulfillment
    Processing --> Shipped : Handed to carrier
    Shipped --> Delivered : Delivery confirmed

    Confirmed --> Cancelled : Customer cancels
    Processing --> Cancelled : Admin cancels

    Delivered --> Returned : Return requested
    Returned --> Refunded : Return approved

    Cancelled --> [*]
    Delivered --> [*]
    Refunded --> [*]

    note right of Confirmed
        Order is locked.
        Inventory is reserved.
    end note

    note right of Shipped
        Tracking number assigned.
        Customer notified via email.
    end note
```

### Key Syntax

| Element | Syntax | Purpose |
|---------|--------|---------|
| Initial state | `[*]` | Entry point into the state machine |
| Final state | `[*]` (as target) | Terminal state |
| Transition | `State1 --> State2 : event` | State change with trigger label |
| Composite state | `state "Label" as Alias { ... }` | Nested states within a parent |
| Note | `note right of State ... end note` | Contextual annotation |
| Fork | `state fork_point <<fork>>` | Parallel split |
| Join | `state join_point <<join>>` | Parallel merge |
| Choice | `state choice_point <<choice>>` | Decision point |

## Styling Reference

### Individual Node Styling

Apply styles to specific nodes using the `style` directive:

```mermaid
graph LR
    A[Healthy] --> B[Degraded] --> C[Down]
    style A fill:#2ECC71,stroke:#1A9B52,color:#FFFFFF
    style B fill:#F39C12,stroke:#D4850A,color:#000000
    style C fill:#E74C3C,stroke:#C0392B,color:#FFFFFF
```

### Reusable Class Definitions

Define styles once and apply to multiple nodes with `classDef` and `:::`:

```mermaid
graph TB
    classDef healthy fill:#2ECC71,stroke:#1A9B52,color:#FFFFFF
    classDef warning fill:#F39C12,stroke:#D4850A,color:#000000
    classDef critical fill:#E74C3C,stroke:#C0392B,color:#FFFFFF

    ServiceA[Auth Service]:::healthy
    ServiceB[Order Service]:::warning
    ServiceC[Payment Service]:::critical
```

### Default Class

Apply a default style to all nodes that do not have an explicit class:

```
classDef default fill:#F5F5F5,stroke:#333333,color:#333333
```

### Link Styling

Style specific links by their index (0-based, in order of declaration):

```
linkStyle 0 stroke:#E74C3C,stroke-width:2px
linkStyle 1 stroke:#2ECC71,stroke-width:2px
```

## Tips and Best Practices

### Layout Control

- Add invisible nodes or longer arrow syntax (`---->`) to influence spacing when Mermaid's auto-layout produces crowded results
- Place the most connected node near the top (in TB) or left (in LR) to reduce crossing lines
- Use subgraphs not just for grouping but also to control the relative placement of clusters

### Label Formatting

- Keep node labels to 2-4 words; move details to notes or annotations
- Use line breaks in labels with `<br/>` for multi-line text when needed: `A["Line One<br/>Line Two"]`
- Quote labels containing special characters: `A["Service (v2.1)"]`

### Diagram Sizing

- Limit flowcharts to 15-20 nodes; split larger systems across multiple diagrams with a high-level overview linking to detail views
- Sequence diagrams become hard to read beyond 6-8 participants; group related participants or split into sub-flows
- ER diagrams beyond 10-12 entities should be split by domain boundary

### Escaping and Special Characters

- Wrap labels in quotes when they contain parentheses, brackets, or other Mermaid syntax characters
- Use HTML entities for characters that conflict with Mermaid parsing: `&amp;`, `&lt;`, `&gt;`
- Avoid semicolons in labels; they can terminate Mermaid statements

### Version Compatibility

- Prefer `flowchart` over `graph` for newer Mermaid features (subgraph linking, markdown in labels)
- Use `stateDiagram-v2` instead of `stateDiagram` for composite states and notes
- Test diagrams in the target rendering environment (GitHub, GitLab, Docusaurus, etc.) since feature support varies across platforms
