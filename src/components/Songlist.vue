<template>
  <div class="songlist" :class="{ sortable: isSorting }">
    <div 
      v-for="song in songs" 
      :key="song.id" 
      :data-id="song.id"
      :class="{ selected: (store.currentSong && store.currentSong.id === song.id) }"
    >
      <i class="icon ion-ios-remove-circle remove" @click="remove(song)"></i>
      <div @click="play(song)">
        {{ song.title }}
        <span>{{ song.artist }}</span>
      </div>
      <i class="icon ion-ios-reorder reorder"></i>
    </div>
  </div>
</template>

<script>
export default {
  props: ['songs', 'store', 'isSorting'],
  data () {
    return {
      
    }
  },
  methods: {
    play (song) {
      this.store.audio.pause();
      this.store.audio.seek(0);
      this.store.currentSong = song;
      this.store.audio.loadSong();
      this.$nextTick(() => {
        this.store.player.minimized = false;
      });

      // save the current songlist to make the prev/next buttons work
      let children = this.$el.children;
      this.store.currentSongList = [];
      for (let i = 0; i < children.length; i++) {
        this.store.currentSongList.push(children[i].getAttribute('data-id'));
      }
    },
    async remove (song) {
      if (this.$route.name === 'playlist') {
        if (confirm('Är du säkert på att du vill ta bort den från din spellista?')) {
          await localDb.playlist.delete(song.id);
          let index = this.store.playlist.findIndex(id => (song.id));
          this.store.playlist.splice(index, 1);
        }
      }
      else if (this.store.useradmin && this.$route.name === 'current') {
        alert('Not implemented');
        // kryssa bort från "aktuella"
      }
      
      /*
      await localDb.playlist.delete(this.store.currentSong.id);
      this.isInPlaylist = false;
      let index = this.store.playlist.findIndex(id => (this.store.currentSong.id));
      this.store.playlist.splice(index, 1);
      */
    }
  }
}
</script>

<style lang="less">
.songlist {
  > div {
    display: flex;
    margin-left: 18px;
    transition: margin-left 0.3s;
    border-bottom: 0.5px solid #ccc;
    background-color: white;
    min-height: 45px;
    > div {
      font-weight: bold;
      padding: 8px 0;
      flex: 1;
      span { 
        display: block; 
        font-weight: normal; 
        font-family: 'Crimson Text';
        font-style: italic;
      }
    }
    &:last-child {
      margin-bottom: -1px;
    }
    &.selected {
      color: #ea4e3d;
    }
  }
  .icon {
    font-size: 22px;
    padding: 15px;
  }
  .remove {
    margin-left: -51px;
    width: 51px;
    box-sizing: border-box;
    color: #ea4e3d;
  }
  .reorder {
    opacity: 0;
    color: #aaa;
    transition: opacity 0.3s;
  }
  &.sortable {
    > div {
      margin-left: 48px;
    }
    .reorder {
      opacity: 1;
    }
  }
  &.search {
    top: 100px;
  }
}
</style>
