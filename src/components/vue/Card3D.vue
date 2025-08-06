<template>
  <div class="relative w-full h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl overflow-hidden">
    <div 
      ref="container"
      class="w-full h-full flex items-center justify-center text-white font-bold text-2xl"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    >
      <div 
        ref="card"
        class="transform transition-all duration-200 bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20"
        :style="cardStyle"
      >
        <h3 class="text-xl font-semibold mb-4">Vue 3D Card</h3>
        <p class="text-sm opacity-90">Hover for 3D effect</p>
        <div class="mt-4 space-y-2">
          <div class="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-1000"
              :style="{ width: progress + '%' }"
            ></div>
          </div>
          <div class="flex justify-between text-xs">
            <span>Vue.js</span>
            <span>{{ Math.round(progress) }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'

const container = ref<HTMLElement>()
const card = ref<HTMLElement>()
const progress = ref(0)

const cardStyle = reactive({
  transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
})

let animationId: number

const handleMouseMove = (e: MouseEvent) => {
  if (!container.value) return
  
  const rect = container.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  
  const rotateX = (y - centerY) / 10
  const rotateY = (centerX - x) / 10
  
  cardStyle.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`
}

const handleMouseLeave = () => {
  cardStyle.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)'
}

const animateProgress = () => {
  progress.value += 0.5
  if (progress.value >= 100) {
    progress.value = 0
  }
  animationId = requestAnimationFrame(animateProgress)
}

onMounted(() => {
  animateProgress()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>
