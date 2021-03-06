const mongoose = require('mongoose')

const dishSchema = mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  timesServed: {
    type: Number,
    default: 0
  },
  votes: {
    up: {
      type: Number,
      default: 0
    },
    down: {
      type: Number,
      default: 0
    }
  }
})

module.exports = mongoose.model('Dish', dishSchema)
