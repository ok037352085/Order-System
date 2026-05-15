<script setup>
import { ref, computed, onMounted } from 'vue'
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase'
import AdminLayout from '../../components/AdminLayout.vue'

// 資料
const categories = ref([])
const products = ref([])
const selectedCategory = ref(null)

// Modal 狀態
const showCatModal = ref(false)
const showProdModal = ref(false)
const editingCat = ref(null)
const editingProd = ref(null)
const saving = ref(false)

// 表單
const catForm = ref({ name: '', sortOrder: 1 })
const prodForm = ref({ name: '', description: '', price: '', sortOrder: 1, isAvailable: true })
const imageFile = ref(null)
const imagePreview = ref('')

// 目前分類的商品
const categoryProducts = computed(() =>
  products.value.filter(p => p.categoryId === selectedCategory.value?.id)
)

async function load() {
  const [catSnap, prodSnap] = await Promise.all([
    getDocs(query(collection(db, 'categories'), orderBy('sortOrder'))),
    getDocs(query(collection(db, 'products'), orderBy('sortOrder'))),
  ])
  categories.value = catSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  products.value = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }))
}

onMounted(load)

function productCount(catId) {
  return products.value.filter(p => p.categoryId === catId).length
}

// 分類操作
function openAddCat() {
  editingCat.value = null
  catForm.value = { name: '', sortOrder: categories.value.length + 1 }
  showCatModal.value = true
}

function openEditCat(cat) {
  editingCat.value = cat
  catForm.value = { name: cat.name, sortOrder: cat.sortOrder }
  showCatModal.value = true
}

async function saveCat() {
  if (!catForm.value.name.trim()) return
  saving.value = true
  try {
    const data = { name: catForm.value.name.trim(), sortOrder: Number(catForm.value.sortOrder) }
    if (editingCat.value) {
      await updateDoc(doc(db, 'categories', editingCat.value.id), data)
    } else {
      await addDoc(collection(db, 'categories'), data)
    }
    showCatModal.value = false
    await load()
    if (selectedCategory.value) {
      selectedCategory.value = categories.value.find(c => c.id === selectedCategory.value.id)
    }
  } finally {
    saving.value = false
  }
}

async function removeCat(cat) {
  if (!confirm(`確定刪除「${cat.name}」分類？刪除後該分類商品不會一併刪除。`)) return
  await deleteDoc(doc(db, 'categories', cat.id))
  if (selectedCategory.value?.id === cat.id) selectedCategory.value = null
  await load()
}

// 商品操作
function openAddProd() {
  editingProd.value = null
  imageFile.value = null
  imagePreview.value = ''
  prodForm.value = {
    name: '', description: '', price: '',
    sortOrder: categoryProducts.value.length + 1,
    isAvailable: true,
    options: [],
  }
  showProdModal.value = true
}

function openEditProd(product) {
  editingProd.value = product
  imageFile.value = null
  imagePreview.value = product.imageUrl || ''
  prodForm.value = {
    name: product.name,
    description: product.description || '',
    price: product.price,
    sortOrder: product.sortOrder,
    isAvailable: product.isAvailable,
    options: JSON.parse(JSON.stringify(product.options || [])),
  }
  showProdModal.value = true
}

function addOption() {
  prodForm.value.options.push({ name: '', type: 'single', required: false, choices: [] })
}

function removeOption(idx) {
  prodForm.value.options.splice(idx, 1)
}

function addChoice(optIdx) {
  prodForm.value.options[optIdx].choices.push({ name: '', price: 0 })
}

function removeChoice(optIdx, choiceIdx) {
  prodForm.value.options[optIdx].choices.splice(choiceIdx, 1)
}

