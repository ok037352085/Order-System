<script setup>
import { ref, onMounted } from 'vue'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import AdminLayout from '../../components/AdminLayout.vue'

const todayTotal = ref(0)
const todayOrderCount = ref(0)
const topProducts = ref([])
const monthTotal = ref(0)
const monthOrderCount = ref(0)
const loading = ref(true)

onMounted(async () => {
  const now = new Date()

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const monthSnap = await getDocs(query(
    collection(db, 'orders'),
    where('createdAt', '>=', Timestamp.fromDate(monthStart))
  ))

  const allMonthOrders = monthSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  const todayOrders = allMonthOrders.filter(o =>
    o.status === 'done' && o.createdAt?.toDate() >= todayStart
  )
  const monthOrders = allMonthOrders.filter(o => o.status === 'done')

  // 今日統計
  todayOrderCount.value = todayOrders.length
  todayTotal.value = todayOrders.reduce((s, o) => s + (o.total || 0), 0)

  // 月統計
  monthOrderCount.value = monthOrders.length
  monthTotal.value = monthOrders.reduce((s, o) => s + (o.total || 0), 0)

  // 熱銷商品（從今日已完成訂單的子集合統計）
  const productMap = {}
  await Promise.all(
    todayOrders.map(async (order) => {
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
})
</script>

<template>
  <AdminLayout title="報表">
    <div v-if="loading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else class="flex flex-col gap-6">

      <!-- 今日統計 -->
      <div>
        <h2 class="text-lg font-bold mb-3">今日統計</h2>
        <div class="grid grid-cols-2 gap-3">
          <div class="stat bg-base-100 rounded-box shadow-sm">
            <div class="stat-title">今日營業額</div>
            <div class="stat-value text-primary">NT$ {{ todayTotal }}</div>
          </div>
          <div class="stat bg-base-100 rounded-box shadow-sm">
            <div class="stat-title">今日訂單數</div>
            <div class="stat-value">{{ todayOrderCount }}</div>
          </div>
        </div>
      </div>

      <!-- 本月統計 -->
      <div>
        <h2 class="text-lg font-bold mb-3">本月統計</h2>
        <div class="grid grid-cols-2 gap-3">
          <div class="stat bg-base-100 rounded-box shadow-sm">
            <div class="stat-title">本月營業額</div>
            <div class="stat-value text-primary">NT$ {{ monthTotal }}</div>
          </div>
          <div class="stat bg-base-100 rounded-box shadow-sm">
            <div class="stat-title">本月訂單數</div>
            <div class="stat-value">{{ monthOrderCount }}</div>
          </div>
        </div>
      </div>

      <!-- 熱銷商品 -->
      <div>
        <h2 class="text-lg font-bold mb-3">今日熱銷商品</h2>
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-0">
            <div v-if="topProducts.length === 0" class="text-center py-8 text-base-content/40">
              今日尚無訂單
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
