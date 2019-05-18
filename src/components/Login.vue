<template>
  <div>
    <header>Drivved log in</header>
    <br><br>
    <div id="firebaseui-auth-container"></div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      
    }
  },
  mounted () {
    // FirebaseUI config.
    var uiConfig = {
      signInSuccessUrl: '/#/',
      signInOptions: [
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
        firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        //firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        //firebase.auth.GithubAuthProvider.PROVIDER_ID,
        //firebase.auth.PhoneAuthProvider.PROVIDER_ID
      ],
      requireDisplayName: false
      // tosUrl and privacyPolicyUrl accept either url string or a callback
      // function.
      // Terms of service url/callback.
      //tosUrl: '<your-tos-url>',
      // Privacy policy url/callback.
      //privacyPolicyUrl: '<your-privacy-policy-url>'
    };

    // Initialize the FirebaseUI Widget using Firebase.
    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    // The start method will wait until the DOM is loaded.
    ui.start('#firebaseui-auth-container', uiConfig);
  }
}
</script>

<style lang="less">
</style>
