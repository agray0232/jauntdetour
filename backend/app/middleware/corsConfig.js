function createCorsOptions({ allowedOrigins, fallbackOrigin }) {
  const origins = (allowedOrigins || fallbackOrigin)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    origin: origins,
    credentials: true,
  };
}

module.exports = createCorsOptions;