function onImageChange(e) {
  const file = e.target.files[0]
  if (!file) return
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

async function saveProd() {
  if (!prodForm.value.name.trim() || !prodForm.value.price) return
  saving.value = true
  try {
    let imageUrl = editingProd.value?.imageUrl || ''
    if (imageFile.value) {
      const fileRef = storageRef(storage, `products/${Date.now()}_${imageFile.value.name}`)
      await uploadBytes(fileRef, imageFile.value)
      imageUrl = await getDownloadURL(fileRef)
    }
    const data = {
      name: prodForm.value.name.trim(),
      description: prodForm.value.description?.trim() || '',
      price: Number(prodForm.value.price),
      categoryId: selectedCategory.value.id,
      sortOrder: Number(prodForm.value.sortOrder),
      isAvailable: prodForm.value.isAvailable,
      imageUrl,
      options: prodForm.value.options.filter(o => o.name?.trim()).map(o => ({
        name: o.name.trim(),
        type: o.type,
        required: o.required,
        choices: o.choices.filter(c => c.name?.trim()).map(c => ({
          name: c.name.trim(),
          price: Number(c.price) || 0,
        })),
      })),
    }
    if (editingProd.value) {
      await updateDoc(doc(db, 'products', editingProd.value.id), data)
    } else {
      await addDoc(collection(db, 'products'), data)
    }
    showProdModal.value = false
    await load()
  } finally {
    saving.value = false
  }
}

async function toggleAvailable(product) {
  await updateDoc(doc(db, 'products', product.id), { isAvailable: !product.isAvailable })
  await load()
}

async function removeProd(product) {
  if (!confirm(`確定刪除「${product.name}」？`)) return
  await deleteDoc(doc(db, 'products', product.id))
  await load()
}
</script>

<template>
  <AdminLayout title="菜單管理">

    <!-- 分類列表 -->
    <div v-if="!selectedCategory">
      <div class="flex justify-end mb-4">
        <button class="btn admin-btn" @click="openAddCat">新增分類</button>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="card bg-base-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          @click="selectedCategory = cat"
        >
          <div class="card-body p-4 flex flex-row justify-between items-center">
            <div>
              <h3 class="font-bold text-lg">{{ cat.name }}</h3>
              <p class="text-sm text-base-content/50">{{ productCount(cat.id) }} 項商品</p>
            </div>
            <div class="flex gap-1" @click.stop>
              <button class="btn btn-ghost btn-sm" style="border-radius: 10px;" @click="openEditCat(cat)">編輯</button>
              <button class="btn btn-ghost btn-sm text-error" style="border-radius: 10px;" @click="removeCat(cat)">刪除</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 商品列表 -->
    <div v-else>
      <div class="flex justify-between items-center mb-4">
        <button class="btn btn-ghost gap-2" @click="selectedCategory = null">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </button>
        <button class="btn admin-btn" @click="openAddProd">新增商品</button>
      </div>

      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-0">
          <div v-if="categoryProducts.length === 0" class="text-center py-12 text-base-content/40">
            此分類尚無商品
          </div>
          <table v-else class="table">
            <thead>
              <tr>
                <th>圖片</th>
                <th>商品名稱</th>
                <th>價格</th>
                <th>上架</th>
                <th class="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in categoryProducts" :key="product.id">
                <td class="w-16">
                  <img v-if="product.imageUrl" :src="product.imageUrl" class="w-12 h-12 object-cover rounded-lg" />
                  <div v-else class="w-12 h-12 bg-base-200 rounded-lg flex items-center justify-center text-xl">🍳</div>
                </td>
                <td>
                  <div class="font-medium">{{ product.name }}</div>
                  <div class="text-sm text-base-content/50">{{ product.description }}</div>
                </td>
                <td>NT$ {{ product.price }}</td>
                <td>
                  <input type="checkbox" class="toggle toggle-primary toggle-sm"
                    :checked="product.isAvailable" @change="toggleAvailable(product)" />
                </td>
                <td class="text-right">
                  <button class="btn btn-ghost btn-sm" style="border-radius: 10px;" @click="openEditProd(product)">編輯</button>
                  <button class="btn btn-ghost btn-sm text-error" style="border-radius: 10px;" @click="removeProd(product)">刪除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 分類 Modal -->
    <dialog class="modal" :class="{ 'modal-open': showCatModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">{{ editingCat ? '編輯分類' : '新增分類' }}</h3>
        <label class="form-control w-full mb-3">
          <div class="label"><span class="label-text">分類名稱</span></div>
          <input v-model="catForm.name" type="text" class="input input-bordered w-full" placeholder="例：早餐" />
        </label>
        <label class="form-control w-full mb-4">
          <div class="label"><span class="label-text">排序</span></div>
          <input v-model="catForm.sortOrder" type="number" class="input input-bordered w-full" min="1" />
        </label>
        <div class="modal-action">
          <button class="btn btn-ghost" style="border-radius: 10px;" @click="showCatModal = false">取消</button>
          <button class="btn admin-btn" :disabled="saving" @click="saveCat">
            <span v-if="saving" class="loading loading-spinner loading-sm"></span>
            {{ saving ? '儲存中...' : '儲存' }}
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showCatModal = false"></div>
    </dialog>

    <!-- 商品 Modal -->
    <dialog class="modal" :class="{ 'modal-open': showProdModal }">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg mb-4">{{ editingProd ? '編輯商品' : '新增商品' }}</h3>
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
          <input v-model="prodForm.name" type="text" class="input input-bordered w-full" placeholder="例：培根蛋餅" />
        </label>
        <label class="form-control w-full mb-3">
          <div class="label"><span class="label-text">簡短描述</span></div>
          <input v-model="prodForm.description" type="text" class="input input-bordered w-full" placeholder="例：香脆培根加蛋" />
        </label>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <label class="form-control w-full">
            <div class="label"><span class="label-text">價格</span></div>
            <input v-model="prodForm.price" type="number" class="input input-bordered w-full" placeholder="45" min="0" />
          </label>
          <label class="form-control w-full">
            <div class="label"><span class="label-text">排序</span></div>
            <input v-model="prodForm.sortOrder" type="number" class="input input-bordered w-full" min="1" />
          </label>
        </div>
        <div class="flex items-center gap-3 mb-4">
          <span class="label-text">上架販售</span>
          <input type="checkbox" v-model="prodForm.isAvailable" class="toggle toggle-primary" />
        </div>

        <!-- 選項編輯器 -->
        <div class="divider">商品選項（選填）</div>
        <div class="flex flex-col gap-4 mb-4">
          <div
            v-for="(option, optIdx) in prodForm.options"
            :key="optIdx"
            class="border border-base-300 rounded-lg p-3"
          >
            <div class="flex gap-2 mb-2">
              <input v-model="option.name" type="text" class="input input-bordered input-sm flex-1" placeholder="選項名稱（例：杯型）" />
              <select v-model="option.type" class="select select-bordered select-sm w-24">
                <option value="single">單選</option>
                <option value="multiple">多選</option>
              </select>
              <label class="flex items-center gap-1 text-sm">
                <input type="checkbox" v-model="option.required" class="checkbox checkbox-sm" />必選
              </label>
              <button class="btn btn-ghost btn-sm text-error" @click="removeOption(optIdx)">✕</button>
            </div>
            <div class="flex flex-col gap-1 ml-2">
              <div v-for="(choice, choiceIdx) in option.choices" :key="choiceIdx" class="flex gap-2">
                <input v-model="choice.name" type="text" class="input input-bordered input-xs flex-1" placeholder="選擇名稱（例：大杯）" />
                <input v-model="choice.price" type="number" class="input input-bordered input-xs w-20" placeholder="加價" min="0" />
                <button class="btn btn-ghost btn-xs text-error" @click="removeChoice(optIdx, choiceIdx)">✕</button>
              </div>
              <button class="btn btn-ghost btn-xs mt-1 self-start" @click="addChoice(optIdx)">＋ 新增選擇</button>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" @click="addOption">＋ 新增選項</button>
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost" style="border-radius: 10px;" @click="showProdModal = false">取消</button>
          <button class="btn admin-btn" :disabled="saving" @click="saveProd">
            <span v-if="saving" class="loading loading-spinner loading-sm"></span>
            {{ saving ? '儲存中...' : '儲存' }}
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showProdModal = false"></div>
    </dialog>

  </AdminLayout>
</template>
