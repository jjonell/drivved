<template>
  <div class="page collections">
    <div class="subpage first" :class="{ slide: colopen }">
      <header>
        <a class="desktopOnly" v-if="store.useradmin && editmode" @click="addCollection">Lägg till</a>
        <span>Samlingar</span>
        <a class="desktopOnly" v-if="store.useradmin && !editmode" @click="editCollections">Ändra</a>
        <a class="desktopOnly" v-else-if="store.useradmin" @click="closeEdit"><strong>Klar</strong></a>
      </header>
      <div v-if="editmode" class="content">
          <div 
            v-for="(col, index) in store.collections" 
            :key="col.id"
            :data-id="col.id"
            class="img editmode"
            :style="col.img ? 'background-image: url(' + col.img + ')' : ''"
          >
            <div>
              <i class="icon ion-ios-remove-circle remove" @click="removeCollection(col.id, index)"></i>
              <input v-model="col.label" @change="updateLabel(col.id, col.label)" />
              <i class="icon ion-ios-reorder reorder"></i>
              <span
                class="droparea"
                :class="{ drophighlight: drophighlight }"
                @dragover.prevent="drophighlight = true"
                @dragleave="drophighlight = false"
                @drop.prevent="drop(col.id, index, $event)"
              >
                Byt bild genom att dra-och-släppa här (storlek 734x374 px)
              </span>
              <button :disabled="!col.img" class="button smallbutton" @click="removeImg(col.id, index)">Ta bort bakgrundsbild</button>
            </div>
          </div>
      </div>
      <div v-else class="content">
        <a 
          v-for="col in store.collections" 
          :key="col.id"
          class="img"
          :style="col.img ? 'background-image: url(' + col.img + ')' : ''"
          @click="openCollection(col)"
        >
          <span v-if="!col.nolabel">{{ col.label }}</span>
        </a>
      </div>
    </div>
    <div class="subpage next" :class="{ slide: colopen }">
      <template v-if="col">
        <header>
          <a @click="closeCollection"><i class="icon ion-ios-arrow-back"></i></a>
          <span>{{ col.label }}</span>
          <a v-if="store.useradmin && !isSorting" @click="editCollection">Ändra</a>
          <a v-else-if="store.useradmin" @click="closeEditCollection"><strong>Klar</strong></a>
        </header>
        <div class="content">
          <div class="img" :style="col.img ? 'background-image: url(' + col.img + ')' : ''"></div>
          <songlist :songs="songs" :store="store" :isSorting="isSorting" />
        </div>
      </template>
    </div>
  </div>
</template>

