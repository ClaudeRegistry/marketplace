# Compliance Framework Gap Analysis

## PCI DSS (Payment Card Industry)

### Key Requirements to Check

| Requirement | What to Verify | Detection |
|-------------|---------------|-----------|
| 3.4 | Render PAN unreadable wherever stored | Grep for card number patterns in storage/logs |
| 4.1 | Encrypt transmission of cardholder data | Check for HTTPS/TLS enforcement |
| 6.5 | Address common coding vulnerabilities | OWASP Top 10 coverage |
| 6.6 | Web application firewall or code review | WAF config or review process |
| 8.2 | Strong authentication for system access | Password policy, MFA presence |
| 10.1 | Audit trails for all system components | Logging of access to cardholder data |

### Common Violations
- Credit card numbers in logs or debug output
- PAN stored without encryption or tokenization
- Missing TLS on payment endpoints
- No input validation on payment forms

## GDPR (General Data Protection Regulation)

### Key Requirements to Check

| Article | Requirement | What to Verify |
|---------|------------|---------------|
| 5(1)(f) | Integrity and confidentiality | Encryption, access controls |
| 25 | Data protection by design | Privacy-first architecture, minimization |
| 30 | Records of processing | Data flow documentation |
| 32 | Security of processing | Encryption, pseudonymization, resilience |
| 33 | Breach notification | Incident response, logging |
| 17 | Right to erasure | Data deletion capability |

### Common Violations
- PII stored without encryption
- No data deletion/anonymization capability
- Missing consent tracking
- PII in logs without masking
- Cross-border data transfer without safeguards

## HIPAA (Health Insurance Portability)

### Key Requirements to Check

| Rule | Requirement | What to Verify |
|------|------------|---------------|
| 164.312(a)(1) | Access control | Unique user IDs, emergency access, auto-logoff |
| 164.312(a)(2)(iv) | Encryption and decryption | PHI encrypted at rest |
| 164.312(c)(1) | Integrity | Mechanism to authenticate ePHI |
| 164.312(d) | Authentication | Entity authentication |
| 164.312(e)(1) | Transmission security | PHI encrypted in transit |
| 164.308(a)(5) | Security awareness | Audit logs, login monitoring |

### Common Violations
- PHI accessible without authentication
- PHI transmitted without TLS
- Missing audit logs for PHI access
- PHI in application logs
- No automatic session timeout

## SOC 2 (Service Organization Controls)

### Trust Service Criteria to Check

| Category | Key Controls | What to Verify |
|----------|-------------|---------------|
| Security | CC6.1-CC6.8 | Access controls, encryption, network security |
| Availability | CC7.1-CC7.4 | Monitoring, incident response, recovery |
| Processing Integrity | CC8.1 | Input validation, error handling |
| Confidentiality | CC9.1-CC9.2 | Data classification, encryption |
| Privacy | P1-P8 | Notice, consent, collection, use |

### Common Deficiencies
- Missing access logging and monitoring
- No incident response procedures in code
- Missing input validation at system boundaries
- No data classification markers
- Missing retention/disposal mechanisms

## Compliance Gap Report Template

| Framework | Requirement | Status | Gap Description | Remediation |
|-----------|------------|--------|-----------------|-------------|
| PCI DSS | 3.4 | FAIL | Card numbers found in logs | Mask PAN in logging |
| GDPR | Art. 17 | PARTIAL | No bulk deletion API | Implement data erasure endpoint |
| HIPAA | 164.312(e) | PASS | TLS enforced on all endpoints | — |
| SOC 2 | CC6.1 | FAIL | No access logging | Add audit trail middleware |
