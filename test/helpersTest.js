const { assert } = require('chai');

const { emailExist } = require('../helpers');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe("getUserByEmail", () => {
  it("should return a vaild user id if the user exists", () => {
    const foundEmail = emailExist("user@example.com", testUsers);
    assert.equal(foundEmail, "userRandomID");
  });
  it("should return false if no such email address", () => {
    const foundEmail = emailExist("user3@example.com", testUsers);
    assert.equal(foundEmail, false);
  });
});