'use strict'
const mongodb = require('../oauth/mongodb')
var sqldb = require('../oauth/sqldb');
var config = require('../config')
const utils = require('../utils')

const OAuthAccessToken = config.database === 'mongodb' ? mongodb.OAuthAccessToken : sqldb.OAuthAccessToken
const OAuthAuthorizationCode = config.database === 'mongodb' ? mongodb.OAuthAuthorizationCode : sqldb.OAuthAuthorizationCode
const OAuthClient = config.database === 'mongodb' ? mongodb.OAuthClient : sqldb.OAuthClient
const OAuthRefreshToken = config.database === 'mongodb' ? mongodb.OAuthRefreshToken : sqldb.OAuthRefreshToken
const OAuthScope = config.database === 'mongodb' ? mongodb.OAuthScope : sqldb.OAuthScope
const User = config.database === 'mongodb' ? mongodb.User : sqldb.User

const defaultInfo = {
  user: {
    username: 'setine',
    password: utils.oauthTools.saltHashPassword('admin'),
    scope: 'default'
  },
  setClient: (user) => {
    return {
      username: utils.oauthTools.hmacEncryption(user.username),
      password: utils.oauthTools.saltHashPassword(user.password)
    }
  },
  redirect_uri: 'http://localhost',
  scope: 'website'
}

const seeds = {
  mongodb: async () => {
    const isData = await User.find({username: defaultInfo.user.username})
    const currnetStatus = isData.length === 0 ? true : false

    if (currnetStatus) {
      OAuthAccessToken.find({}).remove()
      OAuthAuthorizationCode.find({}).remove()
      OAuthRefreshToken.find({}).remove()

      await OAuthScope.find({}).remove()
      await OAuthScope.create({
        scope: defaultInfo.scope,
        is_default: false
      },{
        scope: 'default',
        is_default: true
      })

      console.log('finished populating OAuthScope')

      await User.find({}).remove()

      const user = await User.create({
        username: defaultInfo.user.username,
        password: defaultInfo.user.password,
        scope: defaultInfo.user.scope
      })

      console.log('finished populating users', user)

      try {
        await OAuthClient.find({}).remove()

        const client = await OAuthClient.create({
          client_id: defaultInfo.setClient(user).username,
          client_secret: defaultInfo.setClient(user).password,
          grant_types: 'jwt',
          scope: defaultInfo.scope,
          redirect_uri: defaultInfo.redirect_uri,
          User: user._id
        })

        await OAuthClient.create({
          client_id: defaultInfo.setClient(user).username,
          client_secret: defaultInfo.setClient(user).password,
          redirect_uri: defaultInfo.redirect_uri,
          User: user._id
        })

        console.log('finished populating OAuthClient', client)
      } catch(err) {
        console.log(err)
      }
    }
  },
  sqldb: async () => {
    let isData = []
    try {
      isData = await User.findAll({
        where: {username: defaultInfo.user.username},
        attributes: ['id', 'username', 'password', 'scope']
      })
    } catch(e) {
      console.log('there is no database')
    }

    const currnetStatus = isData.length === 0 ? true : false

    if (currnetStatus) {
      await User.sync({force:config.seedDBForce})
      await User.destroy({ where: {} });

      const user = {
        username: defaultInfo.user.username,
        password: defaultInfo.user.password,
        scope: defaultInfo.user.scope
      }

      await User.bulkCreate([user])

      console.log('finished populating users', user)

      await OAuthClient.sync({force:config.seedDBForce})
      await OAuthClient.destroy({ where: {} })

      const client = [{
        client_id: defaultInfo.setClient(user).username,
        client_secret: defaultInfo.setClient(user).password,
        grant_types: 'jwt',
        scope: defaultInfo.scope,
        redirect_uri: defaultInfo.redirect_uri,
        user_id: 1
      },
      {
        client_id: defaultInfo.setClient(user).username,
        client_secret: defaultInfo.setClient(user).password,
        redirect_uri: defaultInfo.redirect_uri,
        user_id: 1
      }]

      await OAuthClient.bulkCreate(client)

      console.log('finished populating OAuthClient')

      await OAuthAccessToken.sync({force:config.seedDBForce})
      await OAuthRefreshToken.sync({force:config.seedDBForce})
      await OAuthAuthorizationCode.sync({force:config.seedDBForce})

      await OAuthScope.sync({force:config.seedDBForce})
      await OAuthScope.destroy({ where: {} })
      await OAuthScope.bulkCreate([{
        scope: defaultInfo.scope,
        is_default: false
      }, {
        scope: 'default',
        is_default: true
      }])
      console.log('finished populating scope')
    }
  }
}

module.exports = seeds
