# Contributing

## Setup

1. Fork and clone the repository
2. Copy `.env.example` to `.env`
3. Start infrastructure: `docker-compose up elasticsearch redis -d`
4. Run services individually for development

## Code Standards

- **TypeScript**: Strict mode enabled
- **Python**: Type hints required
- **Formatting**: Prettier (TS/JS), Black (Python)
- **Linting**: ESLint (TS/JS), Ruff (Python)
- **Commits**: Conventional Commits format

## Branch Strategy

- `main` — Production-ready code
- `develop` — Integration branch
- `feature/*` — Feature branches
- `fix/*` — Bug fixes

## Testing

```bash
# Run all tests
cd backend && npm test
cd ai-agent && pytest tests/ -v
cd frontend && npm test
```

## Pull Request Checklist

- [ ] Tests pass
- [ ] Code follows project patterns
- [ ] Documentation updated
- [ ] No console.log / print statements
