const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
  deviceID: {
    type: String,
    unique: true,
    required: true
  },
  favorites: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant'
      },
      placeID: String
    }
  ],
  score: { type: Number, default: 0 },
  votes: {
    up: { type: Number, default: 0 },
    down: { type: Number, default: 0 }
  },
  dishesSubmitted: { type: Number, default: 0 }
})

module.exports = mongoose.model('User', userSchema)
