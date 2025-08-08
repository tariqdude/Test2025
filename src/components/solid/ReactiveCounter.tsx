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
    <div className="relative flex h-64 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-green-400 to-blue-500">
      <div className="relative z-10 text-center text-white">
        <h3 className="mb-4 text-xl font-semibold">
          Solid.js Reactive Counter
        </h3>

        <div
          className={`mb-6 text-6xl font-bold transition-all duration-300 ${
            isAnimating() ? 'scale-110 text-yellow-300' : 'scale-100'
          }`}
        >
          {count()}
        </div>

        <div className="space-x-4">
          <button
            onClick={decrement}
            className="rounded-lg border border-white/30 bg-white/20 px-6 py-2 backdrop-blur-md transition-all duration-200 hover:bg-white/30"
          >
            -
          </button>

          <button
            onClick={increment}
            className="rounded-lg border border-green-400/50 bg-green-500/80 px-6 py-2 backdrop-blur-md transition-all duration-200 hover:bg-green-500"
          >
            +
          </button>

          <button
            onClick={reset}
            className="rounded-lg border border-red-400/50 bg-red-500/80 px-6 py-2 backdrop-blur-md transition-all duration-200 hover:bg-red-500"
          >
            Reset
          </button>
        </div>

        <div className="mt-4">
          <button
            onClick={() => setAutoIncrement(!autoIncrement())}
            className={`rounded-lg px-4 py-2 transition-all duration-200 ${
              autoIncrement()
                ? 'border border-yellow-400/50 bg-yellow-500/80'
                : 'border border-white/30 bg-white/20'
            }`}
          >
            Auto: {autoIncrement() ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div
        className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-pink-600/30 opacity-50"
        style={{
          animation: isAnimating() ? 'pulse 0.6s ease-in-out' : 'none',
        }}
      />
    </div>
  );
}
