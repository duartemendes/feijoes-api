const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
  deviceID: {
    type: String,
    unique: true,
    required: true
  },
  tokenFB: {
    type: String
  }
})

module.exports = mongoose.model('User', userSchema)
