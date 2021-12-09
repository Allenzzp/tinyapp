const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const {emailExist, geneteRandomString, makeFullURL, urlsForUser, setupHeader} = require("./helpers");

const app = express();
const PORT = 8080;

//use app.render() to load up an ejs view file
app.set("view engine", "ejs");

//middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  keys: ["secret"],
  maxAge: 24 * 60 * 60 * 1000
}));

//databse
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ48lW",
  },
  "wokert": {
    longURL: "http://www.amazon.com",
    userID: "2222",
  },
  "sdefrs": {
    longURL: "http://www.microsoft.com",
    userID: "2222",
  }
};

const users = {
  "2222": {
    id: "2222",
    email: "123@gmail.com",
    password: bcrypt.hashSync("123"),
  }
};

//helper functions
function badCookie(req, res) {
  //check user exist
  const userIDarr = Object.keys(users);
  if (userIDarr.includes(req.session.user_id)) {
    return;
  }
  req.session = null;
}

//handle GET
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  badCookie(req, res);
  const {cookiedId, email} = setupHeader(req, users);
  if (cookiedId === undefined) {
    const templateVars = { 
      email,
    };
    res.status(401).render("notlogin", templateVars);
  } else {
    const urlList = urlsForUser(cookiedId, urlDatabase);
    const templateVars = { 
      email,
      urls: urlList,
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  badCookie(req, res);
  const cookiedId = req.session.user_id;
  if (!cookiedId) {
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
  badCookie(req, res);
  const {cookiedId, email} = setupHeader(req, users);
  const targetSURL = req.params.shortURL;
  let templateVars = { 
    email,
  };
  if (cookiedId === undefined) {
    res.status(401).render("notlogin", templateVars);
  } else if(!urlDatabase[targetSURL]) {
    res.status(404).render("pagenotfound", templateVars);
  } else if (urlDatabase[targetSURL].userID !== cookiedId) {
    res.status(403).render("notyourURL", templateVars);
  } else {
    templateVars = {
      shortURL: targetSURL,
      longURL: urlDatabase[targetSURL].longURL,
      creator: urlDatabase[targetSURL].userID,
      email,
    };
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  badCookie(req, res);
  const {cookiedId, email} = setupHeader(req, users);
  const targetSURL = req.params.shortURL;
  const templateVars = { 
    email,
  };
  if (urlDatabase[targetSURL] === undefined) {
    res.status(404).render("pagenotfound", templateVars);
  } else {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    longURL = makeFullURL(longURL);
    res.redirect(longURL);
  }
});

app.get("/register", (req, res) => {
  badCookie(req, res);
  const {cookiedId, email} = setupHeader(req, users);
  if (cookiedId) {
    res.redirect("/urls");
  } else {
  const templateVars = { 
    email,
  };
  res.render("register", templateVars);
 }
});

app.get("/login", (req, res) => {
  badCookie(req, res);
  const {cookiedId, email} = setupHeader(req, users);
  if (cookiedId) {
    res.redirect("/urls");
  } else {
    const templateVars = { 
      email,
    };
    res.render("login", templateVars);
  }
});


//handle POST/////////////////////////////////////////////////////////

app.post("/urls", (req, res) => {
  badCookie(req, res);
  const cookiedID = req.session.user_id;
  if (!cookiedID) {
    res.status(401).send("You need to login first to generate a short URL!");
  } else {
    const shortURL = geneteRandomString();
    urlDatabase[shortURL] = {
      longURL: makeFullURL(req.body.longURL),
      userID: cookiedID,
    }
    res.redirect(`/urls/${shortURL}`);
  }
});

app.post("/urls/:shortURL", (req, res) => {
  badCookie(req, res);
  const cookiedId = req.session.user_id;
  const targetSURL = req.params.shortURL;
  if (cookiedId === undefined) {
    res.status(401).send("You need to login to update URLs!");
  } else if (urlDatabase[targetSURL].userID !== cookiedId) {
    res.status(403).send("You cannot update others' URLs!");
  } else {
    let newLongUrl = req.body.longURL;
    if (newLongUrl !== "") {
      newLongUrl = makeFullURL(newLongUrl);
      urlDatabase[targetSURL]["longURL"] = newLongUrl;
    }
    res.redirect("/urls");
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  badCookie(req, res);
  const cookiedId = req.session.user_id;
  const targetSURL = req.params.shortURL;
  if (cookiedId === undefined) {
    res.status(401).send("You need to login to delete URLs!");
  } else if (urlDatabase[targetSURL].userID !== cookiedId) {
    res.status(403).send("You cannot delete others' URLs!");
  } else {
  delete urlDatabase[targetSURL];
  res.redirect("/urls");
  }
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
    if (bcrypt.compareSync(password, users[id].password)) {
      req.session.user_id = id;
      res.redirect("/urls");
    } else {
      res.status(403);
      templateVars.desc = "wrongpassword";
      res.render("errors", templateVars);
    }
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  let password = req.body.password;
  password = bcrypt.hashSync(password, 10);
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
    req.session.user_id = id;
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});