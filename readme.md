# Feijões API
> git clone https://github.com/duartemendes/feijoes-api  
cd feijoes-api  
npm install  
setup configuration


### Create etc folder in root directory with the following files:
#### config.js - containing:
```
module.exports = {
  SECRET: 'your_jwt_secret',
  DATABASE: 'your_database_url',
  FIREBASE_DATABASE: 'your_firebase_database_url',
  GOOGLE_PLACES_API_KEY = 'your_google_places_api_key',
  GOOGLE_PLACES_OUTPUT_FORMAT = 'json'
}
```
#### serviceAccountKey.json - get this file at https://console.cloud.google.com
