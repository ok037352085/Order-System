import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 顧客端
    { path: '/order', component: () => import('../views/customer/MenuView.vue') },
    { path: '/order/cart', component: () => import('../views/customer/CartView.vue') },
    { path: '/order/success', component: () => import('../views/customer/SuccessView.vue') },

    // 後台
    { path: '/login', component: () => import('../views/admin/LoginView.vue') },
    { path: '/admin/orders', meta: { requiresAuth: true }, component: () => import('../views/admin/OrdersView.vue') },
    { path: '/admin/menu', meta: { requiresAuth: true }, component: () => import('../views/admin/MenuManageView.vue') },
    { path: '/admin/reports', meta: { requiresAuth: true }, component: () => import('../views/admin/ReportsView.vue') },
    { path: '/admin/qrcode', meta: { requiresAuth: true }, component: () => import('../views/admin/QRCodeView.vue') },

    // 預設導向
    { path: '/', redirect: '/order' },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  const auth = useAuthStore()

  // 等待 Firebase 確認登入狀態
  if (!auth.ready) {
    await new Promise(resolve => {
      const stop = auth.$subscribe(() => {
        if (auth.ready) { stop(); resolve() }
      })
    })
  }

  if (!auth.user) return '/login'
  return true
})

export default router
