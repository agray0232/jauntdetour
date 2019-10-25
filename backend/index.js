var express = require("express");
var session = require("express-session");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
const https = require("https");
const routeAPI = require("./app/modules/routeAPI");

var app = express();
app.use(cookieParser());

// This body parser is needed to access the body of a request cleanly
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

app.use(
  session({
    secret: "temporarySecretKey",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 100000000 }
    //store: sessionStorage
  })
);
//sessionStorage.sync();

//Route to main page
app.get("/", function(req, res, next) {
  console.log("Message recieved");
  res.send({ message: "Hello" });
});

app.get("/test", function(req, res, next) {
  res.send({ message: "Hello" });
});

app.get("/route", function(req, res, next) {
  routeAPI
    .getRoute()
    .then(data => {
      res.status(200).send(JSON.stringify(data));
    })
    .catch(function(error) {
      console.log("Error: " + error);
    });
});

//Starting https server
//const httpsServer = https.createServer(app);

app.listen(3000, () => {
  console.log("HTTP Server running on port 3000");
});
