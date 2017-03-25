const info = require('./info')

module.exports = (app) => {
  app.get('/description', info.getDescription)
}
