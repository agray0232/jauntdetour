# CI/CD Pipeline Documentation

## Overview

This project uses GitHub Actions for continuous integration and deployment. The pipeline automatically builds and deploys the backend and frontend when changes are detected in their respective directories.

## Pipeline Features

### Automatic Change Detection
- The pipeline monitors changes in `backend/` and `frontend/` directories
- Only builds and deploys the services that have been modified
- Reduces unnecessary builds and deployment time

### Version Management
- **Automatic version bumping** on every push to main
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
- Images are pushed to Azure Container Registry (jauntdetouracr.azurecr.io)
- **Backend image**: `jauntdetouracr.azurecr.io/jauntdetour-backend`
- **Frontend image**: `jauntdetouracr.azurecr.io/jauntdetour-frontend`

#### Image Tags:
- `latest` - Latest version from main branch
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
- Runs only on pushes to main branch
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
- Pushes images to Azure Container Registry (on push to main)
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
      "docker login jauntdetouracr.azurecr.io -u \$ACR_USERNAME -p \$ACR_PASSWORD && \
       docker pull jauntdetouracr.azurecr.io/jauntdetour-backend:latest && \
       docker stop jauntdetour-backend || true && \
       docker rm jauntdetour-backend || true && \
       docker run -d --name jauntdetour-backend \
         -p 3000:3000 \
         jauntdetouracr.azurecr.io/jauntdetour-backend:latest"
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

### Azure Container Registry Authentication

The pipeline requires authentication to push Docker images to Azure Container Registry. You need to add the following secrets:

1. **ACR_USERNAME** - Azure Container Registry username (service principal ID or admin username)
2. **ACR_PASSWORD** - Azure Container Registry password (service principal password or admin password)

#### Setting up Azure Service Principal (Recommended)

1. Create a service principal with access to your Azure Container Registry:
```bash
az ad sp create-for-rbac --name "github-actions-jauntdetour" \
  --role acrpush \
  --scopes /subscriptions/<subscription-id>/resourceGroups/<resource-group>/providers/Microsoft.ContainerRegistry/registries/jauntdetouracr
```

2. The command will output credentials. Add them to GitHub secrets:
   - `ACR_USERNAME` = `appId` from the output
   - `ACR_PASSWORD` = `password` from the output

#### Alternative: Using Admin Credentials

1. Enable admin user in Azure Portal:
   - Go to your Container Registry → Access keys
   - Enable Admin user
   
2. Add the credentials to GitHub secrets:
   - `ACR_USERNAME` = Admin username shown in portal
   - `ACR_PASSWORD` = One of the admin passwords shown in portal

**Note**: Service principal is the recommended approach for production as it provides better security and access control.

### Deployment Secrets

For deployment, you may also need to add:
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
- Check Azure Portal to see published container images in your Container Registry

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
