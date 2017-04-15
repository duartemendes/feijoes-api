const {Restaurant} = require('../models')
const handleInternalError = err => {
  console.log(err)
  return { success: false, message: err }
}

module.exports = {
  userFavorites: (req, res) => res.json({ success: true, favorites: req.user.favorites.map(favorite => favorite.placeID) }),

  addOrRemoveFavorite: (req, res) => {
    if (!req.body.isAdd) { return res.json({ success: false, message: 'Missing add or remove' }) }

    Restaurant.checkRestaurant(req.params.placeID)
      .then(restaurant => {
        if (!restaurant) { return res.json({ success: false, message: 'Restaurant not found' }) }

        const restIndex = restaurant.favorites.findIndex(favorite => favorite.equals(req.user._id))
        const userIndex = req.user.favorites.findIndex(favorite => favorite.placeID === req.params.placeID)

        if (req.body.isAdd === 'true') {
          if (restIndex < 0) {
            restaurant.favorites.push(req.user._id)
            restaurant.save()
          }
          if (userIndex < 0) {
            req.user.favorites.push(restaurant)
            req.user.save()
          }
        } else {
          if (restIndex >= 0) {
            restaurant.favorites.splice(restIndex, 1)
            restaurant.save()
          }
          if (userIndex >= 0) {
            req.user.favorites.splice(userIndex, 1)
            req.user.save()
          }
        }
        return res.json({ success: true })
      })
      .catch(err => res.json(handleInternalError(err)))
  }
}
