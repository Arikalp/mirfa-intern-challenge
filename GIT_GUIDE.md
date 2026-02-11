# Git Workflow Guide

## Initial Setup

If this is your first time setting up the repository:

```bash
# Initialize git (if not already done)
git init

# Configure git (if needed)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Add all files
git add .

# Create initial commit
git commit -m "feat: initial implementation of Secure Transactions Mini-App

- Implement AES-256-GCM envelope encryption in @repo/crypto
- Create Fastify backend with encrypt/fetch/decrypt routes
- Build Next.js frontend with transaction UI
- Configure TurboRepo monorepo with pnpm workspaces
- Add comprehensive documentation (SETUP, RUN, DEPLOYMENT)
- Setup environment configuration files"
```

## Recommended Commit Message Format

Use conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples:

```bash
# Add a new feature
git commit -m "feat(crypto): add key rotation support"

# Fix a bug
git commit -m "fix(api): handle missing transaction IDs correctly"

# Update documentation
git commit -m "docs: add API usage examples to README"

# Refactor code
git commit -m "refactor(crypto): extract validation into separate function"
```

## Connect to GitHub

```bash
# Create a new repository on GitHub first, then:
git remote add origin https://github.com/yourusername/mirfa-intern-challenge.git
git branch -M main
git push -u origin main
```

## Daily Workflow

```bash
# Check status
git status

# Add files
git add .

# Commit with message
git commit -m "feat: your feature description"

# Push to remote
git push
```

## Create Feature Branch

```bash
# Create and switch to new branch
git checkout -b feature/your-feature-name

# Work on your feature...
git add .
git commit -m "feat: implement your feature"

# Push branch to remote
git push -u origin feature/your-feature-name

# Create pull request on GitHub
```

## Useful Commands

```bash
# View commit history
git log --oneline --graph

# View changes
git diff

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes
git reset --hard HEAD

# View remote URL
git remote -v

# Pull latest changes
git pull origin main
```

## What Gets Ignored

The `.gitignore` file prevents these from being committed:
- ✅ `node_modules/` - Dependencies
- ✅ `dist/` - Build outputs
- ✅ `.next/` - Next.js build
- ✅ `.env*` - Environment files (secrets!)
- ✅ `.turbo/` - TurboRepo cache
- ✅ `*.log` - Log files

## Before Committing

Always verify:
1. ✅ No `.env` files (only `.env.example`)
2. ✅ No `node_modules/`
3. ✅ No build outputs (`dist/`, `.next/`)
4. ✅ Code builds successfully: `pnpm build`
5. ✅ No sensitive data (API keys, secrets)

## First Commit Checklist

- [ ] `.gitignore` configured
- [ ] Environment examples included (`.env.example`)
- [ ] No real secrets in repository
- [ ] README.md is complete
- [ ] All documentation files included
- [ ] Code builds successfully
- [ ] Dependencies properly listed in `package.json`

---

**Ready to commit? Run:** `git add . && git commit -m "your message" && git push`
