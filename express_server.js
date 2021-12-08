const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 8080;


//use app.render() to load up an ejs view file
app.set("view engine", "ejs");

//middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

//helper functions
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
function emailExist(email, obj) {
  for (let key in obj) {
    if (obj[key]["email"] === email) {
      return true;
    }
  }
  return false;
}

//databse
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
};

//handle GET
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    user: users[req.cookies["user_id"]], 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { 
    user: users[req.cookies["user_id"]], 
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  longURL = makeFullURL(longURL);
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
  }
  res.render("register", templateVars);
});

//handle POST
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

app.post("/login", (req, res) => {
  if (urls[req.cookies["user_id"]].email === req.body.email) {
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("username", req.cookies["username"]);
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const templateVars = {
    desc: "",
  }; 
  
  if (email === "") {
    templateVars.desc = "noemail";
  } else if (password === "") {
    templateVars.desc = "nopassword";
  } else if (emailExist(email, users)) {
    templateVars.desc = "emailexist";
  }

  if (templateVars.desc !== "") {
    res.status(400);
    res.render("errors", templateVars);
  } else {
    const id = geneteRandomString();
    users[id] = {
      id,
      email,
      password,
    };
    res.cookie("user_id", id);
    res.redirect("/urls");
  }
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
}); 