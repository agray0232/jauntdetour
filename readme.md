# Jauntdetour

Often during a road trip, you want to stop at a nice place for lunch an hour down the road or take a break to enjoy the nice afternoon on a little hike. But you probably won't know the area you are in well enough or where exactly you will be in an hour. Jauntdetour is a road trip planning app that helps you add detours to your trip so you can find interesting activities that you might have driven by otherwise.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

Jauntdetour consists of a lightweight frontend that is built in React that interfaces with a NodeJS backend deployed on an Ubuntu server. 

### Prerequisites

This project was built with NodeJS (v10.15.3). You can obtain the latest version from the URL below.

```
https://nodejs.org/en/download/
```

#### Environment Variables

Both the frontend and backend use environment variables in their configuration. These are used to set the Google API key and to determine if this is a development or production environment

Google API key
```
export GOOGLE_API_KEY=<key>
```

Node environment
```
// If this is going on a development environment such as a laptop
export NODE_ENV="development"

// If this is going on production target hardware such as an Ubuntu server
export NODE_ENV="production"
```

### Installing

A step by step series of examples that tell you how to get a development env running

Clone the repo

```
git clone https://github.com/agray0232/jauntdetour.git
```

Run npm install for both the frontend and backend

```
cd /<repo-root-dir>/frontend
npm install

cd ../backend
npm install
```

## Development Setup (Recommended)

For the best development experience, use the provided DevContainer or the convenience scripts:

### Option 1: DevContainer (VS Code)
1. Open the project in VS Code
2. Install the "Dev Containers" extension
3. Press `Ctrl+Shift+P` → "Dev Containers: Reopen in Container"
4. The container will automatically install all dependencies
5. Use `Ctrl+Shift+P` → "Tasks: Run Task" → "Start Full Stack Development"

### Option 2: Local Development with Scripts
Install root-level dependencies first:
```bash
npm install
```

Then start both services:
```bash
npm run dev
```

This will start:
- Backend on http://localhost:3000
- Frontend on http://localhost:3001

### Individual Services
```bash
# Backend only (with auto-restart)
npm run backend:dev

# Frontend only  
npm run frontend:dev
```

## Original Manual Setup

### Installing

A step by step series of examples that tell you how to get a development env running

Clone the repo

```
git clone https://github.com/agray0232/jauntdetour.git
```

Run npm install for both the frontend and backend

```
cd /<repo-root-dir>/frontend
npm install

cd ../backend
npm install
```

To run in a development environment, follow the following steps

Start the backend
```
cd /<repo-root-dir>/backend
node index.js
```

Start the frontend
```
cd ../frontend
npm start
```

View the running application in your browser of choice by going to `http://localhost:3001` (frontend) or `http://localhost:3000` (backend API)

## Testing

This project includes comprehensive unit tests and linting to ensure code quality.

### Running Tests Locally

#### Frontend Tests
```bash
cd frontend

# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

#### Backend Tests
```bash
cd backend

# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Running Linters

#### Frontend Linting
```bash
cd frontend

# Check for linting errors
npm run lint

# Automatically fix linting errors
npm run lint:fix

# Check code formatting
npm run format:check

# Format code
npm run format
```

#### Backend Linting
```bash
cd backend

# Check for linting errors
npm run lint

# Automatically fix linting errors
npm run lint:fix

# Check code formatting
npm run format:check

# Format code
npm run format
```

### Continuous Integration

All pushes and pull requests automatically trigger the CI pipeline which:
- Runs ESLint on both frontend and backend
- Runs Prettier to check code formatting
- Executes all unit tests
- Builds the application

**The pipeline must pass before any pull request can be merged.**

## Built With

* [Node v10.15.3](https://nodejs.org/en/download/) - Runtime environment
* [Express](https://expressjs.com/) - Web framework used for backend
* [React](https://reactjs.org/) - Library used to build the frontend
* [Redux](https://redux.js.org/) - State management library
* [google-maps-react](https://github.com/fullstackreact/google-maps-react) - React library for wrapping the Google Maps API

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/agray0232/jauntdetour/tags).

## CI/CD

This project uses GitHub Actions for continuous integration and deployment. 

### Continuous Integration (CI)
Every push and pull request triggers automated checks:
- **Linting**: ESLint validates code quality for both frontend (React best practices) and backend (Node.js best practices)
- **Formatting**: Prettier ensures consistent code formatting
- **Unit Tests**: All tests must pass before merging
- **Build**: Verifies the application builds successfully

### Continuous Deployment (CD)
The deployment pipeline automatically:
- Detects changes in backend and frontend directories
- Builds Docker containers (`jauntdetour-backend` and `jauntdetour-frontend`)
- Automatically bumps versions (patch by default, configurable via commit messages)
- Pushes images to Azure Container Registry
- Deploys to production

**Pull requests cannot be merged if the CI pipeline fails.**

For detailed information about the CI/CD pipeline, version management, and deployment options, see [CI-CD.md](CI-CD.md).

## Authors

* **Anthony Gray** - *Initial work* - [Portfolio](https://anthonyrgray.com)

## Acknowledgments

* Thank you to the Digital Crafts instructors that helped me get this project off the ground
