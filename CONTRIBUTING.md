# Contributing to Cylestio UI

First off, thank you for considering contributing to Cylestio UI! It's people like you that make Cylestio UI such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps which reproduce the problem
- Provide specific examples to demonstrate the steps
- Describe the behavior you observed after following the steps
- Explain which behavior you expected to see instead and why
- Include screenshots and animated GIFs if possible

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- Use a clear and descriptive title
- Provide a step-by-step description of the suggested enhancement
- Provide specific examples to demonstrate the steps
- Describe the current behavior and explain which behavior you expected to see instead
- Explain why this enhancement would be useful

### Pull Requests

- Fill in the required template
- Do not include issue numbers in the PR title
- Follow the TypeScript styleguide
- Include screenshots and animated GIFs in your pull request whenever possible
- Document new code
- End all files with a newline

## Development Process

1. Fork the repo
2. Create a new branch from `main`:
   ```bash
   git checkout -b feature/my-feature
   # or
   git checkout -b fix/my-bugfix
   ```
3. Make your changes
4. Run the tests:
   ```bash
   npm test
   npm run test:e2e
   ```
5. Make sure your code lints:
   ```bash
   npm run lint
   ```
6. Commit your changes using a descriptive commit message that follows our commit message conventions
7. Push your branch
8. Create a PR

## Styleguides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- Consider starting the commit message with an applicable emoji:
  - 🎨 `:art:` when improving the format/structure of the code
  - 🐎 `:racehorse:` when improving performance
  - 🚱 `:non-potable_water:` when plugging memory leaks
  - 📝 `:memo:` when writing docs
  - 🐛 `:bug:` when fixing a bug
  - 🔥 `:fire:` when removing code or files
  - 💚 `:green_heart:` when fixing the CI build
  - ✅ `:white_check_mark:` when adding tests
  - 🔒 `:lock:` when dealing with security
  - ⬆️ `:arrow_up:` when upgrading dependencies
  - ⬇️ `:arrow_down:` when downgrading dependencies

### TypeScript Styleguide

- Use TypeScript strict mode
- Use interface over type when possible
- Use meaningful variable names
- Document complex code sections
- Follow the [Angular TypeScript styleguide](https://angular.io/guide/styleguide)

### Testing Styleguide

- Treat `describe` as a noun or situation
- Treat `it` as a statement about state or how an operation changes state
- Use meaningful test descriptions
- Keep tests focused and atomic

## Project Structure

```
cylestio-ui/
├── app/                    # Next.js app directory
│   ├── components/        # Reusable components
│   ├── lib/              # Utility functions and helpers
│   └── pages/            # Page components
├── public/                # Static files
├── styles/                # Global styles
├── tests/                 # Test files
│   ├── unit/
│   └── e2e/
└── types/                 # TypeScript type definitions
```

## Setting Up Development Environment

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Running Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

## Additional Notes

### Issue and Pull Request Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `question` - Further information is requested

## Recognition

Contributors who have made significant contributions will be recognized in our README.md.

## Questions?

Feel free to contact the core team if you have any questions or concerns:

- Join our [Discord community](https://discord.gg/cylestio)
- Email us at contributors@cylestio.com

Thank you for contributing! 🎉
