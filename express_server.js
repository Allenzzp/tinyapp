const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
//use app.render() to load up an ejs view file

app.use(bodyParser.urlencoded({extended: true}));

function geneteRandomString() {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  let randomURL = "";
  for (let i = 0; i < 6; i++) {
    let randomIndex = Math.floor(Math.random() * 26);
    randomURL += letters[randomIndex];
  }
  return randomURL;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
 });

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = geneteRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  console.log(urlDatabase);
  res.send(`url shortted is ${geneteRandomString()}`);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});