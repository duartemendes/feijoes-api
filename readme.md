# Feijões API
> git clone https://github.com/duartemendes/feijoes-api
  cd feijoes-api
  npm install
  setup configuration


### Create config folder in root directory with the following files:
##### config.js
```
exports.apiKey = process.env.GOOGLE_PLACES_API_KEY || 'your_google_places_api_key'
exports.outputFormat = process.env.GOOGLE_PLACES_OUTPUT_FORMAT || 'json'
```
##### urls.js
```
module.exports = {
  'mongo': 'urlForDatabase'
}
```
