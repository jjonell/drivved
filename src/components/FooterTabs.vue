<template>
  <footer>
    <router-link 
      v-for="tab in tabs" 
      :key="tab.icon" 
      :class="{ 'selected': ($route.name === tab.id) }" 
      :to="(tab.id === 'playlist') ? '/' : '/' + tab.id"
    >
      <i :class="'icon ion-' + tab.icon"></i><span>{{ tab.label }}</span>
    </router-link>
  </footer>
</template>

<script>
export default {
  name: 'Footertabs',
  data () {
    return {
      tabs: [
        { id: 'playlist', icon: 'ios-headset', label: 'Spellista' },
        { id: 'current', icon: 'ios-star', label: 'Aktuella' },
        { id: 'all', icon: 'ios-musical-notes', label: 'Alla låtar' },
        { id: 'collections', icon: 'ios-albums', label: 'Samlingar' }
      ]
    }
  }
}
</script>

<style lang="less">
footer {
  margin-top: auto;
  text-align: center;
  display: flex;
  justify-content: center;
  padding: 3px 0;
  border-top: 0.5px solid #aeaeae;
  a {
    flex: 1;
    max-width: 100px;
    color: #a2a2a2;
    &.selected {
      color: #ea4e3d;
    }
    .icon {
      display: block;
      font-size: 30px;
      height: 30px;
    }
    span {
      font-size: 10px;
    }
  }
}
</style>
