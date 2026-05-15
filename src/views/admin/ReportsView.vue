<script setup>
import { ref, computed, watch } from 'vue'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import AdminLayout from '../../components/AdminLayout.vue'

const periods = [
  { key: 'today',     label: '今日' },
  { key: 'yesterday', label: '昨日' },
  { key: 'week',      label: '本週' },
  { key: 'month',     label: '本月' },
]

const selectedPeriod = ref('today')
const orderCount = ref(0)
const total = ref(0)
const topProducts = ref([])
const loading = ref(false)

const periodLabel = computed(() => periods.find(p => p.key === selectedPeriod.value)?.label)

function getDateRange(period) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (period === 'today') {
    return { start: today, end: now }
  }
  if (period === 'yesterday') {
    const start = new Date(today)
    start.setDate(start.getDate() - 1)
    return { start, end: today }
  }
  if (period === 'week') {
    const start = new Date(today)
    const day = start.getDay()
    // 週一為起點
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1))
    return { start, end: now }
  }
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { start, end: now }
  }
}

async function loadReport(period) {
  loading.value = true
  const { start } = getDateRange(period)

  const snap = await getDocs(query(
    collection(db, 'orders'),
    where('createdAt', '>=', Timestamp.fromDate(start))
  ))

  const orders = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(o => {
      if (o.status !== 'done') return false
      if (period === 'yesterday') {
        const { start: s, end: e } = getDateRange('yesterday')
        const t = o.createdAt?.toDate()
        return t >= s && t < e
      }
      return true
    })

  orderCount.value = orders.length
  total.value = orders.reduce((s, o) => s + (o.total || 0), 0)

  const productMap = {}
  await Promise.all(
    orders.map(async (order) => {
      const itemsSnap = await getDocs(collection(db, 'orders', order.id, 'items'))
      itemsSnap.docs.forEach(i => {
        const item = i.data()
        if (!productMap[item.name]) productMap[item.name] = { name: item.name, qty: 0, revenue: 0 }
        productMap[item.name].qty += item.qty
        productMap[item.name].revenue += item.price * item.qty
      })
    })
  )
  topProducts.value = Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 10)

  loading.value = false
}

watch(selectedPeriod, (val) => loadReport(val), { immediate: true })
</script>

<template>
  <AdminLayout title="報表">

    <!-- 時段選擇 -->
    <div class="bg-base-100 rounded-box shadow-sm mb-6 overflow-x-auto">
      <div class="flex gap-2 p-3 w-max">
        <button
          v-for="p in periods"
          :key="p.key"
          class="btn btn-sm"
          style="border-radius: 10px;"
          :class="selectedPeriod === p.key ? 'admin-btn' : 'btn-ghost'"
          @click="selectedPeriod = p.key"
        >{{ p.label }}</button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else class="flex flex-col gap-6">

      <!-- 統計數字 -->
      <div class="grid grid-cols-2 gap-3">
        <div class="stat bg-base-100 rounded-box shadow-sm">
          <div class="stat-title">{{ periodLabel }}營業額</div>
          <div class="stat-value text-primary text-2xl">NT$ {{ total }}</div>
        </div>
        <div class="stat bg-base-100 rounded-box shadow-sm">
          <div class="stat-title">{{ periodLabel }}訂單數</div>
          <div class="stat-value text-2xl">{{ orderCount }}</div>
        </div>
      </div>

      <!-- 熱銷商品 -->
      <div>
        <h2 class="text-lg font-bold mb-3">{{ periodLabel }}熱銷商品</h2>
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-0">
            <div v-if="topProducts.length === 0" class="text-center py-8 text-base-content/40">
              此時段尚無已完成訂單
            </div>
            <table v-else class="table">
              <thead>
                <tr>
                  <th>排名</th>
                  <th>商品名稱</th>
                  <th>售出數量</th>
                  <th>營業額</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(product, index) in topProducts" :key="product.name">
                  <td class="font-bold">
                    <span v-if="index === 0">🥇</span>
                    <span v-else-if="index === 1">🥈</span>
                    <span v-else-if="index === 2">🥉</span>
                    <span v-else>{{ index + 1 }}</span>
                  </td>
                  <td class="font-medium">{{ product.name }}</td>
                  <td>{{ product.qty }} 份</td>
                  <td class="text-primary font-medium">NT$ {{ product.revenue }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  </AdminLayout>
</template>
