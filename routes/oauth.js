const parser = require('restify').plugins.bodyParser()
// const lifetime = 60 * 60 * 60 * 60 * 60
const lifetime = {
  accessToken: 60 * 60,
  refreshToken: 660 * 60 * 24 * 14
}

const oauthConfig = {
  token: {
    accessTokenLifetime: lifetime.accessToken,
    refreshTokenLifetime: lifetime.refreshToken,
    requireClientAuthentication: {
      client_credentials: false,
      authorization_code: false,
      password: false
    },
    allowExtendedTokenAttributes: true,
    extendedGrantTypes: {
      'jwt': require('../oauth/jwt')
    },
    alwaysIssueNewRefreshToken: false
  },
  authorize: {
    authorizationCodeLifetime: lifetime
  }
}

/** Make through OAuth **/
module.exports = (server, apiUrl) => {
  server.post(`${apiUrl}/oauth/token`, parser, server.oauth.token(oauthConfig.token))

  server.post(`${apiUrl}/oauth/authorize`, parser, server.oauth.authorize(oauthConfig.authorize))

  server.get(`${apiUrl}/oauth/authenticate`, server.oauth.authenticate(), function(req,res){
    if (res.statusCode !== 401)  {
      res.json({
        me: req.user,
        messsage: 'Authorization success, Without Scopes, Try accessing /profile with `profile` scope',
        description: 'Try postman https://www.getpostman.com/collections/37afd82600127fbeef28',
        more: 'pass `profile` scope while Authorize'
      })
    }
  })

  server.get(`${apiUrl}/oauth/profile`, server.oauth.authenticate({scope:'profile'}), (req, res) => {
    res.json({
      profile: res.oauth.token.User,
      checking: 'hello'
    })
  })
}
