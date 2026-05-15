<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../firebase'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function login() {
  error.value = ''
  loading.value = true
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
    router.push('/admin/orders')
  } catch (e) {
    error.value = '帳號或密碼錯誤，請再試一次'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-base-200 flex items-center justify-center px-4">
    <div class="card bg-base-100 shadow-lg w-full max-w-sm">
      <div class="card-body gap-4">
        <h1 class="text-2xl font-bold text-center">後台登入</h1>

        <div class="alert alert-error" v-if="error">
          <span>{{ error }}</span>
        </div>

        <label class="form-control w-full">
          <div class="label"><span class="label-text">Email</span></div>
          <input
            v-model="email"
            type="email"
            placeholder="輸入 Email"
            class="input input-bordered w-full"
            @keyup.enter="login"
          />
        </label>

        <label class="form-control w-full">
          <div class="label"><span class="label-text">密碼</span></div>
          <input
            v-model="password"
            type="password"
            placeholder="輸入密碼"
            class="input input-bordered w-full"
            @keyup.enter="login"
          />
        </label>

        <button
          class="btn admin-btn w-full mt-2"
          :disabled="loading"
          @click="login"
        >
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          {{ loading ? '登入中...' : '登入' }}
        </button>
      </div>
    </div>
  </div>
</template>
