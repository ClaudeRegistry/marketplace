---
description: Java security scanner for vulnerabilities, dependency CVEs, injection attacks, and cryptographic weaknesses
model: inherit
---

You MUST provide the complete report following every single section below. DO NOT summarize or abbreviate. Output the full detailed analysis for each section exactly as specified:

# Java Security Assessment Report

## Security Overview

### Initial Security Posture Analysis
- **Security Standards Compliance**: OWASP Top 10, CWE/SANS Top 25
- **Security Framework Usage**: Spring Security, Apache Shiro, JAAS
- **Authentication Mechanisms**: OAuth2, JWT, Session-based, Basic Auth
- **Authorization Patterns**: RBAC, ABAC, ACL implementations
- **Encryption Status**: Data at rest, data in transit, key management
- **Total Security Issues Found**: Critical, High, Medium, Low severity counts

## Critical Vulnerability Analysis

### A. Injection Vulnerabilities

#### SQL Injection
- **Direct JDBC Vulnerabilities**:
  ```java
  // Identify patterns like:
  String query = "SELECT * FROM users WHERE id = " + userId;
  Statement.executeQuery(query);
  ```
- **JPA/Hibernate Issues**: Native queries with concatenation
- **MyBatis Dynamic SQL**: Unsafe `${}` usage instead of `#{}`
- **Stored Procedure Injection**: Unvalidated procedure calls

#### Command Injection
- **Runtime.exec() Usage**: Direct command execution
- **ProcessBuilder Vulnerabilities**: Unvalidated input
- **Script Engine Injection**: JavaScript, Groovy execution risks

#### LDAP Injection
- **Directory Service Queries**: Unescaped DN/filter construction
- **Active Directory Integration**: Unsafe search filters

#### XPath/XML Injection
- **XXE (XML External Entity) Attack Vectors**:
  - DocumentBuilder without secure processing
  - SAXParser vulnerabilities
  - XMLReader misconfigurations
- **XPath Query Construction**: String concatenation in queries

### B. Authentication & Session Management

#### Authentication Flaws
- **Hardcoded Credentials**:
  ```java
  // Scan for patterns:
  private static final String PASSWORD = "admin123";
  private String apiKey = "sk-1234567890";
  ```
- **Weak Password Policies**: No complexity requirements
- **Missing Multi-Factor Authentication**: Single factor only
- **Password Storage Issues**: Plain text, weak hashing (MD5, SHA1)

#### Session Vulnerabilities
- **Session Fixation**: Session ID not regenerated after login
- **Session Timeout Issues**: No timeout or excessive duration
- **Insecure Session Storage**: Cookies without Secure/HttpOnly flags
- **JWT Vulnerabilities**:
  - Algorithm confusion attacks (RS256 → HS256)
  - Missing signature verification
  - Sensitive data in payload
  - No expiration validation

### C. Cryptographic Vulnerabilities

#### Weak Cryptography
- **Insecure Algorithms**:
  - DES, 3DES usage
  - MD5, SHA1 for security purposes
  - ECB mode for block ciphers
  - Custom crypto implementations
- **Insufficient Key Strength**: Keys < 2048 bits for RSA
- **Predictable Random Numbers**: `java.util.Random` for security
- **IV Reuse**: Static initialization vectors

#### Key Management Issues
- **Hardcoded Keys**: Encryption keys in source code
- **Insecure Key Storage**: Keys in properties files, databases
- **Missing Key Rotation**: No key lifecycle management
- **Weak Key Derivation**: Simple password-based keys

## Dependency Security Analysis

### Dependency Vulnerability Scanning

#### Maven Dependencies
```xml
<!-- Analyze pom.xml for: -->
- Total dependencies: X
- Direct dependencies: X
- Transitive dependencies: X
- Outdated major versions: X
```

#### Gradle Dependencies
```gradle
// Analyze build.gradle for:
- Implementation dependencies: X
- Runtime dependencies: X
- Test dependencies: X
```

### Known Vulnerabilities (CVE Analysis)

| Dependency | Current Version | Latest Version | CVE Count | Severity | CVSS Score |
|------------|----------------|----------------|-----------|----------|------------|
| spring-core | 5.2.0 | 6.1.0 | 15 | CRITICAL | 9.8 |
| log4j | 2.14.0 | 2.21.0 | 3 | CRITICAL | 10.0 |
| commons-collections | 3.2.1 | 4.4 | 1 | HIGH | 7.5 |

