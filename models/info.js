const mongoose = require('mongoose')

const infoSchema = mongoose.Schema({
  description: {
    type: String,
    default: 'Feijões is awesome!'
  },
  email: {
    type: String,
    default: 'duartemendes@ipvc.pt'
  }
})

module.exports = mongoose.model('information', infoSchema)
