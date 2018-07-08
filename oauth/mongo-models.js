/**
 * Created by Manjesh on 14-05-2016.
 */

var _ = require('lodash');
var mongodb = require('./mongodb');
var User = mongodb.User;
var OAuthClient = mongodb.OAuthClient;
var OAuthAccessToken = mongodb.OAuthAccessToken;
var OAuthAuthorizationCode = mongodb.OAuthAuthorizationCode;
var OAuthRefreshToken = mongodb.OAuthRefreshToken;

const isExpiredDate = (token) => {
  const today = Date.now();
  const expiredDate = Date.parse(token.expires);
  if (today >= expiredDate) {
    return true
  } else {
    return false
  }
}

/**
 * Generate access token.
 */

const generateAccessToken = function(client, user, scope) {
  if (this.model.generateAccessToken) {
    return promisify(this.model.generateAccessToken, 3).call(this.model, client, user, scope)
      .then(function(accessToken) {
        return accessToken || tokenUtil.generateRandomToken();
      });
  }

  return tokenUtil.generateRandomToken();
};

/**
 * Generate refresh token.
 */

const generateRefreshToken = function(client, user, scope) {
  if (this.model.generateRefreshToken) {
    return promisify(this.model.generateRefreshToken, 3).call(this.model, client, user, scope)
      .then(function(refreshToken) {
        return refreshToken || tokenUtil.generateRandomToken();
      });
  }

  return tokenUtil.generateRandomToken();
};

function getAccessToken(bearerToken) {
  console.log("getAccessToken",bearerToken)
  return OAuthAccessToken
  //User,OAuthClient
    .findOne({access_token: bearerToken})
    .populate('User')
    .populate('OAuthClient')
    .then(function (accessToken) {
      if (!accessToken) return false;
      var token = accessToken;

      if (isExpiredDate(token)) {
        return false
      }

      token.user = token.User;
      token.client = token.OAuthClient;
      token.scope = token.scope
      return token;
    })
    .catch(function (err) {
      console.log("getAccessToken - Err: ")
    });
}

function getClient(clientId, clientSecret) {
  const options = {client_id: clientId};
  if (clientSecret) options.client_secret = clientSecret;
  return OAuthClient
    .findOne(options)
    .then(function (client) {
      if (!client) return new Error("client not found");
      var clientWithGrants = client
      clientWithGrants.grants = ['authorization_code', 'password', 'refresh_token', 'client_credentials', 'jwt']
      // Todo: need to create another table for redirect URIs
      clientWithGrants.redirectUris = [clientWithGrants.redirect_uri]
      delete clientWithGrants.redirect_uri
      //clientWithGrants.refreshTokenLifetime = integer optional
      //clientWithGrants.accessTokenLifetime  = integer optional
      return clientWithGrants
    }).catch(function (err) {
      console.log("getClient - Err: ", err)
    });
}


function getUser(username, password) {
  return User
    .findOne({username: username})
    .then(function (user) {
      console.log("u",user)
      return user.password === password ? user : false;
    })
    .catch(function (err) {
      console.log("getUser - Err: ", err)
    });
}

const revokeAuthorizationCode = async (code) => {
  const authorizationCode = await OAuthAuthorizationCode.findOne({
    authorization_code: code.code
  })
  return !!authorizationCode
}

const revokeToken = async (token) => {
  const refreshToken = await OAuthRefreshToken.find({
    refresh_token: token.refreshToken
  })
  return !!refreshToken;
}

function saveToken(token, client, user) {
  return Promise.all([
      OAuthAccessToken.create({
        access_token: token.accessToken,
        expires: token.accessTokenExpiresAt,
        OAuthClient: client._id,
        User: user._id,
        scope: token.scope
      }),
      token.refreshToken ? OAuthRefreshToken.create({ // no refresh token for client_credentials
        refresh_token: token.refreshToken,
        expires: token.refreshTokenExpiresAt,
        OAuthClient: client._id,
        User: user._id,
        scope: token.scope
      }) : [],

    ])
    .then(function (resultsArray) {
      return _.assign(  // expected to return client and user, but not returning
        {
          client: client,
          user: user,
          access_token: token.accessToken, // proxy
          refresh_token: token.refreshToken, // proxy
        },
        token
      )
    })
    .catch(function (err) {
      console.log("revokeToken - Err: ", err)
    });
}

