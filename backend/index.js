var express = require("express");
var session = require("express-session");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
const https = require("https");

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

//Starting https server
const httpsServer = https.createServer(app);

httpsServer.listen(3000, () => {
  console.log("HTTPS Server running on port 3000");
});
