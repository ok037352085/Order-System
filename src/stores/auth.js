import { defineStore } from 'pinia'
import { ref } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const ready = ref(false)

  onAuthStateChanged(auth, (u) => {
    user.value = u
    ready.value = true
  })

  return { user, ready }
})
