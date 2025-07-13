# Development Scripts and Commands

## Quick Start
```bash
# Start both frontend and backend in development mode
npm run dev

# Or start them individually
npm run backend:dev
npm run frontend:dev
```

## Individual Commands

### Backend (Node.js/Express)
```bash
cd backend
npm install
npm run dev        # Start with nodemon (auto-restart)
npm start          # Start normally
```

### Frontend (React)
```bash
cd frontend
npm install
npm start          # Start development server on port 3001
npm run build      # Build for production
```

## Ports
- Backend API: http://localhost:3000
- Frontend Dev Server: http://localhost:3001
- Frontend Production Build: http://localhost:8080

## Environment Variables
Make sure to set these in your environment:
```bash
export GOOGLE_API_KEY=your_api_key_here
export NODE_ENV=development
export NODE_OPTIONS=--openssl-legacy-provider
```

## DevContainer Features
- Automatic dependency installation for both frontend and backend
- Port forwarding configured for all services
- VS Code extensions pre-installed for React/Node.js development
- Nodemon for backend auto-restart on file changes
- React fast refresh for frontend live reloading

## Development Tips
1. The backend will auto-restart when you change files (thanks to nodemon)
2. The frontend has fast refresh enabled for live updates
3. Both services can run simultaneously using `npm run dev`
4. The devcontainer automatically installs all dependencies when created
