const {Dish} = require('../models')
const {Restaurant} = require('../models')
const menuKeys = ['bread', 'soup', 'drink', 'dessert', 'coffee']
const handleInternalError = err => {
  console.log(err)
  return { success: false, message: err }
}

module.exports = {
  getDishes: (req, res) => {
    let query = {}
    if (req.query.search) { query.name = new RegExp(req.query.search, 'i') }
    const findIt = Dish.find(query, { _id: 0, name: 1 })
    if (req.query.sortBy) { findIt.sort(req.query.sortBy) }
    findIt.exec()
      .then(dishes => res.json({ success: true, dishes: dishes.map(dish => dish.name) }))
      .catch(err => res.json({ success: false, message: err }))
  },

  dishesOfTheDay: (req, res) => {
    Restaurant.findOne({ placeID: req.params.placeID }, { 'dishes.dish': 0, 'dishes.creator': 0, 'dishes.date': 0 }).exec()
      .then(restaurant => {
        if (!restaurant) { return res.json({ success: false, message: 'There isn\'t information about this restaurant yet' }) }

        const dishes = restaurant.dishes.map(dish => buildDishResponse(dish, req.user._id))
        return res.json({ success: true, dishes })
      })
      .catch(err => res.json(handleInternalError(err)))
  },

  assignDish: (req, res) => {
    if (!req.body.dish) { return res.json({ success: false, message: 'Missing dish name' }) }
    if (!req.body.single && !req.body.menu) { return res.json({ success: false, message: 'Missing prices' }) }

    Dish.findOne({ name: req.body.dish }).exec()
      .then(dish => {
        if (!dish) { return res.json({ success: false, message: 'Dish not found', code: 1 }) }

        Restaurant.checkRestaurant(req.params.placeID)
          .then(restaurant => {
            if (restaurant.permanentlyClosed) { return res.json({ success: false, message: 'Restaurant permanently closed', code: 2 }) }
            if (restaurant.dishes.some(dish_ => dish_.dish.equals(dish._id))) { return res.json({ success: false, message: 'Dish already assigned', code: 3 }) }

            restaurant.dishes.push(buildDish(dish, req.body, req.user))
            restaurant.save()
              .then(restaurant => {
                res.json({ success: true, dish: buildDishResponse(restaurant.dishes[restaurant.dishes.length - 1], req.user._id) })
                incrementDishes(req.user, dish)
                // TODO: notify users in here
              })
              .catch(err => res.json(handleInternalError(err)))
          })
          .catch(err => res.json(handleInternalError(err)))
      })
      .catch(err => res.json(handleInternalError(err)))
  },

  voteOnDish: (req, res) => {
    if (!req.body.dish) { return res.json({ success: false, message: 'Missing dish' }) }
    if (!req.body.isUp) { return res.json({ success: false, message: 'Missing type of vote' }) }

    Restaurant.findOne({ placeID: req.params.placeID }).populate('dishes.dish').exec()
      .then(restaurant => {
        if (!restaurant) { return res.json({ success: false, message: 'Restaurant not found' }) }

        const index = restaurant.dishes.findIndex(dish => dish.dishName === req.body.dish)
        if (index < 0) { return res.json({ success: false, message: 'Dish not found' }) }

        const votes = restaurant.dishes[index].votes
        if (votes.down.some(user => user.equals(req.user._id)) || votes.up.some(user => user.equals(req.user._id))) {
          return res.json({ success: false, message: 'User already voted' })
        }

        const key = req.body.isUp === 'true' ? 'up' : 'down'
        restaurant.dishes[index].dish.votes[key]++
        votes[key].push(req.user._id)

        res.json({ success: true, votes: buildDishResponse(restaurant.dishes[index], req.user._id).votes })

        restaurant.save()
        req.user.votes[key]++
        req.user.save()
      })
      .catch(err => res.json(handleInternalError(err)))
  }
}

const buildDishResponse = (dish, userID) => ({
  dishName: dish.dishName,
  votes: {
    down: dish.votes.down.length,
    up: dish.votes.up.length,
    voted: dish.votes.down.some(userID_ => userID_.equals(userID)) ? -1
            : (dish.votes.up.some(userID_ => userID_.equals(userID)) ? 1 : 0)
  },
  prices: dish.prices,
  images: dish.images
})

const incrementDishes = (user, dish) => {
  user.dishesSubmitted++
  user.save()
  dish.timesServed++
  dish.save()
}

const buildDish = (dish, body, { _id }) => {
  let newDish = {
    dish: dish._id,
    dishName: dish.name,
    date: new Date(),
    creator: _id,
    images: [],
    prices: {}
  }

  if (body.single) { newDish.prices.single = body.single }

  if (body.menu) {
    newDish.prices.menu = {
      price: body.menu,
      includes: {}
    }

    menuKeys.forEach(key => { newDish.prices.menu.includes[key] = (body[key] !== undefined) })
  }

  if (body.image) { newDish.images.push(body.image) }

  return newDish
}
