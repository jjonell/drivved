<template>
  <div class="sheetmusic" :class="{ sync: isSyncing }" :style="{ height: height }" @mousemove="sheethover" @scroll="onscroll($event.target)">
    <div class="canvaswrapper" :style="{ width: width + 'px' }" @click="canvasclick"></div>
    <div class="tools">
      <div class="thumbs">
        <div 
          v-for="index in numPages" 
          :key="index" 
          :class="{ selected: (index === pageIndex) }"
          @click="scrollTo(index)"
        >{{ index }}</div>
      </div>
      <i class="icon zoomout ion-ios-search" @click="zoomout"></i>
      <i class="icon zoomin ion-ios-search" @click="zoomin"></i>
    </div>
    <div class="loading" v-show="loading || missing">
      <span v-if="missing">Noter saknas</span>
      <span v-else>Läser in...</span>
    </div>
    <template v-if="store.editSheetMusic">
      <div class="editline" :style="{ top: editPos + 'px' }"></div>
      <div class="editsheet">
        <div class="sheetmarks">
          <div 
            v-for="(mark, index) in tmpSheetMarks" 
            :key="index"
            :style="{ left: (mark.ts * 100 / store.player.duration) + '%' }"
          >
            <div>
              <label><span>Tid:</span><input v-model="mark.ts"></label>
              <label><span>Topp:</span><input v-model="mark.top"></label>
            </div>
            <i class="icon ion-ios-pin"></i>
          </div>
        </div>
        <button class="button smallbutton" @click="store.editSheetMusic = false;">Avbryt</button>
        <button class="button smallbutton primary" @click="saveSheetMusic">Spara</button>
      </div>
    </template>
  </div>
</template>

<script>
let canvaswrapper;
export default {
  props: ['height', 'store'],
  data () {
    return {
      numPages: 0,
      ready: false,
      loading: true,
      missing: false,
      width: 750 * 2,
      deviceWidth: null,
      lastTop: 0,
      isSyncing: false,
      editPos: 0,
      scale: 1,
      tmpSheetMarks: [],
      pageIndex: 1
    }
  },
  methods: {
    onscroll (target) {
      let sheets = canvaswrapper.children;
      let top = 0;
      for (let i = 0; i < sheets.length; i++) {
        let height = sheets[i].height * this.scale / 2;
        if (top + (height / 2) > target.scrollTop) {
          this.pageIndex = i + 1;
          break;
        }
        top += height;
      }
    },
    scrollTo (index) {
      let sheet = canvaswrapper.children[index - 1];
      this.$el.scrollTop = sheet.offsetTop / 2;
    },
    async printSheetMusic () {
      this.loading = true;
      this.missing = false;
      canvaswrapper = this.$el.firstElementChild;
      canvaswrapper.innerHTML = '';
      this.numPages = 0;
      const loadPdf = (url) => {
        pdfjsLib.getDocument(url).promise.then(pdf => {
          this.numPages = pdf.numPages;
          printPage(1, pdf);
        });
      }
      let sheetMusicFile = this.store.currentSong.files.find(file => (file.type === 'Noter'));
      if (sheetMusicFile) {
        let blob;
        if (this.store.playlist.indexOf(this.store.currentSong.id) > -1) {
          let dbItem = await localDb.playlist.get(this.store.currentSong.id);
          blob = dbItem.sheetmusic;
        }
        if (blob) {
          loadPdf(blob);
        }
        else {
          console.log('get sheet music pdf from firebase');
          firebase.storage().ref(this.store.currentSong.id + '/' + sheetMusicFile.file).getDownloadURL().then(url => {
            this.store.sheetMusicUrl = url;
            loadPdf(url);
          });
        }
      }
      else {
        this.loading = false;
        this.missing = true;
      }
      const printPage = (pageNo, pdf) => {
        let canvas = document.createElement('canvas');
        canvas.width = this.width;
        let ctx = canvas.getContext('2d');
        canvaswrapper.appendChild(canvas);
        pdf.getPage(pageNo).then(page => {
          let scale = this.width / page.getViewport({ scale: 1 }).width;
          let viewport = page.getViewport({ scale: scale });
          canvas.height = viewport.height;
          var renderContext = {
              canvasContext: ctx,
              viewport: viewport
          };
          page.render(renderContext).promise.then(() => {
              if (pageNo < this.numPages) {
                printPage(pageNo + 1, pdf);
              }
              else {
                this.loading = false;
                this.ready = true;
                this.startSlide();
              }
          });
        });
      }
    },
    startSlide () {
      let topStep, nextTop;
      let topSteps = 20;
      let sheetMarks = this.store.currentSong.sheetMarks;
      if (!sheetMarks) { return; }
      const slide = () => {
        if (!this.store.player.playing || this.store.editSheetMusic) { return; }
        let leftStop = (this.width / 2) - this.deviceWidth;
        if (nextTop) {
          this.lastTop += topStep;
          topSteps--;
          this.$el.scrollTop = this.lastTop;
          let leftPerc = 1.1 - ((20 - topSteps) / 20); 
          this.$el.scrollLeft = leftPerc * leftStop;
          if (nextTop < this.lastTop) {
            this.lastTop = nextTop;
            nextTop = false;
            topSteps = 20;
          }
        }
        else {
          let currentTime = this.store.audioObj.currentTime;
          let index = sheetMarks.findIndex(mark => (mark.ts > currentTime));
          if (index < 0) { return; }
          if (this.lastTop !== sheetMarks[index - 1].top * this.scale) {
            nextTop = sheetMarks[index - 1].top * this.scale;
            topStep = (nextTop - this.lastTop) / 20;
          }
          else {
            let span = sheetMarks[index].ts - sheetMarks[index - 1].ts;
            let leftPerc = currentTime - sheetMarks[index - 1].ts;
            this.$el.scrollLeft = leftStop * leftPerc / span;
            this.$el.scrollTop = sheetMarks[index - 1].top * this.scale;
          }
        }
        requestAnimationFrame(slide);
      }
      requestAnimationFrame(slide);
    },
    sheethover (event) {
      if (this.store.editSheetMusic) {
        this.editPos = event.clientY + this.$el.scrollTop;
      }
    },
    canvasclick (event) {
      if (!this.store.editSheetMusic) { return; }
      let top = this.$el.scrollTop + event.clientY;
      if (this.tmpSheetMarks.length === 0) {
        this.tmpSheetMarks.push({ ts: 0, top: top });
      }
      else {
        this.tmpSheetMarks.push({ ts: this.store.audioObj.currentTime, top: top });
      }
      if (!this.store.player.playing) {
        this.store.audio.play();
      }
      /*
      if (!this.store.player.playing) {
        this.tmpSheetMarks = [{ ts: 0, top: top }];
        this.store.audio.play();
      }
      else {
        this.tmpSheetMarks.push({ ts: this.store.audioObj.currentTime, top: top });
      }
      */
    },
    saveSheetMusic () {
      this.store.editSheetMusic = false;
      this.store.currentSong.sheetMarks = JSON.parse(JSON.stringify(this.tmpSheetMarks));
      db.collection('songs').doc(this.store.currentSong.id).set(this.store.currentSong);
    },
    zoomin () {
      this.width *= 1.05;
      this.scale = this.width / (750 * 2);
    },
    zoomout () {
      this.width *= 1/1.05;
      this.scale = this.width / (750 * 2);
    }
  },
  watch: {
    'store.currentSong' () {
      this.printSheetMusic();
    },
    'store.editSheetMusic' () {
      this.tmpSheetMarks = JSON.parse(JSON.stringify(this.store.currentSong.sheetMarks || []));
    },
    'store.player.playing' () {
      this.isSyncing = this.store.player.playing && !this.store.editSheetMusic && this.store.currentSong.sheetMarks;
      if (this.ready) {
        this.startSlide();
      }
    }
  },
  mounted () {
    if (screen.availWidth < 1024 && screen.availHeight < 1024) {
      this.width = Math.max(screen.availWidth, screen.availHeight) * 2;
      this.scale = this.width / (750 * 2);
    }
    window.addEventListener('resize', () => {
      this.deviceWidth = window.innerWidth;
    });
    this.deviceWidth = window.innerWidth;
    this.printSheetMusic();
  }
}
</script>

