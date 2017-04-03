const config = require('../config')
const {Restaurant} = require('../models')
const places = require('googleplaces-promises').setDefaultAPI(config.GOOGLE_PLACES_API_KEY)
const clone = require('clone')
const {Haversine} = require('haversine-position')
const parameters = {
  location: [41.692032, -8.827187],
  types: 'restaurant',
  rankby: 'distance'
}

module.exports = {
  /**
   * if a token for the next page is received all the other parameters will be ignored by the final request
   * if a radius is received the request will ignore the rankby distance -
   *  which means that who uses this api will have to decide between radius or sort by distance
   */
  nearBy: (req, res) => {
    const latitude = req.body.latitude
    if (!latitude) { return res.json({ success: false, message: 'Missing latitude' }) }
    const longitude = req.body.longitude
    if (!longitude) { return res.json({ success: false, message: 'Missing longitude' }) }

    const params = clone(parameters)
    params.location = [latitude, longitude]
    params.pagetoken = req.body.next_page_token
    if (req.body.radius) {
      delete params.rankby
      params.radius = req.body.radius
    }

    places.nearBySearch(params)
      .then(data => {
        Promise.all(data.results.map(result =>
          Restaurant.findOne({ placeID: result.place_id }).exec()
            .then(restaurant => ({
              latitude: result.geometry.location.lat,
              longitude: result.geometry.location.lng,
              placeID: result.place_id,
              name: result.name, // only for testing -> it's not pretended / useful for the application
              open: result.opening_hours && result.opening_hours.open_now,
              totalDishes: restaurant ? restaurant.dishes.length : 0
            }))
        ))
        .then(results => res.json({
          success: true,
          request: {
            latitude,
            longitude,
            radius: params.radius,
            pageToken: params.pagetoken
          },
          results: {
            total: results.length,
            openNow: results.filter(res => res.open).length,
            nextPage: data.next_page_token || false,
            distanceFromFarestOne: calculateDistanceFromCenter({latitude, longitude}, results[results.length - 1])
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

const calculateDistanceFromCenter = (center, point) => {
  if (!point) { return 0 }

  return Haversine.getDistance({
    lat: center.latitude,
    lng: center.longitude
  }, {
    lat: point.latitude,
    lng: point.longitude
  })
}
