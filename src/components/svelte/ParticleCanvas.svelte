<script lang="ts">
  import { onMount } from 'svelte';
  
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let particles: Array<{x: number, y: number, vx: number, vy: number, life: number}> = [];
  let animationId: number;
  
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7'];
  
  function createParticle(x: number, y: number) {
    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 1.0
    };
  }
  
  function updateParticles() {
    particles = particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 0.02;
      particle.vx *= 0.99;
      particle.vy *= 0.99;
      return particle.life > 0;
    });
  }
  
  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach((particle, index) => {
      const color = colors[index % colors.length];
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3 * particle.life, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.globalAlpha = 1;
  }
  
  function animate() {
    updateParticles();
    drawParticles();
    animationId = requestAnimationFrame(animate);
  }
  
  function handleClick(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    for (let i = 0; i < 10; i++) {
      particles.push(createParticle(x, y));
    }
  }
  
  onMount(() => {
    ctx = canvas.getContext('2d')!;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    animate();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  });
</script>

<div class="relative w-full h-64 bg-gray-900 rounded-2xl overflow-hidden">
  <canvas 
    bind:this={canvas}
    on:click={handleClick}
    class="w-full h-full cursor-pointer"
  ></canvas>
  
  <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
    <div class="text-center text-white">
      <h3 class="text-xl font-semibold mb-2">Svelte Particle System</h3>
      <p class="text-sm opacity-75">Click anywhere to create particles</p>
    </div>
  </div>
</div>

<style>
  canvas {
    background: linear-gradient(45deg, #1a1a2e, #16213e, #0f3460);
  }
</style>
