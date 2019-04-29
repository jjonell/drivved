<template>
  <div class="editsong" :class="{ visible: visible }">
    <header>{{ (mode === 'add') ? 'Lägg till låt' : 'Redigera låt' }}</header>
    <div class="form">
      <div>
        <label class="control">
          <span>Titel:</span>
          <input class="textfield" v-model="song.title">
        </label>
        <label class="control">
          <span>Artist:</span>
          <input class="textfield" v-model="song.artist">
        </label>
        <label class="control">
          <span>Aktuell:</span>
          <input type="checkbox" class="checkbox" v-model="current">
        </label>
        <div class="control">
          <span>Samlingar:</span>
          <div class="checkboxes">
            <label v-for="col in store.collections" :key="col.id">
              <input type="checkbox" v-model="song.collections" :value="col.id"><span>{{ col.label }}</span>
            </label>
          </div>
        </div>
      </div>
      <div>
      <table>
        <thead>
          <tr>
            <th>Filer</th>
            <th>Typ</th>
            <th>&nbsp;</th>
          </tr>
        </thead>
        <tbody id="filelist">
          <tr v-for="(file, index) in song.files" :key="file.file">
            <td><i class="icon ion-ios-remove-circle" @click="deleteFile(index)"></i>{{ file.file }}</td>
            <td>
              <input v-model="file.type" class="textfield">
            </td>
            <td><i class="icon ion-ios-reorder reorder"></i></td>
          </tr>
        </tbody>
      </table>
      <div v-if="song.files.length === 0" class="empty">(Inga filer)</div>
      
      <div 
        class="droparea"
        :class="{ drophighlight: drophighlight }"
        @dragover.prevent="drophighlight = true"
        @dragleave="drophighlight = false"
        @drop.prevent="drop"
      >Dra och släpp filer hit</div>
      </div>
    </div>
    <div class="footer">
      <button class="button" @click="remove" v-if="mode === 'edit'">Radera</button>
      <button class="button" @click="hide">Avbryt</button>
      <button class="button primary" @click="save">Spara</button>
    </div>
  </div>
</template>

<script>
function array_move(arr, old_index, new_index) {
    while (old_index < 0) {
        old_index += arr.length;
    }
    while (new_index < 0) {
        new_index += arr.length;
    }
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
};

export default {
  name: 'editsong',
  props: ['store'],
  data () {
    return {
      mode: '',
      visible: false,
      drophighlight: false,
      current: false,
      song: {},
      uploads: [],
      deletions: []
    }
  },
  created () {
    if (this.store.player.minimized) {
      this.mode = 'add';
      this.song = {
        files: [],
        collections: []
      };
    }
    else {
      this.mode = 'edit';
      this.song = JSON.parse(JSON.stringify(this.store.currentSong));
      if (this.song.order) {
        this.current = true;
      }
      if (!this.song.collections) {
        this.song.collections = [];
      }
      else {
        this.song.collections = Object.keys(this.song.collections);
      }
    }
  },
  mounted () {
    setTimeout(() => { this.visible = true; }, 100);
    let sortable = Sortable.create(document.getElementById('filelist'), {
      animation: 150,
      touchStartThreshold: 4,
      handle: '.reorder',
      onUpdate: (evt) => {
        array_move(this.song.files, evt.oldIndex, evt.newIndex);
      },
    });
  },
  methods: {
    hide () {
      this.visible = false;
      setTimeout(() => { 
        this.store.editing = false; 
      }, 500);
    },
    drop (event) {
      this.drophighlight = false;
      let itemsToProcess = 0;
      const isFinished = () => {
        if (itemsToProcess === 0) {
          this.song.files.sort((a, b) => {
            if (!this.trackTypes[a.type] && !!this.trackTypes[b.type]) { return 1; }
            if (!!this.trackTypes[a.type] && !this.trackTypes[b.type]) { return -1; }
            if (this.trackTypes[a.type] > this.trackTypes[b.type]) { return 1; }
            if (this.trackTypes[a.type] < this.trackTypes[b.type]) { return -1; }
            return 0;
          });
				}
      };
      let nameEndings = {
        ARR: 'Arr',
        INSTRUMENTAL: 'Instrumental'
      };
      ['SOP', 'ALT', 'TEN', 'BAS'].forEach(item => {
        let name = item[0] + item.substring(1).toLowerCase();
        name = name.replace('Sop', 'Sopran').replace('Ten', 'Tenor');
        nameEndings[item] = name;
        nameEndings[item + '1'] = name + ' 1';
        nameEndings[item + '2'] = name + ' 2';
      });
      const traverseFileTree = (entry) => {
        itemsToProcess++;
        if (entry.isFile) {
          entry.file(file => {
            this.uploads.push(file);
            let type = '';
            if (file.name.endsWith('.pdf')) {
              type = 'Noter';
            }
            else if (file.type.startsWith('audio')) {
              let nameEnding = file.name.split(' ').pop().split('.').shift();
              type = nameEndings[nameEnding] || '';
            }
            this.song.files.push({
              file: file.name,
              type: type
            });
            itemsToProcess--;
					  isFinished();
          });
				}
				else if (entry.isDirectory) {
					let dirReader = entry.createReader();
					dirReader.readEntries(entries => {
						entries.forEach(entry => {
							traverseFileTree(entry);
						})
						itemsToProcess--;
						isFinished();
					});
        }
      }
      let items = event.dataTransfer.items;
      for (var i = 0; i < items.length; i++) {
        let entry = items[i].webkitGetAsEntry() || items[i].getAsEntry();
        if (entry) {
          if (!this.song.title) {
            this.song.title = entry.name;
          }
          traverseFileTree(entry);
        }
      }
    },
    deleteFile (index) {
      this.song.files.splice(index, 1);
    },
    save () {
      const saveFiles = (id) => {
        let storage = firebase.storage();
        let storageRef = storage.ref();
        this.uploads.forEach(file => {
          let songRef = storageRef.child(id + '/' + file.name);
          songRef.put(file).then((snapshot) => {});
        })
      }
      if (this.current) {
        if (!this.song.order) {
          let max = 0;
          this.store.songs.filter(song => (!!song.order)).forEach(song => {
            max = Math.max(song.order, max);
          })
          this.song.order = max + 1;
        } 
      }
      else {
        delete this.song.order;
      }
      if (this.mode === 'add') {
        let collections = {};
        this.song.collections.forEach(col => {
          // todo: change this to count index
          collections[col] = 0;
        });
        this.song.collections = collections;
        db.collection("songs").add(this.song).then(ref => {
          saveFiles(ref.id);
        });
        this.store.songs.push(this.song);
      }
      else {
        let collections = {};
        this.song.collections.forEach(col => {
          let index = (this.store.currentSong.collections || {})[col];
          if (index !== 0 && !index) {
            index = this.nextCollectionOrder(col);
          }
          collections[col] = index;
        });
        this.song.collections = collections;
        
        let id = this.song.id;
        let index = this.store.songs.findIndex(song => (song.id === id));
        this.$set(this.store.songs, index, this.song);
        db.collection("songs").doc(id).set(this.song).then(() => {
            saveFiles(id);
        })
      }
      this.hide();
    },
    remove () {
      if (confirm('Är du säker att du vill radera ' + this.song.title)) {
        db.collection("songs").doc(this.song.id).delete();
        let storage = firebase.storage();
        let storageRef = storage.ref();
        let folderRef = storageRef.child(this.song.id).delete().then(function() {
            console.log('success');
          }).catch(function(error) {
            console.log(error);
          });
        folderRef.delete();
        this.hide();
      }
    },
    nextCollectionOrder (id) {
      return this.store.songs.filter(song => (song.collections && (song.collections[id] !== undefined))).length || 0;
    }
  },
  computed: {
    trackTypes () {
      let types = { Arr: 1, Instrumental: 2 };
      let index = 3;
      ['Sopran', 'Alt', 'Tenor', 'Bas'].forEach(item => {
        types[item] = index++;
        types[item + ' 1'] = index++;
        types[item + ' 2'] = index++;
      });
      types.Noter = index++;
      return types;
    }
  }
}
</script>

