const express = require('express')
const bodyParser = require('body-parser') // enables reading parameters from the http request body
const morgan = require('morgan') // prints the http request to the console
const mongoose = require('mongoose')
const config = require('./etc/config')

const mongooseError = (err) => console.log('Mongoose connection error: ', err)
mongoose.Promise = global.Promise
mongoose.connection.on('error', (err) => mongooseError(err))
mongoose.connect(config.DATABASE).catch(err => mongooseError(err))

const isDBConnected = (req, res, next) => {
  if (mongoose.connection.readyState === 1) { return next() }
  return res.status(503).json({ error: true, message: 'DB down' })
}

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.set('secret', config.SECRET)

app.get('/', (req, res) => res.send('Feijões API!'))

app.all('/*', isDBConnected, (req, res, next) => { next() })

// requests go here
require('./routes/')(app)

// if request gets here page doesn't exist
app.use((req, res) => res.status(404).json({ success: false, message: 'Page not found' }))

const port = process.env.PORT || 3000
app.listen(port, () => console.log('Live at http://localhost:', port))
