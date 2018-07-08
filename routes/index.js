module.exports = (server, apiUrl) => {
  require('./todo')(server, apiUrl)
  require('./user')(server, apiUrl)
  require('./oauth')(server, apiUrl)
  require('./private/todo')(server, apiUrl)
}