<script>
let sortable;
import Songlist from './Songlist'
export default {
  components: { Songlist },
  props: ['store'],
  data () {
    return {
      editmode: false,
      col: null,
      colopen: false,
      drophighlight: false,
      isSorting: false
    }
  },
  methods: {
    removeCollection (id, index) {
      this.store.collections.splice(index, 1);
      db.collection("collections").doc(id).delete();
    },
    addCollection() {
      let nextId = this.store.collections.length + 1;
      let collection = {
        label: 'Ny samling',
        img: '',
        order: nextId
      };
      db.collection("collections").add(collection).then(ref => {
        collection.id = ref.id;
        this.store.collections.unshift(collection);
      });
    },
    updateLabel (id, label) {
      db.collection("collections").doc(id).update({ label: label });
    },
    editCollections () {
      this.editmode = true;
      this.$nextTick(() => {
        let container = document.querySelector('.content');
        sortable = Sortable.create(container, {
          animation: 150,
          touchStartThreshold: 4,
          handle: '.reorder',
          onUpdate: (evt) => {
            let children = container.children;
            let length = children.length;
            for (let i = 0; i < length; i++) {
              let id = children[i].getAttribute('data-id');
              let newOrder = (length - i);
              this.store.collections.find(col => (col.id === id)).order = newOrder;
              db.collection("collections").doc(id).update({ order: newOrder });
            }
            this.store.collections.sort((a, b) => {
              if (a.order > b.order) { return -1; }
              if (a.order < b.order) { return 1; }
              return 0;
            });
          },
        });
      });
    },
    editCollection() {
      this.isSorting = true;
      let container = document.querySelector('.songlist');
      sortable = Sortable.create(container, {
        animation: 150,
        touchStartThreshold: 4,
        handle: '.reorder',
        onUpdate: (evt) => {
          let children = document.querySelector('.songlist').children;
          for (let i = 0; i < children.length; i++) {
            let id = children[i].getAttribute('data-id');
            let update = {}
            update['collections.' + this.col.id] = i;
            db.collection("songs").doc(id).update(update);
          }
        },
      });
    },
    closeEdit () {
      sortable.destroy();
      this.editmode = false;
    },
    closeEditCollection () {
      sortable.destroy();
      this.isSorting = false;
    },
    openCollection(col) {
      this.col = col;
      this.colopen = true;
    },
    closeCollection(col) {
      this.colopen = false;
    },
    drop (id, index, event) {
      this.drophighlight = false;
      let reader = new FileReader();
      reader.addEventListener("load", (event) => {
        let img = event.target.result;
        let collection = this.store.collections[index];
        collection.img = img;
        collection.nolabel = true;
        db.collection("collections").doc(id).update({ img: img, nolabel: true });
      }); 
      let item = event.dataTransfer.items[0];
      if (item && item.type.startsWith('image')) {
        reader.readAsDataURL( item.getAsFile() );
      }
      else {
        alert('Endast en bildfil kan laddas upp här');
      }
    },
    removeImg (id, index) {
      let collection = this.store.collections[index];
      collection.img = '';
      collection.nolabel = false;
      db.collection("collections").doc(id).update({ img: '', nolabel: false });
    }
  },
  mounted () {
    //console.log(this.$route.params.id);
  },
  computed: {
    songs () {
      return this.store.songs.filter(song => (song.collections && (song.collections[this.col.id] !== undefined))).sort((a, b) => {
        let aOrder = a.collections[this.col.id];
        let bOrder = b.collections[this.col.id];
        if (aOrder < bOrder) { return -1; }
        if (aOrder > bOrder) { return 1; }
        return 0;
      });
    }
  }
}
</script>

<style lang="less">
.collections {
  overflow: hidden;
  .subpage {
    transition: transform .3s ease-in-out;
    height: 100%;
    width: 100%;
    position: absolute;
    &.first.slide {
      transform: translateX(-50%);
    }
    &.next {
      left: 100%;
      &.slide {
        opacity: 1;
        box-shadow: 0 0 20px -10px black;
        transform: translateX(-100%);
      }
    }
  }
  .img {
    background: #ccc url(/static/img/generic.jpg) 50% 50% no-repeat;
    background-size: cover;
    display: block;
    padding-bottom: 47%;
    position: relative;
    > span, div {
      position: absolute;
      z-index: 1;
    }
    > span {
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      left: 0; right: 0;
      text-align: center;
      font-size: 33px;
      font-family: Lobster, Serif;
      color: white;
    }
    div {
      width: 70%;
      left: 15%;
      top: 10%;
      color: black;
      .droparea {
        font-size: 13px;
        color: #999;
        display: block;
        border: 1px dashed;
        margin-top: 1rem;
        padding: 0.5rem;
        text-align: center;
        &.drophighlight {
          border-color: #aaa;
          background: #ddd;
        }
      }
    }
    button {
      margin: 1rem auto;
      display: block;
      padding: 0 0.5rem;
    }
    input {
      background: none;
      border: none;
      font-size: 20px;
      border-bottom: 1px solid black;
      padding: 5px 0;
      margin: 0;
      width: 100%;
    }
    &.editmode {
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
      }
    }
    .icon {
      font-size: 28px;
      padding: 15px;
      position: absolute;
      box-sizing: border-box;
      top: -15px;
    }
    .remove {
      left: -51px;
      width: 51px;
      color: #ea4e3d;
    }
    .reorder {
      right: -51px;
      width: 51px;
      color: black;
      transition: opacity 0.3s;
    }
  }
  .first {
    .img {
      margin: 1rem;
      border-radius: 3px;
    }
  }
  .next {
    .img {

    }
  }
}
</style>
