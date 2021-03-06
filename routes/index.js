const info = require('./info')
const auth = require('./auth')
const restaurants = require('./restaurants')
const dishes = require('./dishes')
const favorites = require('./favorites')

module.exports = (app) => {
  app.get('/description', info.getDescription)

  // from now on a valid JWT is required
  app.use(auth.validateToken)

  // private routes go here
  app.get('/testToken', (req, res) => res.json({ user: req.user }))

  app.get('/restaurant/:placeID', restaurants.details)
  app.post('/restaurants/nearBy', restaurants.nearBy)
  app.get('/restaurants/image/:photo_reference', restaurants.photo)

  app.post('/search/:query', restaurants.search)

  app.get('/dishes', dishes.getDishes)

  app.get('/restaurant/dishes/:placeID', dishes.dishesOfTheDay)
  app.post('/restaurant/dishes/:placeID', dishes.assignDish)
  app.put('/restaurant/dishes/:placeID', dishes.voteOnDish)

  app.get('/favorites', favorites.userFavorites)
  app.post('/favorites/:placeID', favorites.addOrRemoveFavorite)
}