<style lang="less">
.editline {
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  height: 1px;
  background-color: black;
  display: none;
  pointer-events: none;
}
.sheetmusic:hover {
  .editline {
    display: block;
  }
}
.sheetmusic {
  background: #fff;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
  &.sync {
    overflow: hidden;
    -webkit-overflow-scrolling: initial;
  }
  canvas {
    display: block;
    width: 100%;
  }
  .tools {
    position: sticky;
    background-color: rgba(255, 255, 255, 0.95);
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    border-top: 0.5px solid #aeaeae;
    border-bottom: 0.5px solid #aeaeae;
    .icon {
      position: absolute;
      bottom: 5px;
      font-size: 30px;
      color: #00838f;
      z-index: 1;
      height: 30px;
      line-height: 30px;
      width: 30px;
      &:after {
        position: absolute;
        font-style: normal;
        font-size: 18px;
      }
    }
    
  }
  .thumbs {
    display: flex;
    justify-content: center;
    padding-top: 5px;
    text-align: center;
    > div {
      color: #aeaeae;
      width: 21px; height: 30px; border: 0.5px solid;
      font-size: 12px; line-height: 30px;
      background-color: white;
      margin-left: 5px;
      &.selected { color: #ea4e3d; }
    }
  }
  .zoomout { 
    right: 45px; 
    &:after {
      content: '\02013';
      top: -3px;
      left: 7px;
    }
  }
  .zoomin { 
    right: 10px; 
    &:after {
      content: '+';
      top: -3px;
      left: 7px;
    }
  }
}
.canvaswrapper {
  transform: scale(0.5);
  transform-origin: 0 0;
}
.loading {
  background: white;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
.editsheet {
  position: fixed;
  bottom: 15px;
  left: 0;
  right: 0;
  margin-left: 375px;
  button {
    margin-top: 15px;
  }
}
.sheetmarks {
  width: 1174px;
  margin: 0 auto 92px;
  position: relative;
  > div {
    position: absolute;
    color: #999;
    top: 0;
    text-align: center;
    > div {
      display: none;
      position: absolute;
      background: white;
      box-shadow: 0 3px 1px rgba(0, 0, 0, .1), 0 4px 8px rgba(0, 0, 0, .13), 0 0 0 1px rgba(0, 0, 0, .02);
      width: 100px;
      height: 60px;
      top: -63px;
      margin-left: -50px;
      &:after {
        content: '';
        position: absolute;
        width: 10px;
        height: 10px;
        background: white;
        transform: rotateZ(45deg);
        bottom: -5px;
        left: 45px;
      }
    }
    &:hover, &:focus-within {
      > div {
        display: block;
      }
    }
  }
  label { 
    display: flex;
    align-items: center;
    text-align: right;
    padding-top: 5px;
    span { 
      width: 35px;
      color: black;
      font-size: 12px;
      padding-right: 3px;
    }
    input { 
      width: 50px;
      border: 1px solid #aaa;
    }
  }
  .icon {
    font-size: 22px;
    width: 40px;
    text-align: center;
    display: block;
    margin-left: -19px;
  }
}
</style>
