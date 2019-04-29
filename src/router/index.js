import Vue from 'vue'
import Router from 'vue-router'
import Playlist from '@/components/Playlist'
import Collections from '@/components/Collections'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'playlist',
      component: Playlist
    },
    {
      path: '/current',
      name: 'current',
      component: Playlist
    },
    {
      path: '/all',
      name: 'all',
      component: Playlist
    },
    {
      path: '/collections/:id?',
      name: 'collections',
      component: Collections
    }
  ]
})
