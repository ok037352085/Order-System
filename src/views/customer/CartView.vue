<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useCartStore } from '../../stores/cart'

const router = useRouter()
const cart = useCartStore()

const submitting = ref(false)

async function submitOrder() {
  if (cart.items.length === 0) return
  submitting.value = true

  try {
    const orderRef = await addDoc(collection(db, 'orders'), {
      tableNo: cart.tableNo,
      status: 'pending',
      total: cart.total,
      createdAt: serverTimestamp(),
    })

    const itemsCol = collection(db, 'orders', orderRef.id, 'items')
    for (const item of cart.items) {
      await addDoc(itemsCol, {
        productId: item.productId,
        name: item.name,
        price: item.unitPrice,
        qty: item.qty,
        note: item.note,
        selectedOptions: item.selectedOptions || [],
      })
    }

    cart.clearCart()
    router.push('/order/success')
  } catch (e) {
    console.error('送出失敗：', e)
    alert('訂單送出失敗，請再試一次')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-base-200">

    <!-- Header -->
    <div class="user-header text-primary-content sticky top-0 z-10">
      <div class="container mx-auto px-4 py-3 flex items-center gap-3">
        <button class="btn btn-ghost btn-sm btn-circle text-primary-content" @click="router.back()">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-lg font-bold">購物車</h1>
        <span class="badge badge-outline badge-lg ml-auto">桌號 {{ cart.tableNo }}</span>
      </div>
    </div>

    <!-- Empty Cart -->
    <div v-if="cart.items.length === 0" class="flex flex-col items-center justify-center py-32 gap-4">
      <span class="text-6xl">🛒</span>
      <p class="text-base-content/60">購物車是空的</p>
      <button class="btn user-btn" @click="router.back()">回菜單選購</button>
    </div>

    <!-- Cart Items -->
    <div v-else class="container mx-auto px-4 py-4 pb-36">
      <div class="flex flex-col gap-3">
        <div
          v-for="item in cart.items"
          :key="item.cartKey"
          class="card bg-base-100 shadow-sm"
        >
          <div class="card-body p-4">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-bold">{{ item.name }}</h3>
                <!-- 選項標籤 -->
                <div v-if="item.selectedOptions?.length" class="flex flex-wrap gap-1 mt-1">
                  <span
                    v-for="opt in item.selectedOptions"
                    :key="opt.optionName + opt.choiceName"
                    class="badge badge-outline badge-sm"
                  >{{ opt.choiceName }}</span>
                </div>
                <p class="text-primary font-bold mt-1">NT$ {{ item.unitPrice }}</p>
              </div>
              <button
                class="btn btn-ghost btn-xs text-error"
                @click="cart.removeItem(item.cartKey)"
              >刪除</button>
            </div>

            <!-- Qty Controls -->
            <div class="flex items-center gap-3 mt-2">
              <button
                class="btn btn-outline btn-sm btn-circle"
                @click="item.qty > 1 ? cart.updateQty(item.cartKey, item.qty - 1) : cart.removeItem(item.cartKey)"
              >−</button>
              <span class="font-bold text-lg w-6 text-center">{{ item.qty }}</span>
              <button
                class="btn btn-outline btn-sm btn-circle"
                @click="cart.updateQty(item.cartKey, item.qty + 1)"
              >+</button>
              <span class="ml-auto text-base-content/60">小計 NT$ {{ item.unitPrice * item.qty }}</span>
            </div>

            <!-- Note -->
            <input
              type="text"
              placeholder="備註（例：不要辣）"
              class="input input-bordered input-sm w-full mt-2"
              :value="item.note"
              @input="cart.updateNote(item.cartKey, $event.target.value)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Submit Bar -->
    <div v-if="cart.items.length > 0" class="fixed bottom-0 left-0 right-0 p-4 bg-base-100 shadow-lg">
      <div class="flex justify-between items-center mb-2">
        <span class="text-base-content/60">共 {{ cart.items.reduce((s, i) => s + i.qty, 0) }} 項</span>
        <span class="font-bold text-lg">總計 NT$ {{ cart.total }}</span>
      </div>
      <button
        class="btn user-btn w-full"
        :disabled="submitting"
        @click="submitOrder"
      >
        <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
        {{ submitting ? '送出中...' : '確認送出訂單' }}
      </button>
    </div>

  </div>
</template>
