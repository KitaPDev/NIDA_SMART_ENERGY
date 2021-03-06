const userService = require("../services/user.service");
const authService = require("../services/auth.service");
const httpStatusCodes = require("http-status-codes").StatusCodes;
const mailer = require("../mailer");

const emailRegex =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

async function register(req, res) {
  try {
    let body = req.body;

    let username = body.username;
    let email = body.email;
    let clearTextPassword = body.password;
    let userTypeID = body.user_type_id;

    if (await userService.usernameExists(username)) {
      return res
        .status(httpStatusCodes.FORBIDDEN)
        .send("Username already exists.");
    }

    if (!emailRegex.test(email)) {
      return res.status(httpStatusCodes.FORBIDDEN).send("Email is not valid.");
    }

    if (await userService.emailExists(email)) {
      return res
        .status(httpStatusCodes.FORBIDDEN)
        .send("Email already exists.");
    }

    if (clearTextPassword.length < 8) {
      return res
        .status(httpStatusCodes.FORBIDDEN)
        .send("Password is too short.");
    }

    if (
      userTypeID === undefined ||
      userTypeID <= 0 ||
      !userService.userTypeExists(userTypeID)
    ) {
      return res
        .status(httpStatusCodes.FORBIDDEN)
        .send("User type is not valid.");
    }

    let err = await userService.insertUser(
      username,
      email,
      clearTextPassword,
      userTypeID
    );
    if (err != undefined) {
      throw new Error(err);
    }

    let userID = await userService.getUserIDbyUsername(username);

    let hash = await userService.insertEmailHash(userID);

    mailer.sendConfirmationEmail(email, hash, username);

    return res.sendStatus(httpStatusCodes.OK);
  } catch (err) {
    console.log(err);
    return res.sendStatus(httpStatusCodes.INTERNAL_SERVER_ERROR);
  }
}

