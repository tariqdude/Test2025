<template>
  <div
    class="relative h-64 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600"
  >
    <div
      ref="container"
      class="flex h-full w-full items-center justify-center text-2xl font-bold text-white"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    >
      <div
        ref="card"
        class="transform rounded-xl border border-white/20 bg-white/10 p-8 backdrop-blur-md transition-all duration-200"
        :style="cardStyle"
      >
        <h3 class="mb-4 text-xl font-semibold">Vue 3D Card</h3>
        <p class="text-sm opacity-90">Hover for 3D effect</p>
        <div class="mt-4 space-y-2">
          <div class="h-2 overflow-hidden rounded-full bg-white/20">
            <div
              class="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-1000"
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
import { ref, reactive, onMounted, onUnmounted } from 'vue';

const container = ref<HTMLElement>();
const card = ref<HTMLElement>();
const progress = ref(0);

const cardStyle = reactive({
  transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
});

let animationId: number;

const handleMouseMove = (e: MouseEvent) => {
  if (!container.value) return;

  const rect = container.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const rotateX = (y - centerY) / 10;
  const rotateY = (centerX - x) / 10;

  cardStyle.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
};

const handleMouseLeave = () => {
  cardStyle.transform =
    'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
};

const animateProgress = () => {
  progress.value += 0.5;
  if (progress.value >= 100) {
    progress.value = 0;
  }
  animationId = requestAnimationFrame(animateProgress);
};

onMounted(() => {
  animateProgress();
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});
</script>
