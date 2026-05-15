<script setup>
import { useRouter } from 'vue-router'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

const props = defineProps({ title: String })
const router = useRouter()

async function logout() {
  await signOut(auth)
  router.push('/login')
}

const navItems = [
  { label: '訂單', path: '/admin/orders' },
  { label: '菜單', path: '/admin/menu' },
  { label: '報表', path: '/admin/reports' },
  { label: 'QR Code', path: '/admin/qrcode' },
]
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <div class="admin-header text-white sticky top-0 z-10">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 class="text-lg font-bold">{{ title }}</h1>
        <div class="flex gap-1">
          <button
            v-for="item in navItems"
            :key="item.path"
            class="btn btn-ghost btn-sm text-primary-content"
            style="border-radius: 10px;"
            :class="{ 'btn-active bg-primary-content/20': $route.path === item.path }"
            @click="router.push(item.path)"
          >{{ item.label }}</button>
          <button class="btn btn-ghost btn-sm text-primary-content" @click="logout">登出</button>
        </div>
      </div>
    </div>
    <div class="container mx-auto px-4 py-4">
      <slot />
    </div>
  </div>
</template>
