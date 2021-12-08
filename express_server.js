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
      return key;
    }
  }
  return false;
}
function checkLogin(id) {
  return id !== undefined;
}

//databse
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ48lW",
  }
};

const users = {
};

//handle GET
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const cookiedId = req.cookies["user_id"];
  const user = users[cookiedId] || {};
  const email = user.email;
  const templateVars = { 
    email,
    urls: urlDatabase,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const cookiedId = req.cookies["user_id"];
  if (!checkLogin(cookiedId)) {
    res.redirect("/login");
  } else {
    const user = users[cookiedId] || {};
    const email = user.email;
    const templateVars = { 
      email,
    };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const cookiedId = req.cookies["user_id"];
  const user = users[cookiedId] || {};
  const email = user.email;
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    creator: urlDatabase[req.params.shortURL].userID,
    email,
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(404).send('<h1 style="text-align:center">Page Not Found!</h1>');
  } else {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    longURL = makeFullURL(longURL);
    res.redirect(longURL);
  }
});

app.get("/register", (req, res) => {
  const cookiedId = req.cookies["user_id"];
  const user = users[cookiedId] || {};
  const email = user.email;
  const templateVars = { 
    email,
  };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const cookiedId = req.cookies["user_id"];
  const user = urlDatabase[cookiedId] || {};
  const email = user.email;
  const templateVars = { 
    email,
  };
  res.render("login", templateVars);
});

//handle POST
app.post("/urls", (req, res) => {
  const cookie = req.cookies["user_id"];
  if (!checkLogin(cookie)) {
    res.send("You need to login first to generate a short URL!")
  } else {
    const shortURL = geneteRandomString();
    urlDatabase[shortURL] = {
      longURL: makeFullURL(req.body.longURL),
      userID: cookie,
    }
    res.redirect(`/urls/${shortURL}`);
  }
});

app.post("/urls/:id", (req, res) => {
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/urls/:shortURL/update", (req, res) => {
  const newShortUrl = req.params.shortURL;
  let newLongUrl = req.body.longURL;
  newLongUrl = makeFullURL(newLongUrl);
  urlDatabase[newShortUrl]["longURL"] = newLongUrl;
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const deleteUrl = req.params.shortURL;
  delete urlDatabase[deleteUrl];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = emailExist(email, users);
  const templateVars = {
    desc: "",
    type: "login",
  };
  if (!id) {
    res.status(403);
    templateVars.desc = "emailnotfound";
    res.render("errors", templateVars);
  } else {
    if (users[id].password === password) {
      res.cookie("user_id", id);
      res.redirect("/urls");
    } else {
      res.status(403);
      templateVars.desc = "wrongpassword";
      res.render("errors", templateVars);
    }
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const templateVars = {
    desc: "",
    type: "register"
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