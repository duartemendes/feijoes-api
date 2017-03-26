const config = require('../config')
const places = require('googleplaces-promises').setDefaultAPI(config.GOOGLE_PLACES_API_KEY)
// const places = new Places(config.GOOGLE_PLACES_API_KEY, config.GOOGLE_PLACES_OUTPUT_FORMAT)
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
      .then(data => res.json({
        amount: {
          total: data.results.length,
          openNow: data.results.filter(r => r.opening_hours && r.opening_hours.open_now).length
        },
        restaurants: data.results
      }))
      .catch(err => res.json({ success: false, message: err }))
  },

  photo: (req, res) => {
    places.imageFetch({ photoreference: req.params.photo_reference })
      .then(data => res.redirect(data))
      .catch(err => res.json({ success: false, message: err }))
  }
}
