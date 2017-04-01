const config = require('../config')
const {Restaurant} = require('../models')
const places = require('googleplaces-promises').setDefaultAPI(config.GOOGLE_PLACES_API_KEY)
const parameters = {
  location: [41.691591, -8.827032],
  radius: '100',
  types: 'restaurant',
  // language: 'pt-PT',
  rankBy: 'google.maps.places.RankBy.DISTANCE'
}

module.exports = {
  nearBy: (req, res) => {
    const latitude = req.body.latitude
    const longitude = req.body.longitude
    if (!latitude) { return res.json({ success: false, message: 'Missing latitude' }) }
    if (!longitude) { return res.json({ success: false, message: 'Missing longitude' }) }

    parameters.location = [latitude, longitude]
    if (req.body.radius) { parameters.radius = req.body.radius }

    places.nearBySearch(parameters)
      .then(data => {
        Promise.all(data.results.map(result =>
          Restaurant.findOne({ placeID: result.place_id }).exec()
            .then(restaurant => ({
              latitude: result.geometry.location.lat,
              longitude: result.geometry.location.lng,
              placeID: result.place_id,
              name: result.name, // only for testing -> it's not useful for the application
              open: result.opening_hours && result.opening_hours.open_now,
              totalDishes: restaurant ? restaurant.dishes.length : 0
            }))
        ))
        .then(results => res.json({
          success: true,
          request: {
            latitude,
            longitude,
            radius: parameters.radius
          },
          results: {
            total: results.length,
            nextPage: data.next_page_token || false,
            openNow: results.filter(res => res.open).length
          },
          restaurants: results
        }))
        .catch(err => res.json({ success: false, message: err }))
      })
      .catch(err => res.json({ success: false, message: err }))
  },

  photo: (req, res) => {
    places.imageFetch({ photoreference: req.params.photo_reference })
      .then(data => res.redirect(data))
      .catch(err => res.json({ success: false, message: err }))
  },

  dishesOfTheDay: (req, res) => {
    Restaurant.findOne({ placeID: req.params.place_id }, { votes: 0 }).exec()
      .then(restaurant => {
        if (!restaurant) { return res.json({ success: false, message: 'There isn\'t information about this restaurant yet' }) }
        return res.json({ dishes: restaurant.dishes })
      })
      .catch(err => res.json({ success: false, message: err }))
  }
}
