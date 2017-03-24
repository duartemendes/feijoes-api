const Info = require('../models/info')

module.exports = {
  getDescription: function (req, res) {
    Info.findOne({}, { _id: 0 }).exec()
      .then((info) => {
        res.json(info)
      })
      .catch((err) => {
        console.log(err)
        res.status(500).json({ error: true })
      })
  }
}
