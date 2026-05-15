<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { collection, query, orderBy, onSnapshot, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import AdminLayout from '../../components/AdminLayout.vue'

const orders = ref([])
const selectedStatus = ref('all')

const statusMap = {
  pending:   { label: '待接單', class: 'badge-warning' },
  confirmed: { label: '製作中', class: 'badge-info' },
  done:      { label: '已完成', class: 'badge-success' },
}

const nextStatus = {
  pending:   'confirmed',
  confirmed: 'done',
}

const nextStatusLabel = {
  pending:   '確認接單',
  confirmed: '完成出餐',
}

const filteredOrders = computed(() => {
  if (selectedStatus.value === 'all') return orders.value
  return orders.value.filter(o => o.status === selectedStatus.value)
})

const pendingCount = computed(() =>
  orders.value.filter(o => o.status === 'pending').length
)

const unsubscribe = onSnapshot(
  query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
  async (snap) => {
    const result = await Promise.all(
      snap.docs.map(async (d) => {
        const itemsSnap = await getDocs(collection(db, 'orders', d.id, 'items'))
        const items = itemsSnap.docs.map(i => ({ id: i.id, ...i.data() }))
        return { id: d.id, ...d.data(), items }
      })
    )
    orders.value = result
  }
)

onUnmounted(() => unsubscribe())

async function updateStatus(orderId, status) {
  await updateDoc(doc(db, 'orders', orderId), { status })
}

async function deleteOrder(order) {
  if (order.status !== 'pending') return
  if (!confirm('確定要取消這筆訂單？')) return
  await deleteDoc(doc(db, 'orders', order.id))
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  return timestamp.toDate().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <AdminLayout title="訂單管理">
    <!-- Pending Badge -->
    <div v-if="pendingCount > 0" class="mb-3">
      <span class="badge badge-warning badge-lg animate-bounce">{{ pendingCount }} 筆待處理</span>
    </div>

    <!-- Status Filter -->
    <div class="bg-base-100 rounded-box shadow-sm mb-4 overflow-x-auto">
      <div class="flex gap-2 p-3 w-max">
        <button
          class="btn btn-sm"
          style="border-radius: 10px;"
          :class="selectedStatus === 'all' ? 'admin-btn' : 'btn-ghost'"
          @click="selectedStatus = 'all'"
        >全部</button>
        <button
          v-for="(val, key) in statusMap"
          :key="key"
          class="btn btn-sm"
          style="border-radius: 10px;"
          :class="selectedStatus === key ? 'admin-btn' : 'btn-ghost'"
          @click="selectedStatus = key"
        >{{ val.label }}</button>
      </div>
    </div>

    <!-- Orders -->
    <div v-if="filteredOrders.length === 0" class="text-center py-20 text-base-content/40">
      目前沒有訂單
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="order in filteredOrders"
        :key="order.id"
        class="card bg-base-100 shadow-sm"
        :class="order.status === 'pending' ? 'border-2 border-warning' : ''"
      >
        <div class="card-body p-4 gap-2">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <span class="text-lg font-bold">桌號 {{ order.tableNo }}</span>
              <span class="badge" :class="statusMap[order.status]?.class">
                {{ statusMap[order.status]?.label }}
              </span>
            </div>
            <span class="text-sm text-base-content/40">{{ formatTime(order.createdAt) }}</span>
          </div>

          <div class="divider my-0"></div>

          <div class="flex flex-col gap-1">
            <div
              v-for="item in order.items"
              :key="item.id"
              class="flex justify-between text-sm"
            >
              <span>
                {{ item.name }} x{{ item.qty }}
                <span v-if="item.selectedOptions?.length" class="text-base-content/40 text-xs">
                  （{{ item.selectedOptions.map(o => o.choiceName).join('、') }}）
                </span>
                <span v-if="item.note" class="text-base-content/40 text-xs">備註：{{ item.note }}</span>
              </span>
              <span>NT$ {{ item.price * item.qty }}</span>
            </div>
          </div>

          <div class="flex justify-between font-bold mt-1">
            <span>總計</span>
            <span class="text-primary">NT$ {{ order.total }}</span>
          </div>

          <div class="flex gap-2 mt-2">
            <button
              v-if="nextStatus[order.status]"
              class="btn admin-btn btn-sm flex-1"
              @click="updateStatus(order.id, nextStatus[order.status])"
            >{{ nextStatusLabel[order.status] }}</button>
            <button
              v-if="order.status === 'pending'"
              class="btn btn-ghost btn-sm text-error"
              @click="deleteOrder(order)"
            >取消</button>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>
