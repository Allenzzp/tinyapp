
const emailExist = (email, obj) => {
  for (let key in obj) {
    if (obj[key]["email"] === email) {
      return key;
    }
  }
  return false;
};

const geneteRandomString = () => {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  let randomURL = "";
  for (let i = 0; i < 6; i++) {
    let randomIndex = Math.floor(Math.random() * 26);
    randomURL += letters[randomIndex];
  }
  return randomURL;
};

const makeFullURL = (url) => {
  const prefix1 = "http://";
  const prefix2 = "www.";
  if (url.indexOf(prefix2) === -1) {
    url = prefix2 + url;
  }
  if (url.indexOf(prefix1) === -1) {
    url = prefix1 + url;
  }
  return url;
};

const urlsForUser = (id, urlDatabase) => {
  const urls = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      urls[shortURL] = urlDatabase[shortURL];
    }
  }
  return urls;
};

const setupHeader = (req, users) => {
  if (!req.session) {
    return {
      cookiedId: undefined,
      email: undefined,
    };
  }
  const cookiedId = req.session.user_id;
  const user = users[cookiedId] || {};
  const email = user.email;
  return {
    cookiedId, 
    email
  };
};

module.exports = {
  emailExist,
  geneteRandomString,
  makeFullURL,
  urlsForUser,
  setupHeader,
};