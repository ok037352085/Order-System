import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const tableNo = ref('')
  const lastOrder = ref([])

  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.unitPrice * item.qty, 0)
  )

  function addItem(product, selectedOptions = []) {
    const extraPrice = selectedOptions.reduce((s, o) => s + (o.extraPrice || 0), 0)
    const unitPrice = product.price + extraPrice
    const optKey = selectedOptions.map(o => `${o.optionName}:${o.choiceName}`).join('|')
    const cartKey = `${product.id}__${optKey}`

    const existing = items.value.find(i => i.cartKey === cartKey)
    if (existing) {
      existing.qty++
    } else {
      items.value.push({
        cartKey,
        productId: product.id,
        name: product.name,
        basePrice: product.price,
        unitPrice,
        selectedOptions,
        qty: 1,
        note: '',
      })
    }
  }

  function removeItem(cartKey) {
    items.value = items.value.filter(i => i.cartKey !== cartKey)
  }

  function updateQty(cartKey, qty) {
    const item = items.value.find(i => i.cartKey === cartKey)
    if (item) item.qty = qty
  }

  function updateNote(cartKey, note) {
    const item = items.value.find(i => i.cartKey === cartKey)
    if (item) item.note = note
  }

  function clearCart() {
    lastOrder.value = [...items.value]
    items.value = []
  }

  return { items, tableNo, total, lastOrder, addItem, removeItem, updateQty, updateNote, clearCart }
})