<style lang="less">
.editsong {
  opacity: 0;
  transition: opacity 0.3s, transform 0.3s;
  position: absolute;
  z-index: 2;
  left: 50%;
  transform: scale(0.9);
  width: 748px;
  margin-left: -374px;
  top: 100px;
  background-color: #f7f7f7;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.2);
  input { font-size: 16px; }
  &.visible {
    opacity: 1;
    transform: scale(1);
  }
  .form {
    padding: 10px 20px;
    display: flex;
    > div {
      flex: 1;
    }
  }
  .control {
    display: flex;
    margin: 10px 0;
    > span { 
      width: 80px;
      text-align: right;
      padding-right: 10px;
      padding-top: 5px;
    }
    .checkbox {
      height: 26px;
    }
    .checkboxes {
      padding: 7px 0;
      label {
        display: block;
        padding: 2px 5px;
      }
    }
  }
  .checkboxes, .textfield {
    box-sizing: border-box;
    width: 250px;
    background: white;
    border: 1px solid #ccc;
    &:focus {
      border-color: #ea4e3d;
    }
  }
  .textfield {
    padding: 0 10px;
    margin: 0;
    appearance: none;
    line-height: 30px;
    outline: none;
  }
  table {
    border-collapse: collapse;
    width: 100%;
  }
  th, td {
    padding: 10px 0;
    font-size: 14px;
    text-align: left;
  }
  td {
    height: 32px;
    border-top: 1px solid #ccc;
    .icon { font-size: 18px; }
    &:first-child .icon { margin-right: 5px; color: #ea4e3d; cursor: pointer; }
    &:last-child .icon { margin-left: 10px; }
    .textfield { 
      width: 70px; 
      font-size: 14px;
      padding: 0 5px;
    }
    a { display: block; padding-top: 1px; color: #ea4e3d; cursor: pointer; }
  }
  .empty { color: #aaa; padding-bottom: 20px; }
  .footer {
    display: flex;
    justify-content: center;
    padding: 15px 0;
    border-top: 0.5px solid #aeaeae;
  }
}
.droparea {
  border: 1px dashed #ccc;
  color: #aaa;
  margin-bottom: 10px;
  padding: 40px 0;
  text-align: center;
  &.drophighlight {
    border-color: #aaa;
    background: #ddd;
  }
}
</style>
