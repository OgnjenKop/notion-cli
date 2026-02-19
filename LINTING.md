# Notion CLI - Linting & Code Quality

## Tools Configured

### ESLint
- **Parser**: `@typescript-eslint/parser`
- **Plugins**: `@typescript-eslint`, `prettier`
- **Config**: Flat config format (`eslint.config.js`)

### Prettier
- **Config**: `.prettierrc`
- **Integration**: ESLint runs Prettier as a rule

### TypeScript
- **Strict Mode**: Enabled
- **Additional Checks**: 
  - `noImplicitReturns`
  - `noFallthroughCasesInSwitch`
  - `noUncheckedIndexedAccess`
  - `noImplicitOverride`
  - `exactOptionalPropertyTypes`

## NPM Scripts

```bash
# Linting
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues automatically

# Formatting
npm run format        # Format code with Prettier
npm run format:check  # Check if code is formatted correctly

# Type Checking
npm run typecheck     # Type check without emitting files
npm run build         # Compile TypeScript
```

## Rules Summary

### Enabled Rules
- `curly`: Require curly braces for all control statements
- `eqeqeq`: Require `===` and `!==`
- `no-var`: Require `let` or `const` instead of `var`
- `prefer-const`: Require `const` for variables that are never reassigned
- `@typescript-eslint/no-shadow`: Disallow variable shadowing
- `prettier/prettier`: Enforce Prettier formatting

### Disabled Rules (API Compatibility)
The following rules are disabled because they conflict with API response handling:
- `@typescript-eslint/no-explicit-any` - API responses use `any`
- `@typescript-eslint/no-unsafe-assignment` - Necessary for API responses
- `@typescript-eslint/no-unsafe-member-access` - Necessary for API responses
- `@typescript-eslint/no-unsafe-call` - Necessary for API responses
- `@typescript-eslint/restrict-template-expressions` - Allow any in templates

## CI/CD Integration

Add these commands to your CI pipeline:

```yaml
# Example GitHub Actions
- name: Lint
  run: npm run lint

- name: Format Check
  run: npm run format:check

- name: Type Check
  run: npm run typecheck

- name: Build
  run: npm run build
```

## Pre-commit Hook (Optional)

Add to `package.json`:

```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

Then create `.husky/pre-commit`:

```bash
#!/bin/sh
npm run lint
npm run format:check
npm run typecheck
```

## Configuration Files

- `eslint.config.js` - ESLint flat config
- `.prettierrc` - Prettier configuration
- `tsconfig.json` - TypeScript configuration (enhanced)

## Code Quality Standards

| Metric | Target | Status |
|--------|--------|--------|
| ESLint Errors | 0 | ✅ Passing |
| Prettier Formatting | Compliant | ✅ Passing |
| TypeScript Errors | 0 | ✅ Passing |
| Build | Success | ✅ Passing |
