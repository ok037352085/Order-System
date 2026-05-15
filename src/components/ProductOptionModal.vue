<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  product: Object,
  show: Boolean,
})

const emit = defineEmits(['confirm', 'close'])

const selected = ref({})
const errorOptions = ref([])

const selectedOptions = computed(() => {
  return Object.entries(selected.value).flatMap(([optName, val]) => {
    if (Array.isArray(val)) {
      return val.map(choice => ({
        optionName: optName,
        choiceName: choice.name,
        extraPrice: choice.price || 0,
      }))
    }
    if (val) {
      return [{ optionName: optName, choiceName: val.name, extraPrice: val.price || 0 }]
    }
    return []
  })
})

const totalPrice = computed(() => {
  if (!props.product) return 0
  return props.product.price + selectedOptions.value.reduce((s, o) => s + o.extraPrice, 0)
})

const canConfirm = computed(() => {
  if (!props.product?.options) return true
  return props.product.options
    .filter(opt => opt.required)
    .every(opt => {
      const val = selected.value[opt.name]
      return opt.type === 'single' ? !!val : true
    })
})

watch(() => props.show, (val) => {
  if (val) {
    selected.value = {}
    errorOptions.value = []
  }
})

function toggleMultiChoice(optionName, choice) {
  const arr = selected.value[optionName] || []
  const idx = arr.findIndex(c => c.name === choice.name)
  selected.value = {
    ...selected.value,
    [optionName]: idx >= 0
      ? arr.filter(c => c.name !== choice.name)
      : [...arr, choice],
  }
}

function selectSingle(optionName, choice) {
  selected.value[optionName] = choice
  errorOptions.value = errorOptions.value.filter(n => n !== optionName)
}

function confirm() {
  const missing = (props.product?.options || [])
    .filter(opt => opt.required && !selected.value[opt.name])
    .map(opt => opt.name)

  if (missing.length > 0) {
    errorOptions.value = []
    nextTick(() => { errorOptions.value = missing })
    return
  }

  emit('confirm', selectedOptions.value)
  selected.value = {}
}
</script>

<template>
  <dialog class="modal" :class="{ 'modal-open': show }">
    <div class="modal-box max-w-sm" v-if="product">
      <h3 class="font-bold text-lg mb-1">{{ product.name }}</h3>
      <p class="text-primary font-bold mb-4">NT$ {{ totalPrice }}</p>

      <div
        v-for="option in product.options"
        :key="option.name"
        class="mb-4 rounded-xl p-2 border-2 transition-colors"
        :class="errorOptions.includes(option.name) ? 'border-error shake' : 'border-transparent'"
      >
        <div class="flex items-center gap-2 mb-2">
          <span class="font-medium">{{ option.name }}</span>
          <span v-if="option.required" class="badge badge-error badge-sm">必選</span>
        </div>

        <!-- 單選 -->
        <div v-if="option.type === 'single'" class="flex flex-wrap gap-2">
          <button
            v-for="choice in option.choices"
            :key="choice.name"
            class="btn btn-sm"
            style="border-radius: 10px;"
            :class="selected[option.name]?.name === choice.name ? 'user-btn' : 'btn-outline'"
            @click="selectSingle(option.name, choice)"
          >
            {{ choice.name }}
            <span v-if="choice.price > 0" class="text-xs">+{{ choice.price }}</span>
          </button>
        </div>

        <!-- 多選 -->
        <div v-else class="flex flex-wrap gap-2">
          <button
            v-for="choice in option.choices"
            :key="choice.name"
            class="btn btn-sm"
            style="border-radius: 10px;"
            :class="(selected[option.name] || []).some(c => c.name === choice.name) ? 'user-btn' : 'btn-outline'"
            @click="toggleMultiChoice(option.name, choice)"
          >
            {{ choice.name }}
            <span v-if="choice.price > 0" class="text-xs">+{{ choice.price }}</span>
          </button>
        </div>
      </div>

      <div class="modal-action">
        <button class="btn btn-ghost" style="border-radius: 10px;" @click="emit('close')">取消</button>
        <button class="btn user-btn" @click="confirm">
          加入購物車
        </button>
      </div>
    </div>
    <div class="modal-backdrop" @click="emit('close')"></div>
  </dialog>
</template>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-6px); }
  40%       { transform: translateX(6px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}
.shake {
  animation: shake 0.4s ease;
}
</style>
