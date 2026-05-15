<script setup>
import { ref, onMounted } from 'vue'
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase'
import AdminLayout from '../../components/AdminLayout.vue'

const categories = ref([])
const showModal = ref(false)
const editing = ref(null)
const form = ref({ name: '', sortOrder: 1 })
const saving = ref(false)

async function loadCategories() {
  const snap = await getDocs(query(collection(db, 'categories'), orderBy('sortOrder')))
  categories.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

onMounted(loadCategories)

function openAdd() {
  editing.value = null
  form.value = { name: '', sortOrder: categories.value.length + 1 }
  showModal.value = true
}

function openEdit(cat) {
  editing.value = cat
  form.value = { name: cat.name, sortOrder: cat.sortOrder }
  showModal.value = true
}

async function save() {
  if (!form.value.name.trim()) return
  saving.value = true
  try {
    if (editing.value) {
      await updateDoc(doc(db, 'categories', editing.value.id), {
        name: form.value.name.trim(),
        sortOrder: Number(form.value.sortOrder),
      })
    } else {
      await addDoc(collection(db, 'categories'), {
        name: form.value.name.trim(),
        sortOrder: Number(form.value.sortOrder),
      })
    }
    showModal.value = false
    await loadCategories()
  } finally {
    saving.value = false
  }
}

async function remove(cat) {
  if (!confirm(`確定刪除「${cat.name}」分類？`)) return
  await deleteDoc(doc(db, 'categories', cat.id))
  await loadCategories()
}
</script>

<template>
  <AdminLayout title="分類管理">
    <div class="flex justify-end mb-4">
      <button class="btn btn-primary" @click="openAdd">新增分類</button>
    </div>

    <div class="card bg-base-100 shadow-sm">
      <div class="card-body p-0">
        <table class="table">
          <thead>
            <tr>
              <th>排序</th>
              <th>分類名稱</th>
              <th class="text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in categories" :key="cat.id">
              <td class="w-16">{{ cat.sortOrder }}</td>
              <td class="font-medium">{{ cat.name }}</td>
              <td class="text-right">
                <button class="btn btn-ghost btn-sm" style="border-radius: 10px;" @click="openEdit(cat)">編輯</button>
                <button class="btn btn-ghost btn-sm text-error" style="border-radius: 10px;" @click="remove(cat)">刪除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <dialog class="modal" :class="{ 'modal-open': showModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">{{ editing ? '編輯分類' : '新增分類' }}</h3>

        <label class="form-control w-full mb-3">
          <div class="label"><span class="label-text">分類名稱</span></div>
          <input v-model="form.name" type="text" class="input input-bordered w-full" placeholder="例：早餐" />
        </label>

        <label class="form-control w-full mb-4">
          <div class="label"><span class="label-text">排序</span></div>
          <input v-model="form.sortOrder" type="number" class="input input-bordered w-full" min="1" />
        </label>

        <div class="modal-action">
          <button class="btn btn-ghost" style="border-radius: 10px;" @click="showModal = false">取消</button>
          <button class="btn btn-primary" :disabled="saving" @click="save">
            <span v-if="saving" class="loading loading-spinner loading-sm"></span>
            {{ saving ? '儲存中...' : '儲存' }}
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showModal = false"></div>
    </dialog>
  </AdminLayout>
</template>
