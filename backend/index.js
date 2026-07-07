var express = require("express");
var session = require("express-session");
var cors = require("cors");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
const routeAPI = require("./app/modules/routeAPI");
const placesAPI = require("./app/modules/placesAPI");

const db = require("./app/db/pool");
const UserRepository = require("./app/repositories/UserRepository");
const TripRepository = require("./app/repositories/TripRepository");
const DetourRepository = require("./app/repositories/DetourRepository");
const createAuthRouter = require("./app/routes/auth");
const createTripsRouter = require("./app/routes/trips");

const IS_PROD = process.env.NODE_ENV === "production";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

var app = express();

// Behind a reverse proxy in production (e.g. Azure), trust the first proxy so
// secure cookies work over the terminated TLS connection.
if (IS_PROD) {
  app.set("trust proxy", 1);
}

app.use(cookieParser());

// This body parser is needed to access the body of a request cleanly
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// Explicit origin + credentials so the browser sends/accepts the session cookie
// on cross-origin XHR from the frontend dev server. A wildcard origin cannot be
// combined with credentials.
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // Frontend and backend are cross-site in production (separate
      // *.azurewebsites.net hosts, which the Public Suffix List treats as
      // distinct sites), so the cookie must be SameSite=None to be sent on
      // cross-site XHR. SameSite=None requires Secure. Locally both run on
      // localhost (same site), where Lax works and avoids needing HTTPS.
      sameSite: IS_PROD ? "none" : "lax",
      secure: IS_PROD,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

// Compose the data-access layer once and inject it into the routers.
const userRepository = new UserRepository(db);
const tripRepository = new TripRepository(db);
const detourRepository = new DetourRepository(db);

app.use("/auth", createAuthRouter({ userRepository }));
app.use(
  "/api/trips",
  createTripsRouter({ tripRepository, detourRepository, db })
);

app.get("/test", function (req, res) {
  res.send({ message: "Hello" });
});

app.get("/route", function (req, res) {
  console.log(req.query);
  routeAPI
    .getRoute(req.query)
    .then((data) => {
      res.status(200).send(JSON.stringify(data));
    })
    .catch(function (error) {
      console.log("Error: " + error);
    });
});

app.get("/places", function (req, res) {
  console.log(req.query);
  placesAPI
    .getPlaces(req.query)
    .then((data) => {
      console.log(data);
      res.status(200).send(JSON.stringify(data));
    })
    .catch(function (error) {
      console.log("Error: " + error);
    });
});

app.listen(3000, () => {
  console.log("HTTP Server running on port 3000");
});
