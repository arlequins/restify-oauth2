const oauthWork = require('../config').model
const jwt = require('restify-jwt-community')
const jwtSecret = require('../config').jwtSecret

/** Control Private through OAuth **/
module.exports = function(server, apiUrl) {
  server.post('/getUser', (req, res, next) => {
    let data = req.body
    oauthWork.getUser(data.id, data.pwd).then(function (user) {
      res.json(user)
    })
  })

  server.get('/protected', jwt({secret: jwtSecret}), function(req, res) {
    res.json(req.user)
  });

  server.get('/userInfo', jwt, (req, res, next) => {
    res.send('hello?')
  })
  server.post('/generate', (req, res, next) => {
    let data = req.body
    let response = oauthWork.getClient(data.id, data.pwd);
    res.send('hello?')
  })
}
