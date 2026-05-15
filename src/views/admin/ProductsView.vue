<script setup>
import { ref, onMounted } from 'vue'
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase'
import AdminLayout from '../../components/AdminLayout.vue'

const products = ref([])
const categories = ref([])
const showModal = ref(false)
const editing = ref(null)
const saving = ref(false)
const imageFile = ref(null)
const imagePreview = ref('')

const form = ref({
  name: '', description: '', price: '', categoryId: '', sortOrder: 1, isAvailable: true
})

async function load() {
  const [prodSnap, catSnap] = await Promise.all([
    getDocs(query(collection(db, 'products'), orderBy('sortOrder'))),
    getDocs(query(collection(db, 'categories'), orderBy('sortOrder'))),
  ])
  products.value = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  categories.value = catSnap.docs.map(d => ({ id: d.id, ...d.data() }))
}

onMounted(load)

function categoryName(id) {
  return categories.value.find(c => c.id === id)?.name || '-'
}

function openAdd() {
  editing.value = null
  imageFile.value = null
  imagePreview.value = ''
  form.value = {
    name: '', description: '', price: '',
    categoryId: categories.value[0]?.id || '',
    sortOrder: products.value.length + 1,
    isAvailable: true,
  }
  showModal.value = true
}

function openEdit(product) {
  editing.value = product
  imageFile.value = null
  imagePreview.value = product.imageUrl || ''
  form.value = {
    name: product.name,
    description: product.description,
    price: product.price,
    categoryId: product.categoryId,
    sortOrder: product.sortOrder,
    isAvailable: product.isAvailable,
  }
  showModal.value = true
}

function onImageChange(e) {
  const file = e.target.files[0]
  if (!file) return
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

async function save() {
  if (!form.value.name.trim() || !form.value.price) return
  saving.value = true
  try {
    let imageUrl = editing.value?.imageUrl || ''

    if (imageFile.value) {
      const fileRef = storageRef(storage, `products/${Date.now()}_${imageFile.value.name}`)
      await uploadBytes(fileRef, imageFile.value)
      imageUrl = await getDownloadURL(fileRef)
    }

    const data = {
      name: form.value.name.trim(),
      description: form.value.description.trim(),
      price: Number(form.value.price),
      categoryId: form.value.categoryId,
      sortOrder: Number(form.value.sortOrder),
      isAvailable: form.value.isAvailable,
      imageUrl,
    }

    if (editing.value) {
      await updateDoc(doc(db, 'products', editing.value.id), data)
    } else {
      await addDoc(collection(db, 'products'), data)
    }

    showModal.value = false
    await load()
  } finally {
    saving.value = false
  }
}

async function toggleAvailable(product) {
  await updateDoc(doc(db, 'products', product.id), { isAvailable: !product.isAvailable })
  await load()
}

async function remove(product) {
  if (!confirm(`確定刪除「${product.name}」？`)) return
  await deleteDoc(doc(db, 'products', product.id))
  await load()
}
</script>

<template>
  <AdminLayout title="商品管理">
    <div class="flex justify-end mb-4">
      <button class="btn admin-btn" @click="openAdd">新增商品</button>
    </div>

    <div class="card bg-base-100 shadow-sm">
      <div class="card-body p-0">
        <table class="table">
          <thead>
            <tr>
              <th>圖片</th>
              <th>商品名稱</th>
              <th>分類</th>
              <th>價格</th>
              <th>狀態</th>
              <th class="text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id">
              <td class="w-16">
                <img v-if="product.imageUrl" :src="product.imageUrl" class="w-12 h-12 object-cover rounded-lg" />
                <div v-else class="w-12 h-12 bg-base-200 rounded-lg flex items-center justify-center text-xl">🍳</div>
              </td>
              <td>
                <div class="font-medium">{{ product.name }}</div>
                <div class="text-sm text-base-content/50">{{ product.description }}</div>
              </td>
              <td>{{ categoryName(product.categoryId) }}</td>
              <td>NT$ {{ product.price }}</td>
              <td>
                <input
                  type="checkbox"
                  class="toggle toggle-primary toggle-sm"
                  :checked="product.isAvailable"
                  @change="toggleAvailable(product)"
                />
              </td>
              <td class="text-right">
                <button class="btn btn-ghost btn-sm" style="border-radius: 10px;" @click="openEdit(product)">編輯</button>
                <button class="btn btn-ghost btn-sm text-error" style="border-radius: 10px;" @click="remove(product)">刪除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <dialog class="modal" :class="{ 'modal-open': showModal }">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg mb-4">{{ editing ? '編輯商品' : '新增商品' }}</h3>

        <!-- Image Upload -->
        <div class="mb-3">
          <div class="label"><span class="label-text">商品圖片</span></div>
          <div class="flex items-center gap-4">
            <div class="w-24 h-24 bg-base-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
              <img v-if="imagePreview" :src="imagePreview" class="w-full h-full object-cover" />
              <span v-else class="text-3xl">🍳</span>
            </div>
            <input type="file" accept="image/*" class="file-input file-input-bordered file-input-sm w-full" @change="onImageChange" />
          </div>
        </div>

        <label class="form-control w-full mb-3">
          <div class="label"><span class="label-text">商品名稱</span></div>
          <input v-model="form.name" type="text" class="input input-bordered w-full" placeholder="例：培根蛋餅" />
        </label>

        <label class="form-control w-full mb-3">
          <div class="label"><span class="label-text">簡短描述</span></div>
          <input v-model="form.description" type="text" class="input input-bordered w-full" placeholder="例：香脆培根加蛋" />
        </label>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <label class="form-control w-full">
            <div class="label"><span class="label-text">價格</span></div>
            <input v-model="form.price" type="number" class="input input-bordered w-full" placeholder="45" min="0" />
          </label>
          <label class="form-control w-full">
            <div class="label"><span class="label-text">排序</span></div>
            <input v-model="form.sortOrder" type="number" class="input input-bordered w-full" min="1" />
          </label>
        </div>

        <label class="form-control w-full mb-3">
          <div class="label"><span class="label-text">分類</span></div>
          <select v-model="form.categoryId" class="select select-bordered w-full">
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </label>

        <div class="flex items-center gap-3 mb-4">
          <span class="label-text">上架販售</span>
          <input type="checkbox" v-model="form.isAvailable" class="toggle toggle-primary" />
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost" style="border-radius: 10px;" @click="showModal = false">取消</button>
          <button class="btn admin-btn" :disabled="saving" @click="save">
            <span v-if="saving" class="loading loading-spinner loading-sm"></span>
            {{ saving ? '儲存中...' : '儲存' }}
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showModal = false"></div>
    </dialog>
  </AdminLayout>
</template>
