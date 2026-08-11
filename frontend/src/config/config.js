var config = {
  NODE_ENV: process.env.NODE_ENV,
  GOOGLE_API_KEY: process.env.REACT_APP_GOOGLE_API_KEY,
  APPLICATIONINSIGHTS_CONNECTION_STRING:
    process.env.REACT_APP_APPLICATIONINSIGHTS_CONNECTION_STRING,
  BACKEND_URL:
    process.env.REACT_APP_BACKEND_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://api.jauntdetour.com"),
};

module.exports = config;
