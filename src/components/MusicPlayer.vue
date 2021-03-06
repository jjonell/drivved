<template>
  <div class="player" :class="{ editmode: store.editSheetMusic }">
    <div class="container" :class="{ maximized: !minimized }">
      <div class="header" @click="store.player.minimized = !store.player.minimized">
        <i class="icon" :class="{ 'ion-ios-arrow-up': minimized, 'ion-ios-arrow-down': !minimized }"></i>
        <span>{{ store.currentSong.title }}</span>
        <i 
          class="icon"
          :class="{ 'ion-ios-play': !store.player.playing, 'ion-ios-pause': store.player.playing }"
          @click.stop="store.audio.togglePlay()"
        ></i>
      </div>
      <sheet-music :height="vh" :store="store" />
      <div class="controls" :class="{ speedmode: isSpeedmode }" :style="{ top: vh }">
        <div>
          <div class="tracks" v-show="!store.editSheetMusic">
            <div>
              <a 
                v-for="track in tracks" 
                :key="track.type"
                :class="{ selected: (track.type === store.currentTrack)}"
                @click="store.audio.loadTrack(track)"
              >{{ track.type }}</a>
            </div>
          </div>
          <div class="timeline">
            <input type="range" v-model="progress" @change="seek($event.target.value)">
            <div class="edgelabel left">{{ currentTime }}</div>
            <div class="edgelabel right">{{ duration }}</div>
            <div class="progress"><div :style="{ width: progress + '%'} "></div></div>
          </div>
          <div class="buttons">
            <i 
              class="icon ion-ios-skip-backward" 
              @click="store.audio.skipPrevious()"
            ></i>
            <i class="icon ion-ios-rewind" @click="store.audio.seek(null, -5)"><span>-5&nbsp;sek</span></i>
            <i 
              class="toggleplay icon" 
              :class="{ 'ion-ios-play': !store.player.playing, 'ion-ios-pause': store.player.playing }"
              @click="store.audio.togglePlay()"
            ></i>
            <i class="icon ion-ios-fastforward" @click="store.audio.seek(null, 5)"><span>+5&nbsp;sek</span></i>
            <i 
              class="icon ion-ios-skip-forward" 
              @click="store.audio.skipNext()"
            ></i>
          </div>
          <div class="tools" v-show="!store.editSheetMusic">
            <button class="button smallbutton" @click="showFiles = true">Visa filer</button>
            <button class="button smallbutton" @click="togglePlaylist">{{ (isInPlaylist ? 'Ta bort från spellistan' : 'Lägg till i spellistan') }}</button>
            <button class="button smallbutton" @click="isSpeedmode = !isSpeedmode" :class="{ active: isSpeedmode }">Hastighet</button>
            <button class="button smallbutton desktopOnly" @click="store.editing = true;">Redigera</button>
            <button class="button smallbutton desktopOnly" @click="startNoteSync">Synka noter</button>
          </div>
          <div class="speedtools" v-show="isSpeedmode">
            <input type="range" v-model="speed" min="0" max="1" :step="1/speedsteps">
            <div class="edgelabel left">Långsamt</div>
            <div class="edgelabel right">Snabbt</div>
            <div class="ticks"><div v-for="step in speedsteps"></div></div>
          </div>
          <file-links v-if="showFiles" :store="store" @close="showFiles = false;" />
          <add-to-playlist v-if="showPlaylist" :store="store" @close="closeAddToPlaylist" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SheetMusic from './SheetMusic.vue'
import FileLinks from './FileLinks.vue'
import addToPlaylist from './addToPlaylist.vue'

export default {
  props: ['store'],
  components: { SheetMusic, FileLinks, addToPlaylist },
  data () {
    return {
      progress: 0,
      speed: 0.5,
      speedsteps: 6,
      vh: '100vh',
      isInPlaylist: false,
      isSpeedmode: false,
      showFiles: false,
      showPlaylist: false
    }
  },
  watch: {
    isSpeedmode () {
      this.speed = 0.5;
    },
    speed () {
      this.store.audioObj.playbackRate = 0.5 + parseFloat(this.speed);
    },
    'store.currentSong' () {
      this.isInPlaylist = (this.store.playlist.indexOf(this.store.currentSong.id) > -1);
      this.showFiles = false;
    },
    'store.player.currentTime' (time) {
      this.progress = Math.floor(100 * time / this.store.player.duration);
    }
  },
  methods: {
    closeAddToPlaylist(add) {
      this.showPlaylist = false;
      if (add) {
        this.isInPlaylist = true;
      }
    },
    seek (perc) {
      this.store.audio.seek(this.store.player.duration * (perc / 100));
    },
    timeToString (time) {
      let minutes = Math.floor(time / 60);
      let seconds = '0' + Math.floor(time - (minutes * 60));
      return minutes + ':' + seconds.slice(-2);
    },
    async togglePlaylist() {
      if (!this.isInPlaylist) {
        this.showPlaylist = true;
      }
      else {
        if (confirm('Är du säkert på att du vill ta bort den från din spellista?')) {
          this.isInPlaylist = false;
          let index = this.store.playlist.indexOf(this.store.currentSong.id);
          this.store.playlist.splice(index, 1);
          await localDb.playlist.delete(this.store.currentSong.id);
        }
      }
    },
    startNoteSync () {
      this.store.editSheetMusic = true;
      this.store.audio.pause();
      this.store.audio.seek(0);
      document.querySelector('.sheetmusic').scrollTop = 0;
    }
  },
  mounted () {
    const setHeight = () => {
      let controlsHeight = (window.innerHeight > 400) ? 230 : 0;
      this.vh = (window.innerHeight - controlsHeight) + 'px';
    }
    window.addEventListener('resize', setHeight);
    setHeight();
    this.isInPlaylist = (this.store.playlist.indexOf(this.store.currentSong.id) > -1);
  },
  computed: {
    minimized () {
      return this.store.player.minimized;
    },
    currentTime () {
      return this.timeToString(this.store.player.currentTime);
    },
    duration () {
      return this.timeToString(this.store.player.duration);
    },
    tracks () {
      if (!this.store.currentSong) { return []; }
      return this.store.currentSong.files.filter(file => (!!file.type && file.type !== 'Noter'));
    }
  }
}
</script>

