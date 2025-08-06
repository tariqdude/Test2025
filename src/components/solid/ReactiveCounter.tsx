import { createSignal, createEffect, onCleanup } from 'solid-js';

export default function SolidCounter() {
  const [count, setCount] = createSignal(0);
  const [isAnimating, setIsAnimating] = createSignal(false);
  const [particles, setParticles] = createSignal<Array<{id: number, x: number, y: number}>>([]);

  let intervalId: number;

  const increment = () => {
    setCount(count() + 1);
    setIsAnimating(true);
    
    // Create explosion effect
    const newParticles = Array.from({length: 8}, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 200,
      y: Math.random() * 200,
    }));
    
    setParticles(newParticles);
    
    setTimeout(() => {
      setIsAnimating(false);
      setParticles([]);
    }, 1000);
  };

  const startAutoIncrement = () => {
    intervalId = setInterval(() => {
      setCount(c => c + 1);
    }, 100);
  };

  const stopAutoIncrement = () => {
    clearInterval(intervalId);
  };

  createEffect(() => {
    // Reactive effect that runs when count changes
    if (count() > 0 && count() % 10 === 0) {
      // Trigger special effect every 10 counts
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
    }
  });

  onCleanup(() => {
    clearInterval(intervalId);
  });

  return (
    <div class="relative w-full h-64 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl overflow-hidden flex items-center justify-center">
      <div class="text-center text-white relative z-10">
        <h3 class="text-xl font-semibold mb-4">Solid.js Reactive Counter</h3>
        
        <div 
          class={`text-6xl font-bold mb-6 transition-all duration-300 ${
            isAnimating() ? 'scale-125 text-yellow-300' : 'scale-100'
          }`}
        >
          {count()}
        </div>
        
        <div class="space-x-4">
          <button 
            onClick={increment}
            class="px-6 py-2 bg-white/20 backdrop-blur-md rounded-lg border border-white/30 hover:bg-white/30 transition-all duration-200"
          >
            Click Me!
          </button>
          
          <button 
            onClick={startAutoIncrement}
            class="px-6 py-2 bg-green-500/80 backdrop-blur-md rounded-lg border border-green-400/50 hover:bg-green-500 transition-all duration-200"
          >
            Auto
          </button>
          
          <button 
            onClick={stopAutoIncrement}
            class="px-6 py-2 bg-red-500/80 backdrop-blur-md rounded-lg border border-red-400/50 hover:bg-red-500 transition-all duration-200"
          >
            Stop
          </button>
        </div>
      </div>
      
      {/* Animated particles */}
      {particles().map((particle) => (
        <div
          class="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            'animation-duration': '1s'
          }}
        />
      ))}
    </div>
  );
}
