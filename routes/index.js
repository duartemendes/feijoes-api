const info = require('./info')
const auth = require('./auth')
const restaurants = require('./restaurants')

module.exports = (app) => {
  app.get('/description', info.getDescription)

  // this routes must receive some encrypted phrase in order to restrict the setup of new devices to our app
  app.post('/user/registerDeviceID', auth.registerDeviceID)
  app.post('/user/getToken', auth.getToken)

  // from now on a valid JWT is required
  app.use(auth.validateToken)

  // private routes go here
  app.get('/testToken', (req, res) => res.json({ user: req.user }))
  app.post('/restaurants/nearBy', restaurants.nearBy)
  app.get('/restaurants/image/:photo_reference', restaurants.photo)
}
