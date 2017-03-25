const express = require('express')
const bodyParser = require('body-parser') // it enables reading parameters from the http request body
const morgan = require('morgan') // it prints the http request to the console
const mongoose = require('mongoose')
const urls = require('./config/urls')

mongoose.Promise = global.Promise
mongoose.connect(urls.mongo)

const isDBConnected = (req, res, next) => {
  if (mongoose.connection.readyState === 1) { return next() }
  return res.status(503).json({ error: true, message: 'DB down' })
}

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(morgan('dev'))

app.all('/*', isDBConnected, (req, res, next) => { next() })

// requests go here
require('./routes/')(app)

// if request gets here page doesn't exist
app.use((req, res) => res.status(404).json({ error: true, message: 'Page not found' }))

const port = process.env.PORT || 3000
app.listen(port, () => console.log('Live at http://localhost:', port))
