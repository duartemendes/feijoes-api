const {User} = require('../models/')
const jwt = require('jsonwebtoken')

module.exports = {
  validateToken: (req, res, next) => {
    const token = req.body.token || req.query.token || req.headers['x-access-token']
    const deviceID = req.body.deviceID
    if (!token || !deviceID) { return res.status(403).json({ success: false, message: 'No token provided' }) }

    jwt.verify(token, req.app.get('secret'), (err, decoded) => {
      if (err) { return res.json({ success: false, message: 'Invalid token' }) }

      validateUser(decoded.deviceID)
        .then(user => {
          req.user = user
          if (user.deviceID !== deviceID) {
            // let's give no answer to the user
            return
            // return res.json({ success: false, message: 'DeviceID doesn\'t match token\' deviceID' })
          }
          next()
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
