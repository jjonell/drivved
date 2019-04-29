
let audio = new Audio();
let store, tracking;

export default {
	init (_store) {
		store = _store;
		store.audioObj = audio;
		audio.addEventListener('ended', () => {
			this.skipNext();
		});
	},
	async loadSong (cb) {
		let song = store.currentSong;
		let track = song.files.find(track => (track.type === store.currentTrack));
		if (!track) {
			store.currentTrack = 'Arr';
			track = song.files.find(track => (track.type === store.currentTrack));
		}
		const loadAudio = (url) => {
			audio.src = url;
			audio.addEventListener('loadedmetadata', () => {
				store.player.duration = audio.duration;
			}, { once: true });
			store.player.playing = false;
			if (cb) { cb(); }
		}
		let blob;
		if (store.playlist.indexOf(song.id) > -1) {
			let dbItem = await localDb.playlist.get(song.id);
			if (dbItem.track === store.currentTrack) {
				if (dbItem.ios) {
					// already base64 encoded becuase we couldn't store it otherwise
					blob = dbItem.audio;
				}
				else {
					blob = URL.createObjectURL(dbItem.audio);
				}
			}
		}
		if (blob) {
			loadAudio(blob);
		}
		else {
			console.log('get audio url from firebase');
			firebase.storage().ref(song.id + '/' + track.file).getDownloadURL().then(loadAudio);
		}
	},
	loadTrack (track) {
		this.pause();
		store.currentTrack = track.type;
		this.loadSong();
	},
	pause () {
		audio.pause();
		clearInterval(tracking);
		store.player.playing = false;
	},
	play() {
		audio.play();
		tracking = setInterval(() => {
			store.player.currentTime = audio.currentTime;
		}, 1000);
		store.player.playing = true;
	},
	togglePlay () {
		if (store.player.playing) {
			this.pause();
		}
		else {
			this.play();
		}
	},
	seek (time, offset) {
		if (offset) {
			time = audio.currentTime + offset;
		}
		if (time < 0) { time = 0; }
		if (time > audio.duration) { time = audio.duration; }
		audio.currentTime = store.player.currentTime = time;
	},
	skip (index) {
		if (index < 0) { index = store.currentSongList.length - 1; }
		else if (index > store.currentSongList.length - 1) { index = 0; }
		let id = store.currentSongList[index];
		let song = store.songs.find(song => (song.id === id));
		this.pause();
		this.seek(0);
		store.currentSong = song;
		store.audio.loadSong(() => {
			audio.addEventListener('canplaythrough', () => {
				this.play();
			}, { once: true });
		});
	},
	skipNext () {
		let index = store.currentSongList.findIndex(id => (id === store.currentSong.id))
		this.skip(index + 1);
	},
	skipPrevious () {
		if (store.audioObj.currentTime > 1) {
			store.audio.seek(0);
		}
		else {
			let index = store.currentSongList.findIndex(id => (id === store.currentSong.id))
			this.skip(index - 1);
		}
	}
}