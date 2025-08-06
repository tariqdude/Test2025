import { createSignal, createEffect, onCleanup } from 'solid-js';

export default function ReactiveCounter() {
  const [count, setCount] = createSignal(0);
  const [isAnimating, setIsAnimating] = createSignal(false);
  const [autoIncrement, setAutoIncrement] = createSignal(false);

  let intervalId: number | undefined;

  createEffect(() => {
    if (autoIncrement()) {
      intervalId = window.setInterval(() => {
        setCount(prev => prev + 1);
        triggerAnimation();
      }, 1000);
    } else {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    }
  });

  onCleanup(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  const triggerAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const increment = () => {
    setCount(prev => prev + 1);
    triggerAnimation();
  };

  const decrement = () => {
    setCount(prev => prev - 1);
    triggerAnimation();
  };

  const reset = () => {
    setCount(0);
    triggerAnimation();
  };

  return (
    <div class="relative w-full h-64 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl overflow-hidden flex items-center justify-center">
      <div class="text-center text-white relative z-10">
        <h3 class="text-xl font-semibold mb-4">Solid.js Reactive Counter</h3>
        
        <div 
          class={`text-6xl font-bold mb-6 transition-all duration-300 ${
            isAnimating() ? 'scale-110 text-yellow-300' : 'scale-100'
          }`}
        >
          {count()}
        </div>
        
        <div class="space-x-4">
          <button
            onClick={decrement}
            class="px-6 py-2 bg-white/20 backdrop-blur-md rounded-lg border border-white/30 hover:bg-white/30 transition-all duration-200"
          >
            -
          </button>
          
          <button
            onClick={increment}
            class="px-6 py-2 bg-green-500/80 backdrop-blur-md rounded-lg border border-green-400/50 hover:bg-green-500 transition-all duration-200"
          >
            +
          </button>
          
          <button
            onClick={reset}
            class="px-6 py-2 bg-red-500/80 backdrop-blur-md rounded-lg border border-red-400/50 hover:bg-red-500 transition-all duration-200"
          >
            Reset
          </button>
        </div>
        
        <div class="mt-4">
          <button
            onClick={() => setAutoIncrement(!autoIncrement())}
            class={`px-4 py-2 rounded-lg transition-all duration-200 ${
              autoIncrement() 
                ? 'bg-yellow-500/80 border border-yellow-400/50' 
                : 'bg-white/20 border border-white/30'
            }`}
          >
            Auto: {autoIncrement() ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
      
      <div 
        class="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-pink-600/30 opacity-50"
        style={{
          animation: isAnimating() ? 'pulse 0.6s ease-in-out' : 'none'
        }}
      />
    </div>
  );
}
