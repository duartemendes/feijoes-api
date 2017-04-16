const admin = require('firebase-admin')
const serviceAccount = require('../etc/serviceAccountKey.json')
const options = {
  priority: 'high',
  timeToLive: 60 * 60 * 6
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: require('../etc/config.js').FIREBASE_DATABASE
})

module.exports = {
  newDish: ({placeID}, {name}) => {
    const payload = {
      notification: {
        title: name,
        body: 'Clique nesta notificação para saber onde. Feijões <3',
        sound: 'default'
      },
      data: {
        placeID
      }
    }

    admin.messaging().sendToTopic(placeID, payload, options)
      .then()
      .catch(err => console.log(err))
  }
}
