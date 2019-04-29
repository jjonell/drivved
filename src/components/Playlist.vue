<template>
  <div class="page">
    <header>
      <span>{{ heading }}</span>
      <a v-if="isSorting" @click="changeDone"><strong>Klar</strong></a>
      <a v-else-if="($route.name === 'playlist') || (store.useradmin && $route.name === 'current')" @click="change">Ändra</a>
      <a class="desktopOnly" v-if="store.useradmin && $route.name === 'all'" @click="addSong">Lägg till</a>
    </header>
    <div class="content">
      <div class="searchcontainer" v-if="$route.name === 'all'">
        <i class="icon ion-ios-search"></i>
        <input v-model="searchword" placeholder="Sök">
      </div>
      <songlist :songs="songs" :store="store" :isSorting="isSorting" />
    </div>
  </div>
</template>

<script>
let sortable;
import Songlist from './Songlist'
export default {
  components: { Songlist },
  props: ['store'],
  name: 'playlist',
  data () {
    return {
      isSorting: false,
      searchword: ''
    }
  },
  mounted () {
    let container = document.querySelector('.content');
    container.addEventListener('touchstart', () => {
      if (container.scrollTop === 0) {
        container.scrollTop = 1;
      }
      else if (container.scrollHeight === container.scrollTop + container.offsetHeight) {
        container.scrollTop -= 1;
      }
    });
  },
  methods: {
    addSong () {
      this.store.player.minimized = true;
      this.store.editing = true;
      this.$nextTick(() => {
        this.store.player.minimized = false;
      });
    },
    change () {
      console.log('todo: re-order my playlist');
      this.isSorting = true;
      let container = document.querySelector('.songlist');
      sortable = Sortable.create(container, {
        animation: 150,
        touchStartThreshold: 4,
        handle: '.reorder',
        onUpdate: function (evt) {
          let children = document.querySelector('.songlist').children;
          for (let i = 0; i < children.length; i++) {
            let id = children[i].getAttribute('data-id');
            db.collection("songs").doc(id).update({ order: (children.length - i) });
          }
        },
      });
    },
    changeDone () {
      this.isSorting = false;
      sortable.destroy();
    },
    search () {
      if (!this.searchword) {
        return this.store.songs;
      }
      else {
        return this.store.songs.filter(song => (song.title.toLowerCase().indexOf(this.searchword.toLowerCase()) > -1 || song.artist.toLowerCase().indexOf(this.searchword.toLowerCase()) > -1));
      }
    }
  },
  computed: {
    songs () {
      switch (this.$route.name) {
        case 'current': return this.store.songs.filter(song => (!!song.order)).sort((a, b) => {
          if (a.order > b.order) { return -1; }
          if (a.order < b.order) { return 1; }
          return 0;
        });
        case 'playlist': return this.store.songs.filter(song => (this.store.playlist.indexOf(song.id) > -1));
        case 'all': return this.search().sort((a, b) => {
          if (a.title > b.title) { return 1; }
          if (a.title < b.title) { return -1; }
          return 0;
        });
      }
      return []
    },
    heading () {
      switch (this.$route.name) {
        case 'current': return 'Aktuella låtar';
        case 'playlist': return 'Min spellista';
        case 'all': return 'Alla låtar';
      }
      return 'Error';
    }
  }
}
</script>

<style lang="less">
.searchcontainer {
  display: flex;
  margin-left: 18px;
  background-color: white;
  min-height: 45px;

  margin-top: 10px;
  border-bottom: 0.5px solid #aeaeae;
  position: relative;
  padding: 0 10px 10px 0;
  .icon {
    position: absolute; 
    top: 8px;
    left: 18px;
    padding: 0;
    font-size: 18px;
    pointer-events: none;
  }
  input {
    width: 100%;
    border: 0;
    box-sizing: border-box;
    font-size: 14px;
    line-height: 22px;
    padding: 0 8px;
    background: #e8e8ea;
    border-radius: 5px;
    padding-left: 40px;
    outline: none;
  }
}
</style>
