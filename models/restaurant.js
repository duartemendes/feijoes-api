const mongoose = require('mongoose')

const restaurantSchema = mongoose.Schema({
  placeID: {
    type: String,
    unique: true,
    required: true
  },
  dishes: [{
    _id: { id: false },
    // TODO: create Dish Schema
    // dish: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish' },
    dishName: String,
    date: { type: Date, default: Date.now },
    images: [String],
    prices: {
      single: Number,
      menu: {
        price: Number,
        includes: {
          bread: { type: Boolean, default: false },
          soup: { type: Boolean, default: false },
          drink: { type: Boolean, default: false },
          coffee: { type: Boolean, default: false },
          dessert: { type: Boolean, default: false }
        }
      }
    },
    votes: {
      up: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      down: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }
  }]
})

module.exports = mongoose.model('Restaurant', restaurantSchema)