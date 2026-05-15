<script setup>
import { useRouter } from 'vue-router'
import { useCartStore } from '../../stores/cart'

const router = useRouter()
const cart = useCartStore()
</script>

<template>
  <div class="min-h-screen bg-base-200 flex flex-col items-center justify-center px-4">
    <div class="card bg-base-100 shadow-lg w-full max-w-sm text-center">
      <div class="card-body gap-4">
        <div class="text-6xl">✅</div>
        <h1 class="text-2xl font-bold">訂單已送出！</h1>
        <p class="text-base-content/60">請稍候，我們正在為您準備餐點</p>

        <!-- 訂單明細 -->
        <div class="divider">本次訂單</div>
        <div class="flex flex-col gap-2 text-left">
          <div
            v-for="item in cart.lastOrder"
            :key="item.productId"
            class="flex justify-between items-start text-sm"
          >
            <div>
              <span class="font-medium">{{ item.name }}</span>
              <span class="text-base-content/50 ml-1">x{{ item.qty }}</span>
              <div v-if="item.selectedOptions?.length" class="flex flex-wrap gap-1 mt-0.5">
                <span v-for="opt in item.selectedOptions" :key="opt.choiceName" class="badge badge-outline badge-xs">{{ opt.choiceName }}</span>
              </div>
              <p v-if="item.note" class="text-xs text-base-content/40">備註：{{ item.note }}</p>
            </div>
            <span class="text-primary font-medium shrink-0 ml-2">NT$ {{ item.unitPrice * item.qty }}</span>
          </div>
        </div>
        <div class="flex justify-between font-bold pt-2 border-t border-base-200">
          <span>總計</span>
          <span class="text-primary">NT$ {{ cart.lastOrder.reduce((s, i) => s + i.unitPrice * i.qty, 0) }}</span>
        </div>

        <div class="divider"></div>
        <button
          class="btn user-btn w-full"
          @click="router.push(`/order?table=${cart.tableNo}`)"
        >
          繼續點餐
        </button>
      </div>
    </div>
  </div>
</template>
