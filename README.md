# Cylestio UI Dashboard

[![CI/CD](https://github.com/cylestio/cylestio-ui/actions/workflows/main.yml/badge.svg)](https://github.com/cylestio/cylestio-ui/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Security: OWASP](https://img.shields.io/badge/Security-OWASP-green.svg)](https://owasp.org/)
[![Compliance: GDPR](https://img.shields.io/badge/Compliance-GDPR-blue.svg)](https://gdpr.eu/)

A modern, secure dashboard for monitoring AI agent activities and security metrics. This project serves as the user interface for the [Cylestio Monitor](https://github.com/cylestio/cylestio-monitor) tool.

## 🚀 Features

- Real-time monitoring of AI agent activities
- Security metrics and vulnerability tracking
- Interactive data visualization
- Responsive and modern UI built with Next.js and Tremor
- Dark/Light mode support
- Enterprise-grade security measures

## 📋 Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git

## 🛠️ Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/cylestio/cylestio-ui.git
   cd cylestio-ui
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration.

4. Run the development server:
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see the application.

## 🧪 Testing

Run the test suite:

```bash
npm test                 # Run unit tests
npm run test:coverage    # Run tests with coverage report
npm run test:e2e        # Run end-to-end tests
```

## 🔒 Security & Compliance

We take security seriously and follow industry best practices to protect your data and ensure compliance with major regulations.

### Security Measures

1. **Automated Security Checks**:

   - OWASP Dependency Check for known vulnerabilities
   - Trivy vulnerability scanner for container security
   - NodeJSScan for Node.js-specific security issues
   - npm audit for package vulnerabilities
   - ESLint security plugin for static code analysis

2. **Code Security**:

   - Strict TypeScript compilation
   - Security-focused ESLint rules
   - Regular dependency updates
   - Input validation and sanitization
   - XSS prevention
   - CSRF protection
   - Content Security Policy (CSP)
   - HTTP Security Headers

3. **Authentication & Authorization**:

   - Strong password policies
   - Multi-factor authentication support
   - Role-based access control (RBAC)
   - Session management
   - JWT token security
   - Secure cookie handling

4. **Data Protection**:
   - Data encryption at rest and in transit
   - Secure database connections
   - PII data handling compliance
   - Data minimization practices
   - Regular security audits
   - Backup and recovery procedures

### Compliance

Our security practices are designed to meet the following standards:

1. **SOC 2**:

   - Security monitoring and logging
   - Access control policies
   - Change management procedures
   - Incident response plan
   - Regular security assessments

2. **GDPR**:

   - Data privacy by design
   - User consent management
   - Data subject rights support
   - Data processing agreements
   - Privacy policy compliance
   - Data breach notification procedures

3. **HIPAA** (for healthcare deployments):

   - PHI data protection
   - Access logging and monitoring
   - Encryption requirements
   - Business Associate Agreements
   - Security risk assessments

4. **OWASP Top 10**:
   - Protection against injection attacks
   - Broken authentication prevention
   - Sensitive data exposure prevention
   - XML external entities (XXE) protection
   - Broken access control prevention
   - Security misconfiguration prevention
   - Cross-site scripting (XSS) protection
   - Insecure deserialization prevention
   - Using components with known vulnerabilities prevention
   - Insufficient logging & monitoring prevention

### Security Tools & Practices

- Continuous security testing in CI/CD pipeline
- Regular penetration testing
- Vulnerability disclosure program
- Security incident response plan
- Regular security training for developers
- Code review security checklist
- Dependency update policy
- Security documentation

For more details, see our [Security Policy](SECURITY.md) and [Contributing Guide](CONTRIBUTING.md).

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏗️ Architecture

The dashboard is built using:

- Next.js 14 with App Router
- TypeScript for type safety
- Tremor for UI components
- SQLite for local data storage
- TailwindCSS for styling

## 📚 Documentation

Detailed documentation is available in the [docs](docs/) directory.

## ⚡ Performance

- Optimized bundle size
- Server-side rendering where applicable
- Efficient data fetching strategies
- Caching mechanisms

## 🌟 Support

- 📫 For questions and support, open an issue or join our [Discord community](https://discord.gg/cylestio)
- 🐛 Bug reports: Please use the GitHub issue tracker
- 💡 Feature requests: We welcome your ideas through GitHub issues

## 🙏 Acknowledgments

- [Cylestio Monitor](https://github.com/cylestio/cylestio-monitor) team
- All our contributors and supporters

---

Built with ❤️ by the Cylestio team
