const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const methodOverride = require("method-override");
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
app.use(methodOverride("_method"));

//databse
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "swswsw",
    visits: 0,
    visitors: [],
    visiRecords: [],
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "swswsw",
    visits: 0,
    visitors: [],
    visiRecords: [],
  },
  "wokert": {
    longURL: "http://www.amazon.com",
    userID: "2222",
    visits: 0,
    visitors: [],
    visiRecords: [],
  },
  "sdefrs": {
    longURL: "http://www.microsoft.com",
    userID: "2222",
    visits: 0,
    visitors: [],
    visiRecords: [],
  }
};
const users = {
  "2222": {
    id: "2222",
    email: "123@gmail.com",
    password: bcrypt.hashSync("123"),
  },
  "swswsw": {
    id: "swswsw",
    email: "2690@qq.com",
    password: bcrypt.hashSync("2690"),
  },
};
class Anonymous {};

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
  if (req.session) {
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
  if (!req.session) {
    return res.redirect("/login");
  }
  const {email} = setupHeader(req, users);
  const templateVars = { 
    email,
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  badCookie(req, res);
  const {cookiedId, email} = setupHeader(req, users);
  const targetShortURL = req.params.shortURL;
  let templateVars = { 
    email,
  };
  if (cookiedId === undefined) {
    res.status(401).render("notlogin", templateVars);
  } else if(!urlDatabase[targetShortURL]) {
    res.status(404).render("pagenotfound", templateVars);
  } else if (urlDatabase[targetShortURL].userID !== cookiedId) {
    res.status(403).render("notyourURL", templateVars);
  } else {
    templateVars = {
      shortURL: targetShortURL,
      longURL: urlDatabase[targetShortURL].longURL,
      creator: urlDatabase[targetShortURL].userID,
      email,
      visits: urlDatabase[targetShortURL].visits,
      visitors: urlDatabase[targetShortURL].visitors.length,
      visiRecords: urlDatabase[targetShortURL].visiRecords,
    };
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  badCookie(req, res);
  const {cookiedId, email} = setupHeader(req, users);
  const targetShortURL = req.params.shortURL;
  const templateVars = { 
    email,
  };
  if (urlDatabase[targetShortURL] === undefined) {
    return res.status(404).render("pagenotfound", templateVars);
  }
  const shortURLObj = urlDatabase[targetShortURL];
  const longURL = shortURLObj.longURL;
  shortURLObj.visits++;
  const user = (cookiedId)? cookiedId : new Anonymous();
  if (!shortURLObj.visitors.includes(user)) {
    shortURLObj.visitors.push(user);
  }
  const time = new Date();
  shortURLObj.visiRecords.push(geneteRandomString() + "/" + time);
  res.redirect(longURL);
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
//create new short&long url pair
app.post("/urls", (req, res) => {
  badCookie(req, res);
  if (!req.session) {
    return res.status(401).send("You need to login first to generate a short URL!");
  }
  const cookiedID = req.session.user_id;
  const shortURL = geneteRandomString();
  urlDatabase[shortURL] = {
    longURL: makeFullURL(req.body.longURL),
    userID: cookiedID,
    visits: 0,
    visitors: [],
    visiRecords: [],
  };
  res.redirect(`/urls/${shortURL}`);
});
//updare or delete current url pair
app.put("/urls/:shortURL", (req, res) => {
  badCookie(req, res);
  if (!req.session) {
    return res.status(401).send(`You need to login to update URLs!`);
  }
  const cookiedId = req.session.user_id;
  const targetShortURL = req.params.shortURL;
  if (urlDatabase[targetShortURL].userID !== cookiedId) {
    return res.status(403).send(`You cannot update others' URLs!`);
  }

  let newLongUrl = req.body.longURL;
  if (newLongUrl !== "") {
    newLongUrl = makeFullURL(newLongUrl);
    urlDatabase[targetShortURL]["longURL"] = newLongUrl;
  }
    res.redirect("/urls");
});

app.delete("/urls/:shortURL", (req, res) => {
  badCookie(req, res);
  if (!req.session) {
    return res.status(401).send(`You need to login to delete URLs!`);
  }
  const cookiedId = req.session.user_id;
  const targetShortURL = req.params.shortURL;
  if (urlDatabase[targetShortURL].userID !== cookiedId) {
    return res.status(403).send(`You cannot delete others' URLs!`);
  }
  delete urlDatabase[targetShortURL];
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
    res.status(400).render("errors", templateVars);
  } else {
    password = bcrypt.hashSync(password, 10);
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