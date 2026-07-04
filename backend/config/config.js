var config = {
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
};

module.exports = config;
