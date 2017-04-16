const config = require('../etc/config')
const {Restaurant} = require('../models')
const places = require('googleplaces-promises').setDefaultAPI(config.GOOGLE_PLACES_API_KEY)
const {Haversine} = require('haversine-position')
const INVALID_REQUEST = 'INVALID_REQUEST'
const handleInternalError = err => {
  console.log(err)
  return { success: false, message: err }
}

module.exports = {
  details: (req, res) => {
    places.placeDetailsRequest({ placeid: req.params.placeID, language: req.query.language || 'en' })
      .then(data => {
        if (data.status === INVALID_REQUEST) { return res.json({ success: false, message: 'Restaurant not found' }) }

        let response = {
          success: true,
          details: {
            formatted_address: data.result.formatted_address,
            vicinity: data.result.vicinity,
            formatted_phone_number: data.result.formatted_phone_number,
            international_phone_number: data.result.international_phone_number,
            name: data.result.name,
            url: data.result.url,
            latitude: data.result.geometry.location.lat,
            longitude: data.result.geometry.location.lng,
            photos: (data.result.photos && data.result.photos.length > 0) ? data.result.photos.map(photo => photo.photo_reference) : undefined,
            open: (data.result.opening_hours && data.result.opening_hours.open_now) || false,
            // periods: data.result.opening_hours ? data.result.opening_hours.periods : undefined,
            permanentlyClosed: data.result.permanently_closed || false,
            isReallyRestaurant: data.result.types.includes('restaurant') || data.result.types.includes('food'),
            // schedule: data.result.opening_hours ? data.result.opening_hours.weekday_text.map(day => day.charAt(0).toUpperCase() + day.slice(1)) : undefined
            schedule: data.result.opening_hours ? data.result.opening_hours.weekday_text.map(day => {
              let weekDay = day.substr(0, day.indexOf(': '))
              weekDay = weekDay.charAt(0).toUpperCase() + weekDay.slice(1)
              const hours = day.substr(day.indexOf(': ') + 2)
              return {
                weekDay,
                hours
              }
            }) : undefined,
            isFavorite: req.user.favorites.findIndex(favorite => favorite.placeID === req.params.placeID) >= 0
          }
        }

        Restaurant.findOne({ placeID: req.params.placeID }).exec()
          .then(restaurant => {
            response.details.totalDishes = (restaurant && restaurant.dishes ? restaurant.dishes.length : 0)
            res.json(response)
            if (response.details.isReallyRestaurant) { Restaurant.checkRestaurant(req.params.placeID, data.result.permanently_closed).then().catch(err => console.log(err)) }
          })
          .catch(err => res.json(handleInternalError(err)))
      })
      .catch(err => res.json(handleInternalError(err)))
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
              photoReference: (result.photos && result.photos.length) > 0 ? result.photos[0].photo_reference : undefined,
              open: (result.opening_hours && result.opening_hours.open_now) || false,
              totalDishes: restaurant ? restaurant.dishes.length : 0,
              isFavorite: restaurant ? req.user.favorites.findIndex(favorite => favorite.placeID === restaurant.placeID) >= 0 : false
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
            restaurants: results || []
          })
        })
        .catch(err => res.json(handleInternalError(err)))
      })
      .catch(err => res.json(handleInternalError(err)))
  },

  photo: (req, res) => {
    places.imageFetch({ photoreference: req.params.photo_reference })
      .then(link => res.json({ success: true, link }))
      .catch(err => res.json(handleInternalError(err)))
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
      .catch(err => res.json(handleInternalError(err)))
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
