import log from "loglevel";

// Configure logging level based on environment
if (process.env.NODE_ENV === "production") {
  log.setLevel("warn"); // Only show warnings and errors in production
} else {
  log.setLevel("debug"); // Show everything in development
}

export default log;
