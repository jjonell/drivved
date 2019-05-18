<template>
  <div class="popup playlist">
    <p><strong>Åtkomst till filer offline</strong></p>
    <label 
      v-for="(track, index) in tracks" 
      :key="index"
    >
      <span>{{ track.type }}</span>
      <input type="checkbox" v-model="track.selected">
      <i></i>
    </label>
    <button class="cancel" @click="$emit('close')">Avbryt</button>
    <button class="save" @click="save"><strong>Spara</strong></button>
  </div>
</template>

<script>
export default {
  props: ['store'],
  data () {
    return {
      tracks: []
    }
  },
  created () {
    this.tracks = this.store.currentSong.files.filter(file => (!!file.type && file.type !== 'Noter')).map(track => (Object.assign({ selected: false }, track)));
  },
  methods: {
    async save () {
      this.$emit('close');
      let song = this.store.currentSong;
      let tmpStorage = firebase.storage(); 
      let item = { id: song.id, tracks: [] }
      for (let i = 0; i < this.tracks.length; i++) {
        let track = this.tracks[i];
        if (track.selected) {
          let audioSrc = await tmpStorage.ref(song.id + '/' + track.file).getDownloadURL();
          let res = await fetch(audioSrc);
          let blob = await res.blob();
          if (navigator.userAgent.indexOf('iPhone') > -1 || navigator.userAgent.indexOf('iPad')) {
            item.ios = true;
            item.tracks.push({
              type: track.type,
              audio: await this.store.fileToBase64(blob)
            });
          }
          else {
            item.tracks.push({
              type: track.type,
              audio: blob
            });
          }
        }
      }
      let pdfSrc = this.store.sheetMusicUrl;
      let res = await fetch(pdfSrc);
      let blob = await res.blob();
      item.sheetmusic = await this.store.fileToBase64(blob);

      await localDb.playlist.put(item);
      this.isInPlaylist = true;
      this.store.playlist.push(this.store.currentSong.id);
    }
  }
}
</script>

<style lang="less">
.popup.playlist {
  label {
    display: flex;
    padding: 7px 0;
    border-top: .5px solid #b5b5b5;
    span { flex: 1; }
    input { display: none; }
    i {
      position: relative;
      display: inline-block;
      margin-right: .5rem;
      width: 46px;
      height: 26px;
      background-color: #e6e6e6;
      border-radius: 23px;
      vertical-align: text-bottom;
      transition: all 0.3s linear;
      &::before {
        content: "";
        position: absolute;
        left: 0;
        width: 42px;
        height: 22px;
        background-color: #fff;
        border-radius: 11px;
        transform: translate3d(2px, 2px, 0) scale3d(1, 1, 1);
        transition: all 0.25s linear;
      }
      &::after {
        content: "";
        position: absolute;
        left: 0;
        width: 22px;
        height: 22px;
        background-color: #fff;
        border-radius: 11px;
        box-shadow: 0 2px 2px rgba(0, 0, 0, 0.24);
        transform: translate3d(2px, 2px, 0);
        transition: all 0.2s ease-in-out;
      }
    }
    input:checked + i {
      background-color: #4BD763;
      &::before { transform: translate3d(18px, 2px, 0) scale3d(0, 0, 0); }
      &::after { transform: translate3d(22px, 2px, 0); }
    }
  }
  button {
    width: 50%;
    &.cancel { left: 0; border-right: .5px solid #b5b5b5; }
    &.save  { right: 0; }
  }
}
</style>
