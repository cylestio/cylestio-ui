# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Cylestio UI seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Where to Report

Please **DO NOT** report security vulnerabilities through public GitHub issues.

Instead, please report them via email to:

- security@cylestio.com

You can also use our [Security Advisory](https://github.com/cylestio/cylestio-ui/security/advisories/new) feature on GitHub.

### What to Include

To help us better understand and resolve the issue, please provide:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Process

1. You will receive an acknowledgment within 48 hours
2. Our security team will triage the issue and determine its severity
3. We will keep you informed of the progress towards a fix
4. Once the issue is resolved, we will post a security advisory to our GitHub repository

### Disclosure Policy

- Security issues will be disclosed via GitHub Security Advisories
- CVE IDs will be requested when appropriate
- Security patches will be released as soon as possible

## Security Measures

### Code Security

- All code changes undergo security review
- Regular security audits
- Automated vulnerability scanning
- Static Application Security Testing (SAST)
- Software Composition Analysis (SCA)

### Infrastructure Security

- Regular security patches and updates
- Access control and authentication
- Secure configuration management
- Monitoring and logging
- Incident response plan

### Compliance

We maintain compliance with:

- SOC 2
- ISO 27001
- GDPR (where applicable)
- OWASP Security Standards

## Security Best Practices

### For Contributors

1. Never commit sensitive information (tokens, passwords, keys)
2. Keep dependencies updated
3. Follow secure coding guidelines
4. Use strong authentication
5. Implement proper error handling
6. Follow the principle of least privilege

### For Users

1. Keep your environment updated
2. Use secure configurations
3. Implement proper access controls
4. Monitor for suspicious activity
5. Follow security advisories

## Contact

For any questions about this security policy, please contact:

- security@cylestio.com

---

Last updated: March 2024
