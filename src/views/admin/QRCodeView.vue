<script setup>
import { ref, onMounted } from 'vue'
import QRCode from 'qrcode'
import AdminLayout from '../../components/AdminLayout.vue'

const domain = ref('')
const tableInput = ref('')
const qrCodes = ref([])
const generating = ref(false)

onMounted(() => {
  domain.value = window.location.origin
})

async function generate() {
  const tables = tableInput.value
    .split('\n')
    .map(t => t.trim())
    .filter(t => t !== '')

  if (tables.length === 0) return
  generating.value = true

  qrCodes.value = await Promise.all(
    tables.map(async (table) => {
      const url = `${domain.value}/order?table=${encodeURIComponent(table)}`
      const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 })
      return { table, url, dataUrl }
    })
  )

  generating.value = false
}

function print() {
  window.print()
}
</script>

<template>
  <AdminLayout title="QR Code 產生">
    <div class="max-w-2xl">

      <!-- 設定 -->
      <div class="card bg-base-100 shadow-sm mb-6">
        <div class="card-body gap-4">
          <label class="form-control w-full">
            <div class="label"><span class="label-text">網站網址（部署後請更新）</span></div>
            <input v-model="domain" type="text" class="input input-bordered w-full" placeholder="https://your-project.web.app" />
          </label>

          <label class="form-control w-full">
            <div class="label">
              <span class="label-text">桌號列表（每行一個）</span>
            </div>
            <textarea
              v-model="tableInput"
              class="textarea textarea-bordered w-full h-36"
              placeholder="1&#10;2&#10;3"
            ></textarea>
          </label>

          <button class="btn admin-btn w-full" :disabled="generating" @click="generate">
            <span v-if="generating" class="loading loading-spinner loading-sm"></span>
            {{ generating ? '產生中...' : '產生 QR Code' }}
          </button>
        </div>
      </div>

      <!-- QR Code 列表 -->
      <div v-if="qrCodes.length > 0">
        <div class="flex justify-between items-center mb-4">
          <span class="font-bold">共 {{ qrCodes.length }} 張 QR Code</span>
          <button class="btn btn-outline btn-sm" @click="print">列印</button>
        </div>

        <div class="grid grid-cols-2 gap-4 print:grid-cols-2">
          <div
            v-for="qr in qrCodes"
            :key="qr.table"
            class="card bg-base-100 shadow-sm text-center print:shadow-none print:border print:border-gray-200"
          >
            <div class="card-body items-center gap-2 p-4">
              <img :src="qr.dataUrl" :alt="`桌號 ${qr.table}`" class="w-40 h-40" />
              <p class="font-bold text-lg">桌號 {{ qr.table }}</p>
              <p class="text-xs text-base-content/40 break-all">{{ qr.url }}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </AdminLayout>
</template>

<style>
@media print {
  header, nav, .btn, footer { display: none !important; }
  body { background: white; }
}
</style>
