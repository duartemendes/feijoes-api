const {Dish} = require('../models')

module.exports = {
  getDishes: (req, res) => {
    let query = {}
    if (req.query.search) { query.name = new RegExp(req.query.search, 'i') }
    const findIt = Dish.find(query, { _id: 0, name: 1 })
    if (req.query.sortBy) { findIt.sort(req.query.sortBy) }
    findIt.exec()
      .then(dishes => res.json({ success: true, dishes: dishes.map(dish => dish.name) }))
      .catch(err => res.json({ success: false, message: err }))
  }
}