function getAuthorizationCode(code) {
  console.log("getAuthorizationCode",code)
  return OAuthAuthorizationCode
    .findOne({authorization_code: code})
    .populate('User')
    .populate('OAuthClient')
    .then(function (authCodeModel) {
      if (!authCodeModel) return false;
      var client = authCodeModel.OAuthClient
      var user = authCodeModel.User
      return reCode = {
        code: code,
        client: client,
        expiresAt: authCodeModel.expires,
        redirectUri: client.redirect_uri,
        user: user,
        scope: authCodeModel.scope,
      };
    }).catch(function (err) {
      console.log("getAuthorizationCode - Err: ", err)
    });
}

function saveAuthorizationCode(code, client, user) {
  console.log("saveAuthorizationCode",code, client, user)
  return Promise.all([
    OAuthAuthorizationCode
      .create({
        expires: code.expiresAt,
        OAuthClient: client._id,
        authorization_code: code.authorizationCode,
        User: user._id,
        scope: code.scope
      })
    ])
    .then(function () {
      code.code = code.authorizationCode
      return code
    }).catch(function (err) {
      console.log("saveAuthorizationCode - Err: ", err)
    });
}

function getUserFromClient(client) {
  console.log("getUserFromClient", client)
  var options = {client_id: client.client_id};
  if (client.client_secret) options.client_secret = client.client_secret;

  return OAuthClient
    .findOne(options)
    .populate('User')
    .then(function (client) {
      if (!client) return false;
      if (!client.User) return false;
      return client.User;
    }).catch(function (err) {
      console.log("getUserFromClient - Err: ", err)
    });
}

function getRefreshToken(refreshToken) {
  console.log("getRefreshToken", refreshToken)
  if (!refreshToken || refreshToken === 'undefined') return false
//[OAuthClient, User]
  return OAuthRefreshToken
    .findOne({refresh_token: refreshToken})
    .populate('User')
    .populate('OAuthClient')
    .then(function (savedRT) {
      var tokenTemp = {
        user: savedRT ? savedRT.User : {},
        client: savedRT ? savedRT.OAuthClient : {},
        refreshTokenExpiresAt: savedRT ? new Date(savedRT.expires) : null,
        refreshToken: refreshToken,
        scope: savedRT.scope
      };
      return tokenTemp;

    }).catch(function (err) {
      console.log("getRefreshToken - Err: ", err)
    });
}

function validateScope(user, client, scope) {
  console.log("validateScope", user, client, scope)
  return (user.scope === client.scope) ? scope : false
}

function verifyScope(token, scope) {
  console.log("verifyScope", token, scope)
  return token.scope === scope
}
module.exports = {
  // generateOAuthAccessToken: generateAccessToken, // optional - used for jwt
  // generateAuthorizationCode: generateRefreshToken, // optional
  //generateOAuthRefreshToken, - optional
  getAccessToken: getAccessToken,
  getAuthorizationCode: getAuthorizationCode, //getOAuthAuthorizationCode renamed to,
  getClient: getClient,
  getRefreshToken: getRefreshToken,
  getUser: getUser,
  getUserFromClient: getUserFromClient,
  //grantTypeAllowed, Removed in oauth2-server 3.0
  revokeAuthorizationCode: revokeAuthorizationCode,
  revokeToken: revokeToken,
  saveToken: saveToken,//saveOAuthAccessToken, renamed to
  saveAuthorizationCode: saveAuthorizationCode, //renamed saveOAuthAuthorizationCode,
  //validateScope: validateScope,
  verifyScope: verifyScope,
}
