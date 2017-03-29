const {Dish} = require('../models')

module.exports = {
  getAllDishes: (req, res) => {
    Dish.find({}, { _id: 0 }).sort(req.params.sortBy).exec()
      .then(dishes => res.json({ success: true, dishes: dishes }))
      .catch(err => res.json({ success: false, message: err }))
  }
}
