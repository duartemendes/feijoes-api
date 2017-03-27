const {User} = require('../models/')
const jwt = require('jsonwebtoken')

module.exports = {
  validateToken: (req, res, next) => {
    const token = req.headers['x-access-token'] || req.body['x-access-token']
    const deviceID = req.body.deviceID || req.query.deviceID
    if (!token || !deviceID) { return res.status(403).json({ success: false, message: 'No token provided' }) }

    jwt.verify(token, req.app.get('secret'), (err, decoded) => {
      if (err) { return res.json({ success: false, message: 'Invalid token' }) }

      validateUser(decoded.deviceID)
        .then(user => {
          req.user = user
          // let's give no answer to the user if deviceID wasn't provided
          if (user.deviceID === deviceID) { next() }
        })
        .catch(() => res.json({ success: false }))
    })
  }
}

const validateUser = (deviceID) => {
  return new Promise((resolve, reject) => {
    User.findOne({ deviceID: deviceID }).exec()
      .then((user) => {
        if (user) { return resolve(user) }

        // TODO: validate deviceID
        const newUser = new User({ deviceID: deviceID })
        newUser.save()
          .then(user => resolve(user))
          .catch(err => reject(err))
      })
      .catch(err => reject(err))
  })
}
