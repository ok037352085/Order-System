<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import { useCartStore } from '../../stores/cart'
import ProductOptionModal from '../../components/ProductOptionModal.vue'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()

const categories = ref([])
const products = ref([])
const selectedCategoryId = ref(null)
const loading = ref(true)
const selectedProduct = ref(null)
const showOptionModal = ref(false)

const tableNo = route.query.table || ''
cart.tableNo = tableNo

const filteredProducts = computed(() =>
  products.value.filter(p => p.categoryId === selectedCategoryId.value)
)

const cartItemCount = computed(() =>
  cart.items.reduce((sum, item) => sum + item.qty, 0)
)

onMounted(async () => {
  try {
    const catSnap = await getDocs(query(collection(db, 'categories'), orderBy('sortOrder')))
    categories.value = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    if (categories.value.length > 0) {
      selectedCategoryId.value = categories.value[0].id
    }

    const prodSnap = await getDocs(
      query(collection(db, 'products'), where('isAvailable', '==', true), orderBy('sortOrder'))
    )
    products.value = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (e) {
    console.error('載入失敗：', e)
  } finally {
    loading.value = false
  }
})

function handleAddToCart(product) {
  if (product.options && product.options.length > 0) {
    selectedProduct.value = product
    showOptionModal.value = true
  } else {
    cart.addItem(product)
  }
}

function onOptionConfirm(selectedOptions) {
  cart.addItem(selectedProduct.value, selectedOptions)
  showOptionModal.value = false
  selectedProduct.value = null
}
</script>

<template>
  <div class="min-h-screen bg-base-200">

    <!-- Header -->
    <div class="user-header text-primary-content sticky top-0 z-10">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 class="text-lg font-bold">早餐店</h1>
        <span class="badge badge-outline badge-lg">桌號 {{ tableNo }}</span>
      </div>
    </div>

    <!-- Category Tabs -->
    <div class="bg-base-100 sticky top-14 z-10 shadow-sm">
      <div class="container mx-auto px-4 overflow-x-auto">
        <div class="flex gap-2 py-3 w-max">
          <button
            v-for="cat in categories"
            :key="cat.id"
            class="btn btn-sm"
            style="border-radius: 10px;"
            :class="selectedCategoryId === cat.id ? 'user-btn' : 'btn-ghost'"
            @click="selectedCategoryId = cat.id"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Product List -->
    <div v-else class="container mx-auto px-4 py-4 pb-28">
      <div class="flex flex-col gap-3">
        <div
          v-for="product in filteredProducts"
          :key="product.id"
          class="card card-side bg-base-100 shadow-sm active:scale-95 transition-transform cursor-pointer"
          @click="handleAddToCart(product)"
        >
          <figure class="w-28 shrink-0">
            <img
              v-if="product.imageUrl"
              :src="product.imageUrl"
              :alt="product.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-28 h-24 bg-base-200 flex items-center justify-center">
              <span class="text-3xl">🍳</span>
            </div>
          </figure>
          <div class="card-body p-3 flex flex-row justify-between items-center">
            <div>
              <h2 class="card-title text-base">{{ product.name }}</h2>
              <p class="text-sm text-base-content/60">{{ product.description }}</p>
              <p class="text-primary font-bold mt-1">
                NT$ {{ product.price }}
                <span v-if="product.options?.length" class="text-xs text-base-content/40 font-normal ml-1">起</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cart Bar -->
    <div v-if="cartItemCount > 0" class="fixed bottom-0 left-0 right-0 p-4 bg-base-100 shadow-lg">
      <button class="btn user-btn w-full" @click="router.push('/order/cart')">
        <span class="badge badge-danger">{{ cartItemCount }}</span>
        查看購物車
        <span class="ml-auto">NT$ {{ cart.total }}</span>
      </button>
    </div>

    <!-- Option Modal -->
    <ProductOptionModal
      :product="selectedProduct"
      :show="showOptionModal"
      @confirm="onOptionConfirm"
      @close="showOptionModal = false"
    />

  </div>
</template>
