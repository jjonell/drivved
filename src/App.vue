<template>
  <div id="app">
    <div v-if="loading" class="loading">
      <div>
        <img src="/static/img/logga.png" width="150" height="120">
        Läser in...
      </div>
    </div>
    <template v-else>
      <login v-if="!isLoggedIn"></login>
      <template v-else>
        <router-view :store="store" />
        <music-player :store="store" v-if="store.currentSong" />
        <footer-tabs :store="store" />
        <edit-song :store="store" v-if="store.editing" />
      </template>
    </template>
  </div>
</template>

<script>
import audio from './assets/audio.js'
import Login from './components/Login'
import FooterTabs from './components/FooterTabs'
import MusicPlayer from './components/MusicPlayer'
import EditSong from './components/EditSong'
import SheetMusic from './components/SheetMusic'
export default {
  name: 'app',
  components: { Login, FooterTabs, MusicPlayer, EditSong, SheetMusic },
  data () {
    return {
      loading: true,
      isLoggedIn: false,
      store: {
        player: {
          minimized: true,
          duration: 0,
          currentTime: 0,
          seek: 0,
          playing: false
        },
        useremail: null,
        useradmin: false,
        useradmins: [],
        songs: [],
        playlist: [],
        collections: [
          /*
          { id: 7, label: 'Drivved pays Tribute', img: '', order: 7 },
          { id: 6, label: 'Gudstjänstlåtar', img: '', order: 6 },
          { id: 5, label: 'Luciasånger', img: 'lucia.jpg', order: 5 },
          { id: 4, label: 'Så mycket bättre', img: 'samycketbattre.jpg', nolabel: true, order: 4 },
          { id: 3, label: 'Rule Britannia', img: 'rulebritannia.jpg', nolabel: true, order: 3 },
          { id: 2, label: 'Drivved on Broadway', img: 'broadway.jpg', nolabel: true, order: 2 },
          { id: 1, label: 'Beatlemania', img: 'beatlemania.jpg', nolabel: true, order: 1 }
          */
        ],
        currentTrack: 'Arr',
        currentSong: null,
        currentSongList: null,
        songLoading: false,
        favourites: [],
        audio: audio,
        editing: false,
        editSheetMusic: false,
        fileToBase64: file => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.addEventListener("load", () => {
              resolve(reader.result);
            });
            reader.addEventListener("error", error => {
              reject(error);
            });
          });
        }
      }
    }
  },
  mounted () {
    //document.querySelector('.content > div').dispatchEvent(new Event('click'));
    firebase.auth().onAuthStateChanged(user => {
      this.loading = false;
      if (user) {
        this.isLoggedIn = true;
        this.store.useremail = user.email;
        this.store.useradmin = this.store.useradmins.indexOf(user.email) > -1;
      }
    });
  },
  beforeMount () {
    audio.init(this.store);
    
    // todo: refresh index
    window.localDb = new Dexie('drivved');
    localDb.version(1).stores({
        settings: 'id,value',
        songs: 'id,title,artist',
        playlist: 'id,track,audio,sheetmusic',
        collections: 'id,label,img,nolabel,order'
    });
    (async function(store) {
      let admins = await db.collection("settings").doc('admins').get();
      store.useradmins = admins.data().value;
      store.useradmin = store.useradmins.indexOf(store.useremail) > -1;
      //console.log(lastupdated.data().value);
      store.playlist = await localDb.playlist.toCollection().primaryKeys();
      //store.songs = await localDb.songs.toArray();
      if (store.songs.length === 0) {
        db.collection("songs").get().then(querySnapshot => {
          querySnapshot.forEach(song => {
            store.songs.push(Object.assign({}, { id: song.id }, song.data()));
          });
          localDb.songs.bulkPut(store.songs);
        });
      }
      db.collection("collections").get().then(querySnapshot => {
        querySnapshot.forEach(collection => {
          store.collections.push(Object.assign({}, { id: collection.id }, collection.data()));
        });
        store.collections.sort((a, b) => {
          if (a.order > b.order) { return -1; }
          if (a.order < b.order) { return 1; }
          return 0;
        });
      });
      
    })(this.store);
  }
}
</script>

<style lang="less">
.loading {
  background-color: white;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  img {
    display: block;
    margin-bottom: 30px;
  }
}
body {
  margin: 0;
  -webkit-tap-highlight-color: rgba(0,0,0,0);
  -webkit-tap-highlight-color: transparent; /* For some Androids */
}
body, button, input {
  font-family: Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
html, body, #app {
  height: 100%;
}
#app {
  color: #000;
  display: flex;
  flex-direction: column;
  background-color: #f7f7f7;
}
div {
  box-sizing: border-box;
}
a {
  text-decoration: none;
}
.page {
  flex: 1;
  position: relative;
}
header {
  text-align: center;
  border-bottom: 0.5px solid #aeaeae;
  background-color: #f7f7f7;
  line-height: 50px;
  font-weight: bold;
  a {
    position: absolute;
    font-weight: normal;
    color: #ea4e3d;
    &:first-child { left: 1rem; }
    &:last-child { right: 1rem; }
    .icon { font-size: 25px; }
  }
}
.content {
  background: white;
  position: absolute;
  top: 51px;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}
.button {
  appearance: none;
  border: 1px solid;
  font-size: 16px;
  width: 105px;
  line-height: 30px;
  padding: 0;
  margin: 0 5px;
  background: 0;
  border-radius: 3px;
  outline: none;
  &.primary, &.active {
    background-color: #ea4e3d;
    border-color: #ea4e3d;
    color: white;
  }
  &:disabled {
    color: #aaa;
  }
}
.smallbutton {
  font-size: 12px;
  line-height: 22px;
  min-width: 70px;
  padding: 0 5px;
  width: auto;
}
@media (min-width: 1025px) {
  body { background-color: #eee; }
  a, button { cursor: pointer; }
  #app { max-width: 1600px; margin: 0 auto; position: relative; box-shadow: 0 0 20px -10px black; }
  .page, footer { width: 375px; }
  .player {
    position: absolute;
    left: 375px;
    right: 0;
    z-index: 1;
    height: 100%!important;
    border-left: 1px solid #aeaeae;
    .header { display: none!important; }
  }
  .sheetmusic {
    box-sizing: content-box;
    padding-bottom: 37px;
    .tools { transform: translateY(37px); }
  }
}
@media (max-width: 1024px) {
   .desktopOnly { display: none!important; }
}
</style>