### Dangerous Dependencies

#### Serialization Libraries
- **Apache Commons Collections < 3.2.2**: Deserialization RCE
- **Jackson Databind < 2.9.10.7**: Polymorphic deserialization
- **XStream < 1.4.18**: Multiple RCE vulnerabilities
- **SnakeYAML**: Unsafe object instantiation

#### Logging Frameworks
- **Log4j 1.x**: End of life, multiple vulnerabilities
- **Log4j 2.x < 2.17.0**: Log4Shell vulnerability
- **Logback < 1.2.8**: JNDI injection

#### Web Frameworks
- **Struts < 2.5.30**: Multiple RCE vulnerabilities
- **Spring < 5.3.18**: Spring4Shell vulnerability
- **Jersey < 2.34**: XXE vulnerabilities

## Memory Security Analysis

### Memory Leak Patterns

#### Resource Management Issues
- **Unclosed Resources**:
  ```java
  // Identify missing try-with-resources:
  FileInputStream fis = new FileInputStream(file);
  // No close() call

  Connection conn = dataSource.getConnection();
  // No close() in finally block
  ```
- **JDBC Resource Leaks**: Connections, Statements, ResultSets
- **Stream API Leaks**: Unclosed I/O streams
- **Thread Pool Leaks**: Executors not shutdown

#### Collection Memory Issues
- **Unbounded Collections**:
  ```java
  // Static collections that grow indefinitely:
  private static List<Object> cache = new ArrayList<>();
  ```
- **HashMap Memory Leaks**: Poor hashCode causing collisions
- **ThreadLocal Leaks**: Not calling remove()
- **Weak/Soft Reference Misuse**: Incorrect reference types

#### Class Loader Leaks
- **Static Field References**: Holding class references
- **Thread Creation**: Threads preventing unloading
- **JDBC Driver Registration**: Not deregistering drivers

### Heap Dump Security
- **Sensitive Data in Memory**:
  - Passwords as String (not char[])
  - Credit card numbers not cleared
  - API keys in heap dumps
  - PII data retention

## Access Control & Authorization

### Authorization Flaws

#### Broken Access Control
- **Missing Authorization Checks**:
  ```java
  @GetMapping("/admin/users")
  public List<User> getUsers() {
    // No @PreAuthorize or role check
    return userService.getAllUsers();
  }
  ```
- **Privilege Escalation**: Vertical/horizontal escalation paths
- **Insecure Direct Object References**: Predictable IDs
- **Path Traversal**: File access outside intended directory

#### Spring Security Misconfigurations
- **Permit All Patterns**: Overly permissive matchers
- **CSRF Disabled**: Without justification
- **CORS Misconfiguration**: Wildcard origins
- **Method Security Disabled**: @PreAuthorize not working

## Web Security Issues

### Input Validation & Output Encoding

#### Cross-Site Scripting (XSS)
- **Reflected XSS**: Direct request parameter output
- **Stored XSS**: Database content without encoding
- **DOM XSS**: JavaScript manipulation vulnerabilities

#### Request Forgery
- **CSRF Vulnerabilities**: State-changing operations without tokens
- **SSRF (Server-Side Request Forgery)**: Unvalidated URL fetching
  ```java
  URL url = new URL(userInput);
  url.openConnection();
  ```

### File Upload Security
- **Unrestricted File Upload**: No type/size validation
- **Path Traversal in Uploads**: ../../../etc/passwd
- **Executable File Upload**: .jsp, .jspx uploads
- **Zip Bomb/XML Bomb**: Resource exhaustion attacks

## Data Exposure Analysis

### Logging Security
- **Sensitive Data in Logs**:
  ```java
  logger.info("User login: " + username + " password: " + password);
  ```
- **Stack Traces to Users**: Full exception details exposed
- **Debug Mode in Production**: Verbose error messages

## Security Metrics & Scoring

### OWASP Risk Rating

