const config = require('../config')
const {Restaurant} = require('../models')
const places = require('googleplaces-promises').setDefaultAPI(config.GOOGLE_PLACES_API_KEY)
const {Haversine} = require('haversine-position')
const INVALID_REQUEST = 'INVALID_REQUEST'

module.exports = {
  details: (req, res) => {
    places.placeDetailsRequest({ placeid: req.params.placeID })
      .then(data => {
        if (data.status === INVALID_REQUEST) { return res.json({ success: false, message: 'Restaurant not found' }) }

        res.json({
          success: true,
          details: {
            formatted_address: data.result.formatted_address,
            vicinity: data.result.vicinity,
            formatted_phone_number: data.result.formatted_phone_number,
            international_phone_number: data.result.international_phone_number,
            name: data.result.name,
            url: data.result.url,
            permanentlyClosed: data.result.permanently_closed || false,
            photos: data.result.photos.map(photo => photo.photo_reference)
          }
        })

        Restaurant.checkRestaurant(req.params.placeID, data.result.permanently_closed)
      })
      .catch(err => res.json({ success: false, message: err }))
  },

  /**
   * if a token for the next page is received all the other parameters will be ignored by the final request
   * if a radius is received the request will ignore the rankby distance -
   *  which means that who uses this api will have to decide between radius or sort by distance
   */
  nearBy: (req, res) => {
    const startTime = new Date()
    const latitude = req.body.latitude
    if (!latitude) { return res.json({ success: false, message: 'Missing latitude' }) }
    const longitude = req.body.longitude
    if (!longitude) { return res.json({ success: false, message: 'Missing longitude' }) }

    const params = {
      location: [latitude, longitude],
      types: 'restaurant',
      rankby: 'distance',
      pagetoken: req.body.next_page_token
    }

    if (req.body.radius) {
      delete params.rankby
      params.radius = req.body.radius
    }

    places.nearBySearch(params)
      .then(data => {
        if (data.status === INVALID_REQUEST) { return res.json({ success: false, message: INVALID_REQUEST }) }
        const pause = new Date() - startTime
        Promise.all(data.results.map(result =>
          Restaurant.findOne({ placeID: result.place_id }).exec()
            .then(restaurant => ({
              permanentlyClosed: restaurant ? restaurant.permanentlyClosed : false,
              latitude: result.geometry.location.lat,
              longitude: result.geometry.location.lng,
              placeID: result.place_id,
              name: result.name,
              vicinity: result.vicinity,
              photoReference: (result.photos && result.photos.length) > 0 ? result.photos[0].photo_reference : null,
              open: (result.opening_hours && result.opening_hours.open_now) || false,
              totalDishes: restaurant ? restaurant.dishes.length : 0
            }))
            .catch(err => console.log(err))
        ))
        .then(results => {
          results = results.filter(restaurant => !restaurant.permanentlyClosed)
          return res.json({
            success: true,
            request: {
              latitude,
              longitude,
              radius: params.radius,
              pageToken: params.pagetoken,
              duration: {
                untilGooglePlacesAnwser: pause,
                total: new Date() - startTime
              }
            },
            results: {
              total: results.length,
              openNow: results.filter(res => res.open).length,
              nextPage: data.next_page_token || false,
              distanceFromFarestOne: calculateDistanceFromCenter({latitude, longitude}, results[results.length - 1])
            },
            restaurants: results
          })
        })
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
  },

  /**
   * Use location 0,0 and radius big enough to cover the whole world in order
   * for the server IP don't be used as a location reference:
   * https://developers.google.com/places/web-service/autocomplete#location_biasing
   */
  search: (req, res) => {
    const params = {
      input: req.params.query,
      location: [0, 0],
      radius: 20000000
    }

    if (req.body.latitude && req.body.longitude) {
      params.location = [req.body.latitude, req.body.longitude]
      params.radius = req.body.radius || 5000
    }

    places.placeAutocomplete(params)
      .then(data => {
        if (data.status === INVALID_REQUEST) { return res.json({ success: false, message: INVALID_REQUEST }) }

        data = data.predictions.map(prediction => ({
          description: prediction.description,
          placeID: prediction.place_id,
          isEstablishment: prediction.types.indexOf('establishment') > -1
        }))

        return res.json({ success: true, results: data })
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