<style lang="less">
@bg: #f7f7f7;
@primaryColor: #ea4e3d;
.player {
  height: 40px;
  text-align: center;
  .container {
    position: absolute;
    border-top: 0.5px solid #aeaeae;
    background-color: @bg;
    left: 0; right: 0; bottom: 56px; height: 39px;
    transition: bottom .5s cubic-bezier(.10, .70, .10, 1), height .5s cubic-bezier(.10, .70, .10, 1);
    overflow: hidden;
    &.maximized {
      bottom: 0;
      height: 100%;
      border-top: 0;
      .header {
        .icon:last-child { visibility: hidden; }
      }
      @media (max-height: 400px) {
        .header { display: none; }
      }
    }
  }
  .header {
    display: flex;
    align-items: center;
    border-bottom: 0.5px solid #aeaeae;
    height: 39px;
    span {
      font-size: 12px;
      flex: 1;
      margin: 0 5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .icon { 
      width: 38px;
      height: 38px;
      line-height: 38px;
    }
  }
  .tracks {
    display: inline-block;
    margin-bottom: 10px;
    background: #eae2e3;
    border-radius: 7px;
    overflow: hidden;
    font-size: 12px;
    div {
      display: flex;
      justify-content: center;
    }
    a {
      padding: 5px 10px;
      color: @primaryColor;
      &.selected {
        background-color: #eacfd3;
      }
    }
  }
  .controls {
    position: absolute;
    overflow: hidden;
    width: 100%;
    padding-top: 20px;
    margin-top: 37px;
    .timeline, .speedtools { position: relative; margin: 0 20px; }
    > div {
      transition: transform 0.3s;
    }
    &.speedmode {
      > div {
        transform: translateY(-55px);
      }
    }
    .timeline input {
      appearance: none; background: transparent; width: 100%; display: block; padding: 0; margin: 10px 0 20px; outline: none;
      position: relative;
      &::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        background: url('data:image/svg+xml;utf8,<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg"><circle r="5" cx="5" cy="5" fill="%23ea4e3d" /></svg>') 50% 50% no-repeat;
        border-radius: 50%;
        border: none;
        transform: translateY(-9px);
      }
      &::-webkit-slider-runnable-track {
        width: 100%;
        height: 2px;
        cursor: pointer;
        background: #ccc;
        border-radius: 3px;
      }
    }

    .progress, .ticks {
      position: absolute; left: 5px; right: 5px; top: 0; pointer-events: none;
    }
    .ticks { left: 10px; right: 10px; }
    .progress > div {
      background: @primaryColor; height: 2px;
    }
    .ticks {
      display: flex;
      > div {
        position: relative;
        flex: 1;
        border-right: 2px solid #aaa;
        margin-top: -4px;
        height: 10px;
        z-index: -1;
        &:first-child {
          border-left: 2px solid #aaa;
        }
      }
    }
    .edgelabel { 
      position: absolute; font-size: 12px; top: 10px;
      &::before {
        content: '';
        position: absolute; 
        top: -10px;
        height: 2px;
        width: 5px;
        background-color: @bg;
      }
      &.left { left: 5px; &::before { left: -5px; } }
      &.right { right: 5px; &::before { right: -5px; } }
    }
    .speedtools {
      margin-top: 20px;
      input {
        appearance: none; background: transparent; width: 100%; display: block; padding: 0; margin: 10px 0 20px; outline: none;
        position: relative;
        &::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: white;
          box-shadow: 0 3px 1px rgba(0, 0, 0, .1), 0 4px 8px rgba(0, 0, 0, .13), 0 0 0 1px rgba(0, 0, 0, .02);
          border-radius: 50%;
          border: none;
          transform: translateY(-9px);
        }
        &::-webkit-slider-runnable-track {
          width: 100%;
          height: 2px;
          cursor: pointer;
          background: #aaa;
          border-radius: 3px;
        }
      }
      .edgelabel {
        &::before {
          width: 10px;
        }
        
      }
    }
  }
  .buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 17px; margin-bottom: 20px; 
    .icon { 
      border-radius: 50%; width: 40px; line-height: 40px; position: relative; margin: 0 5px; 
      &:active { background-color: rgba(0, 0, 0, 0.1) }
    }
    .disabled { color: #bbb; background-color: transparent!important; }
    .toggleplay { 
      //border: 1px solid; 
      width: 40px; height: 40px; line-height: 40px; margin: 0 10px; 
      background-color: @primaryColor; color: white;
      &:active { background-color: #000; }
    }
    span { position: absolute; font-size: 10px; top: 17px; left: 50%; transform: translateX(-50%); font-style: normal; }
  }
  &.editmode {
    .controls {
      padding-top: 0;
      margin-top: 95px;
    }
  }
  .popup {
    position: fixed;
    z-index: 1;
    background: white;
    width: 300px;
    padding: 15px;
    padding-bottom: 60px;
    border-radius: 7px;
    text-align: left;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.4);
    button {
      appearance: none;
      position: absolute; 
      bottom: 0;
      border: 0;
      background: none;
      border-top: 1px solid #b5b5b5;
      color: #007aff;
      font-size: 17px;
      height: 44px;
      line-height: 43px;
    }
  }
}
</style>
