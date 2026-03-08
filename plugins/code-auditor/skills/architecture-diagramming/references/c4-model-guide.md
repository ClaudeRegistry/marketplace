# C4 Model — Codebase Discovery Guide

What to look for at each C4 level when analyzing a codebase. Focus on discovery heuristics — where to find architectural evidence in code.

## Level 1 (System Context): What to Discover

- External API client configurations
- OAuth/SSO provider integrations
- Third-party SDK imports
- External database connection strings
- Webhook configurations
- Email/SMS/notification service integrations

## Level 2 (Container): What to Discover

- docker-compose.yml / Dockerfile definitions
- Kubernetes manifests (deployments, services)
- Separate package.json / pom.xml / requirements.txt per service
- Database configuration files
- Queue/broker configuration
- Service discovery configuration
- API gateway/proxy configuration

### Container Identification Heuristics

| File/Pattern | Container Type |
|-------------|---------------|
| Dockerfile | Deployable service |
| docker-compose service | Container |
| K8s Deployment manifest | Container |
| package.json with "start" script | Application |
| Database migration files | Database |
| Queue consumer/producer configs | Message queue |

## Level 3 (Component): What to Discover

- Directory structure (controllers/, services/, repositories/, models/)
- Dependency injection configuration
- Import/require graphs between modules
- Interface/abstract class definitions
- Router/handler registrations
- Middleware chain configuration

### Common Architectural Layers

| Layer | Responsibility | Typical Directory |
|-------|---------------|-------------------|
| Presentation | Request handling, validation | controllers/, handlers/, routes/ |
| Application | Use cases, orchestration | services/, usecases/ |
| Domain | Business logic, rules | domain/, models/, entities/ |
| Infrastructure | Data access, external services | repositories/, adapters/, clients/ |
