const {User} = require('../models/')
const jwt = require('jsonwebtoken')

module.exports = {
  registerDeviceID: (req, res) => {
    const deviceID = req.body.deviceID
    if (!deviceID) { return res.json({ success: false, message: 'Missing device ID' }) }

    User.findOne({ deviceID: deviceID }).exec()
      .then((user) => {
        if (user) { return res.json({ success: false, message: 'Device ID is already registered' }) }

        // TODO: validate deviceID
        const newUser = new User({ deviceID: deviceID })
        newUser.save()
          .then((user) => res.json({ success: true, message: user }))
          .catch(() => res.status(500).json({ success: false }))
      })
      .catch(() => res.status(500).json({ success: false }))
  },

  getToken: (req, res) => {
    const deviceID = req.body.deviceID
    if (!deviceID) { return res.json({ success: false, message: 'Missing device ID' }) }

    // TODO: choose fields to retrieve and store
    User.findOne({ deviceID: deviceID }).exec()
      .then((user) => {
        if (!user) { return res.json({ success: false, message: 'Unknown device ID' }) }

        const token = jwt.sign(user, req.app.get('secret'), {
          expiresIn: 60 * 60 * 24 // 24 hours
        })
        return res.json({ success: true, token: token })
      })
      .catch(() => res.status(500).json({ success: false }))
  },

  validateToken: (req, res, next) => {
    const token = req.body.token || req.query.token || req.headers['x-access-token']
    if (!token) { return res.status(403).json({ success: false, message: 'No token provided' }) }

    jwt.verify(token, req.app.get('secret'), (err, decoded) => {
      if (err) { return res.json({ success: false, message: 'Invalid token' }) }

      req.user = decoded
      next()
    })
  }
}