async function confirmEmail(req, res) {
  try {
    let hash = req.params.hash;

    let userID = await userService.getUserIDByEmailHash(hash);

    if (!userID) {
      return res
        .status(httpStatusCodes.FORBIDDEN)
        .send("Email hash is not valid.");
    }

    userService.deleteEmailHash(userID);
    userService.updateUserEmailVerified(userID);
  } catch (err) {
    return res.sendStatus(httpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  res
    .status(httpStatusCodes.OK)
    .sendFile(process.cwd() + "/views/success_confirmEmail.html");
}

async function forgotPassword(req, res) {
  try {
    let body = req.body;

    let username = body.username;
    let email = body.email;

    if (username.length === 0 && email.length === 0) {
      return res
        .status(httpStatusCodes.FORBIDDEN)
        .send("Provide either username or email");
    }

    if (username.length > 0 && email.length === 0) {
      email = await userService.getEmailFromUsername(username);
    }

    if (!(await userService.emailExists(email))) {
      return res.status(httpStatusCodes.FORBIDDEN).send("Email does not exist");
    }

    if (!(await userService.isEmailVerified(email))) {
      return res
        .status(httpStatusCodes.FORBIDDEN)
        .send("Email has not been verified");
    }

    let userID = await userService.getUserIDByEmail(email);
    let hash = "";

    if (await userService.emailHashExists(userID)) {
      hash = await userService.getEmailHashByUserID(userID);
    } else {
      hash = await userService.insertEmailHash(userID);
    }

    mailer.sendForgotPasswordEmail(email, hash);
  } catch (err) {
    return res.sendStatus(httpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  res.sendStatus(httpStatusCodes.OK);
}

async function getResetPasswordForm(req, res) {
  try {
    let hash = req.params.hash;

    let userID = await userService.getUserIDByEmailHash(hash);

    if (!userID) {
      return res
        .status(httpStatusCodes.FORBIDDEN)
        .send("Email hash is not valid.");
    }

    res
      .status(httpStatusCodes.OK)
      .sendFile(process.cwd() + "/views/resetPassword.html");
  } catch (err) {
    return res.sendStatus(httpStatusCodes.INTERNAL_SERVER_ERROR);
  }
}

async function resetPassword(req, res) {
  try {
    let body = req.body;
    let hash = req.params.hash;

    let userID = await userService.getUserIDByEmailHash(hash);

    if (!userID) {
      return res
        .status(httpStatusCodes.FORBIDDEN)
        .send("Email hash is not valid.");
    }

    userService.deleteEmailHash(userID);

    userService.updatePassword(userID, body.password);
  } catch (err) {
    return res.sendStatus(httpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  res
    .status(httpStatusCodes.OK)
    .sendFile(process.cwd() + "/views/success_resetPassword.html");
}

async function getAllUserType(req, res) {
  try {
    let result = await userService.getAllUserType();

    let lsUserType = [];

    for (let r of result) {
      let userType = {};

      userType.id = r.id;
      userType.label = r.label;

      userType.id !== 0 ? lsUserType.push(userType) : "";
    }

    res.status(httpStatusCodes.OK).send(lsUserType);
    return;
  } catch (err) {
    return res.sendStatus(httpStatusCodes.INTERNAL_SERVER_ERROR);
  }
}

async function getUserInfo(req, res) {
  try {
    let username;

    let body = req.body;
    body.username
      ? (username = body.username)
      : (username = await authService.getUsernameFromCookies(req));

    if (!username) {
      return res.sendStatus(httpStatusCodes.FORBIDDEN);
    }
    let userInfo = await userService.getUserInfoByUsername(username);

    let profileImageBlob = userInfo.profile_image;
    if (profileImageBlob != null) {
      let contentType = userInfo.profile_image_content_type;

      userInfo.profile_image = profileImageBlob.toString("base64");
      userInfo.profile_image =
        "data:" + contentType + ";base64," + userInfo.profile_image;
    }

    res.status(httpStatusCodes.OK).send(userInfo);
  } catch (err) {
    return res.sendStatus(httpStatusCodes.INTERNAL_SERVER_ERROR);
  }
}

async function changeUsername(req, res) {
  try {
    let body = req.body;
    let username = body.username;
    let prevUsername = body.prev_username;

    if (!username) {
      return res.sendStatus(httpStatusCodes.FORBIDDEN);
    }

    await userService.updateUsername(prevUsername, username);

    let refreshToken = await authService.generateRefreshJwt(username);
    let token = await authService.generateJwt(username);

    res.cookie("refresh_jwt", refreshToken, {
      httpOnly: true,
      domain: "." + process.env.BASE_DOMAIN,
    });
    res.cookie("jwt", token, {
      httpOnly: true,
      domain: "." + process.env.BASE_DOMAIN,
    });

    res.sendStatus(httpStatusCodes.OK);
  } catch (err) {
    return res.sendStatus(httpStatusCodes.INTERNAL_SERVER_ERROR);
  }
}

async function changeEmail(req, res) {
  try {
    let body = req.body;
    let email = body.email;

    if (!email) {
      return res.sendStatus(httpStatusCodes.FORBIDDEN);
    }

    let username = await authService.getUsernameFromCookies(req);

    if (!username) {
      return res.sendStatus(httpStatusCodes.FORBIDDEN);
    }

    await userService.updateEmail(username, email);

    let userID = await userService.getUserIDbyUsername(username);
    let hash = await userService.insertEmailHash(userID);

    mailer.sendConfirmationEmail(email, hash, username);

    return res.sendStatus(httpStatusCodes.OK);
  } catch (err) {
    return res.sendStatus(httpStatusCodes.INTERNAL_SERVER_ERROR);
  }
}

async function uploadProfileImage(req, res) {
  try {
    let body = req.body;
    let base64Image = body.image;

    if (!base64Image) {
      return res.sendStatus(httpStatusCodes.FORBIDDEN);
    }

    if (base64Image.length === 0) {
      return res.sendStatus(httpStatusCodes.FORBIDDEN);
    }

    let username = await authService.getUsernameFromCookies(req);

    if (!username) {
      return res.sendStatus(httpStatusCodes.FORBIDDEN);
    }

    await userService.updateProfileImage(username, base64Image);

    return res.sendStatus(httpStatusCodes.OK);
  } catch (err) {
    return res.sendStatus(httpStatusCodes.INTERNAL_SERVER_ERROR);
  }
}

async function changePassword(req, res) {
  try {
    let username = await authService.getUsernameFromCookies(req);
    let changePasswordUsername = req.body.username;

    if (!username) {
      return res.sendStatus(httpStatusCodes.FORBIDDEN);
    }

    let email = await userService.getEmailFromUsername(changePasswordUsername);

    if (!(await userService.emailExists(email))) {
      return res.status(httpStatusCodes.FORBIDDEN).send("Email does not exist");
    }

    if (!(await userService.isEmailVerified(email))) {
      return res
        .status(httpStatusCodes.FORBIDDEN)
        .send("Email has not been verified");
    }

    let userID = await userService.getUserIDByEmail(email);
    let hash = "";

    if (await userService.emailHashExists(userID)) {
      hash = await userService.getEmailHashByUserID(userID);
    } else {
      hash = await userService.insertEmailHash(userID);
    }

    mailer.sendForgotPasswordEmail(email, hash);

    return res.sendStatus(httpStatusCodes.OK);
  } catch (err) {
    return res.sendStatus(httpStatusCodes.INTERNAL_SERVER_ERROR);
  }
}

async function deactivateUser(req, res) {
  try {
    let username = await authService.getUsernameFromCookies(req);
    let deactivateUsername = req.body.username;

    if (!username) {
      return res.sendStatus(httpStatusCodes.FORBIDDEN);
    }

    await userService.deactivateUser(deactivateUsername);

    return res.sendStatus(httpStatusCodes.OK);
  } catch (err) {
    return res.sendStatus(httpStatusCodes.INTERNAL_SERVER_ERROR);
  }
}

async function activateUser(req, res) {
  try {
    let username = await authService.getUsernameFromCookies(req);
    let activateUsername = req.body.username;

    if (!username) {
      return res.sendStatus(httpStatusCodes.FORBIDDEN);
    }

    await userService.activateUser(activateUsername);

    return res.sendStatus(httpStatusCodes.OK);
  } catch (err) {
    return res.sendStatus(httpStatusCodes.INTERNAL_SERVER_ERROR);
  }
}

async function getAllUser(req, res) {
  try {
    let lsUser = await userService.getAllUser();

    lsUser = lsUser.filter((user) => user.user_type !== "Super Admin");

    return res.status(httpStatusCodes.OK).send(lsUser);
  } catch (err) {
    return res.sendStatus(httpStatusCodes.INTERNAL_SERVER_ERROR);
  }
}

async function getUserType(req, res) {
  try {
    let username = await authService.getUsernameFromCookies(req);

    if (!username) {
      return res.sendStatus(httpStatusCodes.FORBIDDEN);
    }

    let userType = await userService.getUserTypeByUsername(username);

    return res.status(httpStatusCodes.OK).send(userType);
  } catch (err) {
    return res.sendStatus(httpStatusCodes.INTERNAL_SERVER);
  }
}

async function approveUserType(req, res) {
  try {
    let username = await authService.getUsernameFromCookies(req);
    let approveUsername = req.body.username;

    if (!username) {
      return res.sendStatus(httpStatusCodes.FORBIDDEN);
    }

    await userService.approveUserType(approveUsername);
    return res.sendStatus(httpStatusCodes.OK);
  } catch (err) {
    return res.sendStatus(httpStatusCodes.INTERNAL_SERVER_ERROR);
  }
}

async function getUsername(req, res) {
  try {
    return res
      .status(httpStatusCodes.OK)
      .send(await authService.getUsernameFromCookies(req));
  } catch (err) {
    console.log(err);
    return res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
  }
}

module.exports = {
  register,
  confirmEmail,
  forgotPassword,
  getResetPasswordForm,
  resetPassword,
  getAllUserType,
  getUserInfo,
  changeUsername,
  changeEmail,
  uploadProfileImage,
  changePassword,
  deactivateUser,
  activateUser,
  getAllUser,
  getUserType,
  approveUserType,
  getUsername,
};
