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
function makeFullURL(url) {
  const prefix1 = "http://";
  const prefix2 = "www.";

  if (url.indexOf(prefix2) === -1) {
    url = prefix2 + url;
  }

  if (url.indexOf(prefix1) === -1) {
    url = prefix1 + url;
  }
  return url;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
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

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  longURL = makeFullURL(longURL);
  res.redirect(longURL);
});

//follwoings are POST handling 
app.post("/urls", (req, res) => {
  const shortURL = geneteRandomString();
  urlDatabase[shortURL] = makeFullURL(req.body.longURL);
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id", (req, res) => {
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/urls/:shortURL/update", (req, res) => {
  const newShortUrl = req.params.shortURL;
  let newLongUrl = req.body.longURL;
  newLongUrl = makeFullURL(newLongUrl);
  urlDatabase[newShortUrl] = newLongUrl;
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const deleteUrl = req.params.shortURL;
  delete urlDatabase[deleteUrl];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
}); 