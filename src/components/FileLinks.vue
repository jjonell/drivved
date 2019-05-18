<template>
  <div class="popup files">
    <p><strong>Filer</strong></p>
    <p v-for="(file, index) in files" :key="index">
      <a :href="file.url" target="_blank">{{ file.file }}</a>
    </p>
    <button @click="$emit('close')">Stäng</button>
  </div>
</template>

<script>
export default {
  props: ['store'],
  data () {
    return {
      files: []
    }
  },
  created () {
    let song = this.store.currentSong;
    let tmpStorage = firebase.storage(); 
    let files = JSON.parse(JSON.stringify(song.files));
    files.forEach(file => {
      file.url = '';
      tmpStorage.ref(song.id + '/' + file.file).getDownloadURL().then(url => {
        file.url = url;
      });
    });
    this.files = files;
  }
}
</script>

<style lang="less">
.popup.files button {
  left: 0;
  width: 100%;
}
</style>
