const info = require('./info')
const auth = require('./auth')
const restaurants = require('./restaurants')
const dishes = require('./dishes')

module.exports = (app) => {
  app.get('/description', info.getDescription)

  // from now on a valid JWT is required
  app.use(auth.validateToken)

  // private routes go here
  app.get('/testToken', (req, res) => res.json({ user: req.user }))

  app.get('/restaurant/:placeID', restaurants.details)
  app.post('/restaurants/nearBy', restaurants.nearBy)
  app.get('/restaurants/image/:photo_reference', restaurants.photo)
  app.get('/restaurants/dishesOfTheDay/:place_id', restaurants.dishesOfTheDay)

  app.get('/dishes/:sortBy', dishes.getAllDishes)
}
