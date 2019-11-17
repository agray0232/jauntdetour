# Jauntdetour Frontend

The Jauntdetour frontend is a lightweight React/Redux app that interfaces with the backend server for data requests and processing.

## Available Scripts

In the project directory, you can run:

```
npm start
```

Runs the app in the development mode.<br />
Open [http://localhost:8080](http://localhost:8080) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

```
npm test
```

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

No unit tests are available yet.

```
npm run build
```

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## Structure

### Configuration

The configuration file used by the frontend is located in `<frontend-root>/src/config`. Environment variables are read here.

### Scripts

The scripts used throughout the React components are located in `<frontend-root>/src/scripts`. This is the interface point between the frontend and the backend server.

### React Components

The React components can be found in `<frontend-root>/src/components`.

