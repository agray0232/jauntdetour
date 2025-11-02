# CI/CD Pipeline Documentation

## Overview

This project uses GitHub Actions for continuous integration and deployment. The pipeline automatically builds and deploys the backend and frontend when changes are detected in their respective directories.

## Pipeline Features

### Automatic Change Detection
- The pipeline monitors changes in `backend/` and `frontend/` directories
- Only builds and deploys the services that have been modified
- Reduces unnecessary builds and deployment time

### Version Management
- **Automatic version bumping** on every push to main/master
- **Default behavior**: Patch version bump (x.x.1)
- **Custom version bumps** via commit message keywords:
  - `[major]` or `BREAKING` → Major version bump (1.x.x)
  - `[minor]` → Minor version bump (x.1.x)
  - Default (no keyword) → Patch version bump (x.x.1)

#### Examples:
```bash
# Patch version bump (1.0.0 → 1.0.1)
git commit -m "fix: correct route handling"

# Minor version bump (1.0.0 → 1.1.0)
git commit -m "[minor] add new feature for user profiles"

# Major version bump (1.0.0 → 2.0.0)
git commit -m "[major] BREAKING: change API response format"
git commit -m "BREAKING: remove deprecated endpoints"
```

### Docker Container Registry
- Images are pushed to GitHub Container Registry (ghcr.io)
- **Backend image**: `ghcr.io/<owner>/jauntdetour-backend`
- **Frontend image**: `ghcr.io/<owner>/jauntdetour-frontend`

#### Image Tags:
- `latest` - Latest version from main/master branch
- `<version>` - Specific version (e.g., `1.0.1`)
- `<major>.<minor>` - Major.minor version (e.g., `1.0`)
- `<branch>-<sha>` - Branch name with commit SHA
- `pr-<number>` - Pull request number

### Pull Request Validation
- Runs on all pull requests
- Builds Docker images to validate changes
- Does NOT push images or bump versions
- Does NOT deploy

### Deployment
- Runs only on pushes to main/master branch
- Deploys after successful build
- Currently configured as placeholder (see Deployment Setup below)

## Workflow Jobs

### 1. detect-changes
Determines which parts of the application have changed to optimize the build process.

### 2. version-backend / version-frontend
- Bumps the version in package.json
- Commits the version change back to the repository
- Runs only for pushes (not PRs)

### 3. build-backend / build-frontend
- Builds Docker images using the Dockerfiles in respective directories
- Pushes images to GitHub Container Registry (on push to main/master)
- Uses build caching for faster builds

### 4. deploy-backend / deploy-frontend
- Deploys the new version to production
- Currently contains placeholder deployment logic

## Deployment Setup

The pipeline includes deployment jobs that need to be configured for your specific infrastructure. Here are common deployment scenarios:

### Option 1: Deploy to a Server via SSH

Add these secrets to your GitHub repository:
- `DEPLOY_HOST` - Your server hostname/IP
- `DEPLOY_USER` - SSH username
- `DEPLOY_KEY` - Private SSH key
- `DEPLOY_PORT` - SSH port (default: 22)

Example deployment script:
```yaml
- name: Deploy Backend
  env:
    DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
    DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
    DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
  run: |
    # Setup SSH
    mkdir -p ~/.ssh
    echo "$DEPLOY_KEY" > ~/.ssh/deploy_key
    chmod 600 ~/.ssh/deploy_key
    
    # Deploy
    ssh -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no \
      $DEPLOY_USER@$DEPLOY_HOST \
      "docker pull ghcr.io/${{ github.repository_owner }}/jauntdetour-backend:latest && \
       docker stop jauntdetour-backend || true && \
       docker rm jauntdetour-backend || true && \
       docker run -d --name jauntdetour-backend \
         -p 3000:3000 \
         ghcr.io/${{ github.repository_owner }}/jauntdetour-backend:latest"
```

### Option 2: Deploy to Cloud Platform

Configure your cloud provider's deployment action:
- **AWS ECS**: Use `aws-actions/amazon-ecs-deploy-task-definition`
- **Google Cloud Run**: Use `google-github-actions/deploy-cloudrun`
- **Azure Container Instances**: Use `azure/container-apps-deploy-action`
- **DigitalOcean**: Use `digitalocean/action-doctl`

### Option 3: Deploy Using Docker Compose

If using Docker Compose on a server:
```yaml
- name: Deploy with Docker Compose
  run: |
    ssh $DEPLOY_USER@$DEPLOY_HOST \
      "cd /path/to/app && \
       docker-compose pull && \
       docker-compose up -d"
```

## Required GitHub Secrets

The pipeline currently requires minimal secrets as it uses GitHub's built-in token for pushing to GitHub Container Registry.

For deployment, you'll need to add:
- Server credentials (SSH keys, API tokens, etc.)
- Environment variables for your application
- Any API keys or secrets needed by your application

Add secrets in: **Settings → Secrets and variables → Actions → New repository secret**

## Manual Workflow Trigger

You can also trigger the workflow manually:
1. Go to **Actions** tab in GitHub
2. Select **CI/CD Pipeline**
3. Click **Run workflow**
4. Choose the branch and run

## Monitoring

- View workflow runs in the **Actions** tab
- Each job shows detailed logs
- Failed jobs will send notifications (if configured)
- Check the **Packages** tab to see published container images

## Troubleshooting

### Version bump conflicts
If multiple commits happen quickly, version bumps might conflict. The workflow will fail gracefully and you may need to rerun it.

### Build failures
Check the job logs in the Actions tab. Common issues:
- Missing dependencies in package.json
- Dockerfile errors
- Insufficient permissions

### Deployment failures
Verify:
- Secrets are correctly configured
- Server is accessible
- Docker is installed on the target server
- Sufficient disk space and memory

## Customization

You can customize the workflow by editing `.github/workflows/ci-cd.yml`:
- Change trigger branches
- Modify version bump logic
- Add additional build steps
- Configure different deployment targets
- Add testing/linting steps
- Add notifications (Slack, email, etc.)

## Best Practices

1. **Always test in PRs** - The workflow will validate your changes
2. **Use semantic commit messages** - Helps with version management
3. **Tag releases** - Create GitHub releases for major versions
4. **Monitor deployments** - Check that containers are running correctly
5. **Keep secrets secure** - Never commit secrets to the repository
6. **Review workflow logs** - Check for warnings or issues
