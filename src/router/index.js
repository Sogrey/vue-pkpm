import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/obv-2d',
      name: 'obv-2d',
      component: () => import('../views/OBV2DView.vue'),
    },
    {
      path: '/obv-3d',
      name: 'obv-3d',
      component: () => import('../views/OBV3DView.vue'),
    },
    {
      path: '/obv-doc',
      name: 'obv-doc',
      component: () => import('../views/OBVDocView.vue'),
    },
  ],
})

export default router
