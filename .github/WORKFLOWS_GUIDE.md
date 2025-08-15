# GitHub Actions Configuration

This directory contains GitHub Actions workflows for automated testing and publishing.

## Workflows

### 1. CI Workflow (`ci.yml`)

**Triggers:**
- Push to `master`, `main`, or `develop` branches
- Pull requests to `master`, `main`, or `develop` branches

**Actions:**
- Runs on Node.js 18.x and 20.x
- Installs dependencies
- Runs linting checks
- Executes unit tests (excludes integration tests)
- Generates test coverage reports
- Builds the project
- Uploads coverage to Codecov (optional)

### 2. Release Workflow (`release.yml`)

**Triggers:**
- GitHub release is published

**Actions:**
- Runs on Node.js 18.x and 20.x
- Installs dependencies
- Runs linting checks
- Executes unit tests
- Builds the project
- Updates package version to match release tag
- Publishes to NPM registry
- Creates and uploads build artifacts

## Setup Instructions

### 1. NPM Token Setup

To enable automatic NPM publishing, you need to add your NPM token as a GitHub secret:

1. Generate an NPM token:
   ```bash
   npm login
   npm token create --type=automation
   ```

2. Add the token to GitHub repository secrets:
   - Go to your repository on GitHub
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your NPM automation token

### 2. Release Process

1. **Update version in package.json** (optional - the workflow will do this automatically):
   ```bash
   npm version patch|minor|major
   ```

2. **Create a GitHub release**:
   - Go to your repository on GitHub
   - Click "Releases" → "Create a new release"
   - Create a new tag (e.g., `v0.1.1`, `v0.2.0`)
   - Add release notes
   - Click "Publish release"

3. **Automatic process**:
   - GitHub Action will trigger automatically
   - Tests will run on multiple Node.js versions
   - If tests pass, package will be published to NPM
   - Build artifacts will be attached to the release

### 3. Version Management

The release workflow automatically:
- Extracts version from the release tag
- Updates `package.json` version
- Publishes to NPM with the correct version

**Tag format examples:**
- `v1.0.0` → NPM version `1.0.0`
- `1.0.0` → NPM version `1.0.0`
- `v1.0.0-beta.1` → NPM version `1.0.0-beta.1`

### 4. Testing Strategy

**Unit Tests Only:**
Both workflows run unit tests while excluding integration tests to avoid requiring real VolcEngine TOS credentials in CI/CD environment.

```bash
npm test -- --testPathIgnorePatterns=".*\.integration\.test\.ts$"
```

**Local Integration Testing:**
Developers can run integration tests locally with proper credentials:

```bash
# Set environment variables
export VOLCENGINE_ACCESS_KEY="your-access-key"
export VOLCENGINE_SECRET_KEY="your-secret-key"
export VOLCENGINE_BUCKET="your-test-bucket"

# Run all tests including integration
npm test
```

## Troubleshooting

### Common Issues

1. **NPM publish fails:**
   - Check if NPM_TOKEN secret is correctly set
   - Verify the token has publish permissions
   - Ensure package name is available on NPM

2. **Tests fail:**
   - Check if all dependencies are properly listed in package.json
   - Verify Node.js version compatibility
   - Review test logs for specific error messages

3. **Build fails:**
   - Check TypeScript compilation errors
   - Verify all imports and dependencies
   - Ensure build script is correctly configured

### Manual NPM Publish

If automatic publishing fails, you can publish manually:

```bash
# Build the project
npm run build

# Run tests
npm test

# Publish to NPM
npm publish
```

## Security Notes

- NPM tokens are stored as GitHub secrets and never exposed in logs
- Integration tests are excluded from CI to avoid exposing credentials
- Only unit tests run in the CI environment
- Build artifacts are created but credentials are never included
