const info = require('./info')

module.exports = function (app) {
  app.get('/description', info.getDescription)
}
