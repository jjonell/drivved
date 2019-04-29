// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'

Vue.config.productionTip = false;

firebase.initializeApp({
  apiKey: "AIzaSyBI8qCgdrSmfHDr-Sidd9sS0zaHB8AVhvE",
  authDomain: "drivved-3de40.firebaseapp.com",
  databaseURL: "https://drivved-3de40.firebaseio.com",
  projectId: "drivved-3de40",
  storageBucket: "drivved-3de40.appspot.com",
  messagingSenderId: "452401327011"
});

window.db = firebase.firestore();

new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App }
})
