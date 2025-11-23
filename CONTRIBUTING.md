# Contributing Guidelines

Thank you for your interest in contributing to Zabbix Notifi!

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- A clear title
- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, Node version, etc.)

### Suggesting Features

Feature requests are welcome! Please:
- Check if the feature has already been requested
- Provide a clear description
- Explain the use case
- Consider the impact on existing features

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/ReactNative_Notifi.git
cd ReactNative_Notifi

# Setup API Server
cd api-server
npm install
cp .env.example .env
npm run init-db
npm run dev

# Setup Mobile App
cd ../mobile-app
npm install
npx expo start
```

### Code Style

- Use meaningful variable names
- Add comments for complex logic
- Follow existing code patterns
- Keep functions small and focused
- Write descriptive commit messages

### Testing

- Test all changes locally
- Ensure API endpoints work correctly
- Test mobile app on real devices
- Check for security vulnerabilities

## Questions?

Feel free to create an issue for any questions or clarifications.

Thank you for contributing! 🎉
