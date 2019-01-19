import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  // mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home-main',
      component: () => import('./views/home-main.vue')
    },
    {
      path: '/messages/',
      name: 'messages-main',
      component: () => import(/* webpackChunkName: "messages-main" */ './views/messages-main.vue')
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