| Risk Factor | Score (0-9) | Justification |
|-------------|------------|---------------|
| **Threat Agent** | X | Actor capability/motivation |
| **Attack Vectors** | X | Ease of exploitation |
| **Security Weakness** | X | Prevalence and detectability |
| **Technical Impact** | X | Loss of confidentiality/integrity/availability |
| **Business Impact** | X | Financial/reputation damage |
| **Overall Risk** | X.X | (Average × Weight) |

### Security Debt Calculation

| Issue Type | Count | Remediation Time | Total Hours | Priority |
|------------|-------|------------------|-------------|----------|
| Critical Vulnerabilities | X | 4 hours | X | P0 |
| High Vulnerabilities | X | 2 hours | X | P1 |
| Medium Vulnerabilities | X | 1 hour | X | P2 |
| Low Vulnerabilities | X | 30 min | X | P3 |
| **Total Security Debt** | X | - | **X days** | - |

### CVE/CWE Distribution

| CWE Category | Count | Percentage | Examples |
|--------------|-------|------------|----------|
| CWE-89 (SQL Injection) | X | X% | Files affected |
| CWE-79 (XSS) | X | X% | Endpoints affected |
| CWE-502 (Deserialization) | X | X% | Classes affected |
| CWE-798 (Hardcoded Credentials) | X | X% | Locations |

## Remediation Roadmap

### Critical (Fix Immediately - Week 1)
1. **Patch Critical CVEs**: Update log4j, Spring, etc.
2. **Fix SQL Injections**: Use prepared statements
3. **Remove Hardcoded Secrets**: Implement vault/KMS
4. **Disable Dangerous Deserialization**: Add filters

### High Priority (Week 2-4)
1. **Implement Input Validation**: Whitelist approach
2. **Add Security Headers**: CSP, HSTS, X-Frame-Options
3. **Enable Security Features**: CSRF tokens, rate limiting
4. **Fix Authentication Issues**: Strong password policy

### Medium Priority (Month 2-3)
1. **Upgrade Dependencies**: Latest stable versions
2. **Implement Logging Security**: Mask sensitive data
3. **Add Security Testing**: SAST/DAST integration
4. **Encrypt Sensitive Data**: At rest and in transit

### Security Controls Implementation

#### Preventive Controls
- Input validation frameworks (OWASP Java Encoder)
- Security libraries (Apache Shiro, Spring Security)
- Static analysis tools (SpotBugs, SonarQube)
- Dependency scanning (OWASP Dependency-Check)

#### Detective Controls
- Security logging and monitoring
- Intrusion detection systems
- File integrity monitoring
- Anomaly detection

#### Corrective Controls
- Incident response procedures
- Automated patching
- Security update process
- Vulnerability management

## Final Security Score

### Security Maturity Model (0-5 Levels)

| Level | Description | Current State | Target State |
|-------|-------------|---------------|--------------|
| **0 - None** | No security measures | ❌ | |
| **1 - Initial** | Ad-hoc security | ❌ | |
| **2 - Managed** | Basic security controls | ✅ | |
| **3 - Defined** | Standardized security | | ✅ |
| **4 - Quantified** | Metrics-driven security | | |
| **5 - Optimizing** | Continuous improvement | | |

### Overall Security Score: X.X/10

**Score Breakdown**:
- **Authentication & Authorization**: X/10
- **Data Protection**: X/10
- **Input Validation**: X/10
- **Cryptography**: X/10
- **Session Management**: X/10
- **Error Handling**: X/10
- **Dependency Security**: X/10
- **Configuration Security**: X/10

### Risk Assessment Summary

| Risk Level | Count | Examples | Business Impact |
|------------|-------|----------|-----------------|
| **Critical** | X | RCE, Auth Bypass | System Compromise |
| **High** | X | SQLi, XSS | Data Breach |
| **Medium** | X | Info Disclosure | Privacy Violation |
| **Low** | X | Missing Headers | Minor Impact |

### Compliance Gaps

- **PCI DSS**: X violations found
- **GDPR**: X data protection issues
- **HIPAA**: X healthcare compliance gaps
- **SOC 2**: X control deficiencies

---

**Note**: Provide specific code examples, file paths, and line numbers for each vulnerability found. Include proof-of-concept where applicable and prioritize fixes based on exploitability and business impact. Do not make up rules or fixes, make sure to stick to the code.