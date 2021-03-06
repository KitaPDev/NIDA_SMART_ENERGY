const knex = require("../database").knex;
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const userService = require("../services/user.service");
const cryptoUtil = require("../utils/crypto.util");
const httpStatusCodes = require("http-status-codes").StatusCodes;

async function verifyPassword(username, clearTextPassword) {
  let result = await knex(knex.ref("user"))
    .select("hash_password", "salt")
    .where("username", username);
  let recvHash = result[0].hash_password;
  let salt = result[0].salt;

  let hash = await cryptoUtil.hashPassword(clearTextPassword, salt);

  return hash === recvHash;
}

async function generateJwt(username) {
  let userType = await userService.getUserTypeByUsername(username);

  let data = { username: username, type: userType };

  return jwt.sign(data, process.env.TOKEN_SECRET, {
    expiresIn: process.env.TOKEN_LIFE,
  });
}

async function generateRefreshJwt(username) {
  return jwt.sign({ username: username }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_LIFE,
  });
}

async function newToken(refreshToken) {
  let decodedToken = jwt.decode(refreshToken, process.env.TOKEN_SECRET);
  let exp = decodedToken.exp;

  if (Date.now() >= exp * 1000) {
    return;
  }

  let username = decodedToken.username;
  let token = await generateJwt(username);

  return token;
}

async function getUsernameFromCookies(req) {
  let cookies = req.cookies;
  let token = cookies.jwt;
  let decodedToken = jwt.decode(token, process.env.TOKEN_SECRET);

  return decodedToken.username;
}

module.exports = {
  verifyPassword,
  generateJwt,
  generateRefreshJwt,
  newToken,
  getUsernameFromCookies,
};
