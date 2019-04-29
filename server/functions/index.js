const firebaseFunctions = require('firebase-functions');
const functions = require('./functions');

exports.helloWorld = firebaseFunctions.region('europe-west1').https.onRequest(functions.test);
