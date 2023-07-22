var express = require("express");
var session = require("express-session");
var cors = require("cors");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
const https = require("https");
const routeAPI = require("./app/modules/routeAPI");
const placesAPI = require("./app/modules/placesAPI");
const path = require("path");

var app = express();
app.use(cookieParser());

// This body parser is needed to access the body of a request cleanly
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

app.use(cors());

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

app.get("/test", function(req, res) {
  res.send({ message: "Hello" });
});

app.get("/route", function(req, res) {
  console.log(req.query);
  routeAPI
    .getRoute(req.query)
    .then(data => {
      res.status(200).send(JSON.stringify(data));
    })
    .catch(function(error) {
      console.log("Error: " + error);
    });
});

app.get("/places", function(req, res) {
  console.log(req.query);
  placesAPI
    .getPlaces(req.query)
    .then(data => {
      res.status(200).send(JSON.stringify(data));
    })
    .catch(function(error) {
      console.log("Error: " + error);
    });
});

app.listen(3000, () => {
  console.log("HTTP Server running on port 3000");
});
