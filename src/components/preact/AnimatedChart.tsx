import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'preact/hooks';

// ===============================================
// INTERFACES & TYPES
// ===============================================

interface DataPoint {
  id: string;
  label: string;
  value: number;
  color: string;
  gradient?: string;
  category?: string;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
}

interface ChartError {
  type: 'validation' | 'animation' | 'data' | 'render';
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
}

interface AnimationConfig {
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
  delay: number;
  stagger: number;
}

interface ChartTheme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  accent: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  border: string;
  shadow: string;
  gradients: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

interface ChartProps {
  title?: string;
  subtitle?: string;
  height?: number;
  theme?: 'dark' | 'light' | 'auto';
  showLegend?: boolean;
  showTooltips?: boolean;
  enableInteraction?: boolean;
  animationConfig?: Partial<AnimationConfig>;
  onDataChange?: (data: DataPoint[]) => void;
  onError?: (error: ChartError) => void;
  className?: string;
}

// ===============================================
// THEME SYSTEM
// ===============================================

const themes: Record<string, ChartTheme> = {
  dark: {
    primary: '#8b5cf6',
    secondary: '#06b6d4',
    background: 'rgb(17 24 39)',
    surface: 'rgb(31 41 55)',
    accent: '#ec4899',
    text: {
      primary: '#f9fafb',
      secondary: '#d1d5db',
      muted: '#9ca3af',
    },
    border: 'rgb(75 85 99)',
    shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    gradients: {
      primary: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
      secondary: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
      accent: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    },
  },
  light: {
    primary: '#6366f1',
    secondary: '#0ea5e9',
    background: '#ffffff',
    surface: '#f8fafc',
    accent: '#e11d48',
    text: {
      primary: '#1f2937',
      secondary: '#4b5563',
      muted: '#6b7280',
    },
    border: '#e5e7eb',
    shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    gradients: {
      primary: 'linear-gradient(135deg, #6366f1 0%, #e11d48 100%)',
      secondary: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
      accent: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    },
  },
};

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

const validateDataPoint = (point: DataPoint): ChartError | null => {
  if (!point.id || typeof point.id !== 'string') {
    return {
      type: 'validation',
      message: `Invalid ID for data point: ${JSON.stringify(point)}`,
      timestamp: new Date(),
      severity: 'high',
    };
  }
  if (
    typeof point.value !== 'number' ||
    isNaN(point.value) ||
    point.value < 0
  ) {
    return {
      type: 'validation',
      message: `Invalid value for ${point.label}: ${point.value}`,
      timestamp: new Date(),
      severity: 'medium',
    };
  }
  if (!point.color || !/^#[0-9A-F]{6}$/i.test(point.color)) {
    return {
      type: 'validation',
      message: `Invalid color for ${point.label}: ${point.color}`,
      timestamp: new Date(),
      severity: 'low',
    };
  }
  return null;
};

const generateRandomDataPoint = (label: string, color: string): DataPoint => ({
  id: `${label.toLowerCase()}-${Date.now()}`,
  label,
  value: Math.round(Math.random() * 100),
  color,
  gradient: `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`,
  trend: Math.random() > 0.5 ? 'up' : 'down',
  trendValue: Math.round(Math.random() * 20),
  description: `${label} framework usage percentage`,
});

const getEasingFunction = (easing: AnimationConfig['easing']) => {
  const easings = {
    linear: (t: number) => t,
    'ease-in': (t: number) => t * t,
    'ease-out': (t: number) => 1 - Math.pow(1 - t, 2),
    'ease-in-out': (t: number) =>
      t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    bounce: (t: number) => {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
  };
  return easings[easing] || easings.linear;
};

// ===============================================
// MAIN COMPONENT
// ===============================================

export default function EnhancedPreactChart({
  title = 'Framework Usage Analytics',
  subtitle = 'Real-time popularity metrics with advanced animations',
  height = 400,
  theme = 'dark',
  showLegend = true,
  showTooltips = true,
  enableInteraction = true,
  animationConfig = {},
  onDataChange,
  onError,
  className = '',
}: ChartProps) {
  // Note: showLegend is available but not used in current implementation
  void showLegend;

  // ===============================================
  // STATE MANAGEMENT
  // ===============================================

  const [data, setData] = useState<DataPoint[]>([
    {
      id: 'react-1',
      label: 'React',
      value: 75,
      color: '#61dafb',
      gradient: 'linear-gradient(135deg, #61dafb 0%, #21759b 100%)',
      trend: 'up',
      trendValue: 5.2,
      description: 'Most popular JavaScript library for building UIs',
      category: 'framework',
    },
    {
      id: 'vue-1',
      label: 'Vue',
      value: 65,
      color: '#4fc08d',
      gradient: 'linear-gradient(135deg, #4fc08d 0%, #42b883 100%)',
      trend: 'up',
      trendValue: 3.8,
      description: 'Progressive JavaScript framework',
      category: 'framework',
    },
    {
      id: 'svelte-1',
      label: 'Svelte',
      value: 45,
      color: '#ff3e00',
      gradient: 'linear-gradient(135deg, #ff3e00 0%, #ff8a00 100%)',
      trend: 'up',
      trendValue: 12.5,
      description: 'Compile-time framework with no virtual DOM',
      category: 'framework',
    },
    {
      id: 'solid-1',
      label: 'Solid',
      value: 35,
      color: '#2c4f7c',
      gradient: 'linear-gradient(135deg, #2c4f7c 0%, #76b3f3 100%)',
      trend: 'up',
      trendValue: 8.3,
      description: 'Fine-grained reactive JavaScript library',
      category: 'framework',
    },
    {
      id: 'preact-1',
      label: 'Preact',
      value: 28,
      color: '#673ab8',
      gradient: 'linear-gradient(135deg, #673ab8 0%, #9c27b0 100%)',
      trend: 'stable',
      trendValue: 1.2,
      description: 'Fast 3kB alternative to React',
      category: 'framework',
    },
  ]);

  const [animatedData, setAnimatedData] = useState<DataPoint[]>(
    data.map(d => ({ ...d, value: 0 }))
  );
  const [errors, setErrors] = useState<ChartError[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<
    'percentage' | 'absolute' | 'comparative'
  >('percentage');
  const [showStats, setShowStats] = useState(true);
  const animationRef = useRef<number>();

  // ===============================================
  // CONFIGURATION
  // ===============================================

  const config: AnimationConfig = useMemo(
    () => ({
      duration: 1000,
      easing: 'ease-out',
      delay: 0,
      stagger: 100,
      ...animationConfig,
    }),
    [animationConfig]
  );

  const currentTheme = useMemo(() => themes[theme] || themes.dark, [theme]);

  // ===============================================
  // ERROR HANDLING
  // ===============================================

  const handleError = useCallback(
    (error: ChartError) => {
      setErrors(prev => [...prev.slice(-9), error]);
      onError?.(error);
      if (
        typeof window !== 'undefined' &&
        typeof window.dispatchEvent === 'function'
      ) {
        window.dispatchEvent(
          new CustomEvent<ChartError>('animated-chart:error', {
            detail: error,
          })
        );
      }
    },
    [onError]
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // ===============================================
  // DATA MANAGEMENT
  // ===============================================

  const validateData = useCallback(
    (newData: DataPoint[]) => {
      const validationErrors: ChartError[] = [];
      newData.forEach(point => {
        const error = validateDataPoint(point);
        if (error) validationErrors.push(error);
      });

      if (validationErrors.length > 0) {
        validationErrors.forEach(handleError);
        return false;
      }
      return true;
    },
    [handleError]
  );

  const maxValue = useMemo(() => {
    const max = Math.max(...data.map(d => d.value));
    return max > 0 ? max : 100;
  }, [data]);

  const totalValue = useMemo(
    () => data.reduce((sum, item) => sum + item.value, 0),
    [data]
  );

  const averageValue = useMemo(
    () => (data.length > 0 ? totalValue / data.length : 0),
    [totalValue, data.length]
  );

  // ===============================================
  // ANIMATION SYSTEM
  // ===============================================

  const animateToTargets = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    const startTime = Date.now();
    const easingFn = getEasingFunction(config.easing);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / config.duration, 1);
      const _easedProgress = easingFn(progress);

      setAnimatedData(prev =>
        prev.map((item, index) => {
          const target = data[index];
          if (!target) return item;

          const staggerDelay = index * config.stagger;
          const adjustedProgress = Math.max(
            0,
            Math.min(1, (elapsed - staggerDelay) / config.duration)
          );
          const easedStaggerProgress = easingFn(adjustedProgress);

          return {
            ...item,
            value:
              item.value + (target.value - item.value) * easedStaggerProgress,
          };
        })
      );

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setAnimatedData(data);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [data, config, isAnimating]);

  // ===============================================
  // EFFECTS
  // ===============================================

  useEffect(() => {
    if (validateData(data)) {
      animateToTargets();
      onDataChange?.(data);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data, validateData, animateToTargets, onDataChange]);

  // ===============================================
  // EVENT HANDLERS
  // ===============================================

  const shuffleData = useCallback(() => {
    try {
      const newData = data.map(item => ({
        ...item,
        value: Math.round(Math.random() * 100),
        trend: (Math.random() > 0.5 ? 'up' : 'down') as 'up' | 'down',
        trendValue: Math.round(Math.random() * 20),
      }));
      setData(newData);
    } catch (error) {
      handleError({
        type: 'data',
        message: `Failed to shuffle data: ${error}`,
        timestamp: new Date(),
        severity: 'medium',
      });
    }
  }, [data, handleError]);

  const addRandomFramework = useCallback(() => {
    const frameworks = ['Angular', 'Ember', 'Backbone', 'Knockout', 'Alpine'];
    const colors = ['#dd0031', '#e04e39', '#0071b5', '#8dc63f', '#8bc34a'];
    const available = frameworks.filter(f => !data.some(d => d.label === f));

    if (available.length === 0) return;

    const randomFramework =
      available[Math.floor(Math.random() * available.length)];
    const randomColor = colors[frameworks.indexOf(randomFramework)];

    const newPoint = generateRandomDataPoint(randomFramework, randomColor);
    setData(prev => [...prev, newPoint]);
  }, [data]);

  const removeFramework = useCallback(
    (id: string) => {
      setData(prev => prev.filter(item => item.id !== id));
      if (selectedItem === id) setSelectedItem(null);
    },
    [selectedItem]
  );

  const resetData = useCallback(() => {
    setData([
      {
        id: 'react-reset',
        label: 'React',
        value: 75,
        color: '#61dafb',
        gradient: 'linear-gradient(135deg, #61dafb 0%, #21759b 100%)',
        trend: 'up',
        trendValue: 5.2,
        description: 'Most popular JavaScript library for building UIs',
      },
      {
        id: 'vue-reset',
        label: 'Vue',
        value: 65,
        color: '#4fc08d',
        gradient: 'linear-gradient(135deg, #4fc08d 0%, #42b883 100%)',
        trend: 'up',
        trendValue: 3.8,
        description: 'Progressive JavaScript framework',
      },
    ]);
  }, []);

  // ===============================================
  // RENDER HELPERS
  // ===============================================

  const renderTrendIcon = (trend: DataPoint['trend']) => {
    const icons = {
      up: '↗️',
      down: '↘️',
      stable: '➡️',
    };
    return icons[trend || 'stable'];
  };

  const renderTooltip = (item: DataPoint, _index: number) => {
    if (!showTooltips || selectedItem !== item.id) return null;

    return (
      <div
        className="absolute z-50 min-w-64 rounded-lg border border-gray-700 bg-gray-900 p-3 text-white shadow-xl"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          top: '-100%',
          marginTop: '-8px',
        }}
      >
        <div className="mb-1 text-sm font-semibold">{item.label}</div>
        <div className="mb-2 text-xs text-gray-300">{item.description}</div>
        <div className="flex items-center justify-between text-xs">
          <span>Value: {Math.round(item.value)}%</span>
          <span className="flex items-center gap-1">
            {renderTrendIcon(item.trend)}
            {item.trendValue}%
          </span>
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full transform">
          <div className="h-0 w-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
        </div>
      </div>
    );
  };

  const renderErrorPanel = () => {
    if (errors.length === 0) return null;

    return (
      <div className="mb-4 rounded-lg border border-red-700/50 bg-red-900/20 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-red-400">
            Chart Errors ({errors.length})
          </h4>
          <button
            onClick={clearErrors}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Clear
          </button>
        </div>
        <div className="max-h-20 space-y-1 overflow-y-auto">
          {errors.slice(-3).map((error, index) => (
            <div key={index} className="text-xs text-red-300">
              [{error.severity.toUpperCase()}] {error.message}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ===============================================
  // MAIN RENDER
  // ===============================================

  return (
    <div
      className={`w-full rounded-2xl border p-6 shadow-2xl transition-all duration-500 ${className}`}
      style={{
        height: `${height}px`,
        backgroundColor: currentTheme.surface,
        borderColor: currentTheme.border,
        boxShadow: currentTheme.shadow,
      }}
    >
      {/* Error Panel */}
      {renderErrorPanel()}

      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3
            className="mb-1 text-xl font-bold"
            style={{ color: currentTheme.text.primary }}
          >
            {title}
          </h3>
          <p className="text-sm" style={{ color: currentTheme.text.muted }}>
            {subtitle}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={shuffleData}
            disabled={isAnimating}
            className="rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50"
            style={{
              background: currentTheme.gradients.primary,
              color: currentTheme.text.primary,
            }}
          >
            🎲 Randomize
          </button>

          <button
            onClick={addRandomFramework}
            className="rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-105"
            style={{
              background: currentTheme.gradients.secondary,
              color: currentTheme.text.primary,
            }}
          >
            ➕ Add
          </button>

          <button
            onClick={resetData}
            className="rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: currentTheme.accent,
              color: currentTheme.text.primary,
            }}
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Stats Panel */}
      {showStats && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div
            className="rounded-lg border p-3"
            style={{
              backgroundColor: currentTheme.background,
              borderColor: currentTheme.border,
            }}
          >
            <div
              className="mb-1 text-xs font-medium"
              style={{ color: currentTheme.text.muted }}
            >
              Total
            </div>
            <div
              className="text-lg font-bold"
              style={{ color: currentTheme.text.primary }}
            >
              {Math.round(totalValue)}%
            </div>
          </div>

          <div
            className="rounded-lg border p-3"
            style={{
              backgroundColor: currentTheme.background,
              borderColor: currentTheme.border,
            }}
          >
            <div
              className="mb-1 text-xs font-medium"
              style={{ color: currentTheme.text.muted }}
            >
              Average
            </div>
            <div
              className="text-lg font-bold"
              style={{ color: currentTheme.text.primary }}
            >
              {Math.round(averageValue)}%
            </div>
          </div>

          <div
            className="rounded-lg border p-3"
            style={{
              backgroundColor: currentTheme.background,
              borderColor: currentTheme.border,
            }}
          >
            <div
              className="mb-1 text-xs font-medium"
              style={{ color: currentTheme.text.muted }}
            >
              Items
            </div>
            <div
              className="text-lg font-bold"
              style={{ color: currentTheme.text.primary }}
            >
              {data.length}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {animatedData.map((item, index) => (
          <div
            key={item.id}
            className="group relative cursor-pointer"
            onClick={() =>
              enableInteraction &&
              setSelectedItem(selectedItem === item.id ? null : item.id)
            }
          >
            {renderTooltip(item, index)}

            <div className="flex items-center space-x-4">
              {/* Label */}
              <div className="w-20 flex-shrink-0 text-sm font-medium">
                <div
                  style={{ color: currentTheme.text.secondary }}
                  className="truncate"
                >
                  {item.label}
                </div>
                {item.trend && (
                  <div className="mt-1 flex items-center gap-1 text-xs">
                    <span>{renderTrendIcon(item.trend)}</span>
                    <span style={{ color: currentTheme.text.muted }}>
                      {item.trendValue}%
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div
                className="relative h-6 flex-1 overflow-hidden rounded-full border transition-all duration-300"
                style={{
                  backgroundColor: currentTheme.background,
                  borderColor: currentTheme.border,
                }}
              >
                <div
                  className="relative h-full overflow-hidden rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.max(0, Math.min(100, (item.value / maxValue) * 100))}%`,
                    background: item.gradient || item.color,
                    boxShadow: `0 0 20px ${item.color}40`,
                  }}
                >
                  {/* Animated shine effect */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    style={{
                      animation: `shimmer 2s ease-in-out infinite`,
                      animationDelay: `${index * 0.2}s`,
                    }}
                  />

                  {/* Pattern overlay */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: `repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 2px,
                        rgba(255,255,255,0.1) 2px,
                        rgba(255,255,255,0.1) 4px
                      )`,
                    }}
                  />
                </div>
              </div>

              {/* Value Display */}
              <div className="w-16 text-right text-sm font-bold">
                <div style={{ color: currentTheme.text.primary }}>
                  {Math.round(item.value)}%
                </div>
                {chartMode === 'comparative' && (
                  <div
                    className="text-xs"
                    style={{ color: currentTheme.text.muted }}
                  >
                    {Math.round((item.value / totalValue) * 100)}%
                  </div>
                )}
              </div>

              {/* Remove Button */}
              {enableInteraction && data.length > 2 && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    removeFramework(item.id);
                  }}
                  className="h-6 w-6 rounded-full text-xs opacity-0 transition-colors duration-200 hover:bg-red-500/20 group-hover:opacity-100"
                  style={{ color: currentTheme.accent }}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="mt-4 flex items-center justify-between border-t pt-4 text-xs"
        style={{
          borderColor: currentTheme.border,
          color: currentTheme.text.muted,
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 animate-pulse rounded-full"
            style={{
              backgroundColor: isAnimating
                ? currentTheme.accent
                : currentTheme.primary,
            }}
          />
          <span>
            {isAnimating ? 'Animating...' : 'Ready'} • Preact Chart •{' '}
            {data.length} items
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="transition-opacity hover:opacity-70"
          >
            📊
          </button>
          <button
            onClick={() =>
              setChartMode(
                chartMode === 'percentage'
                  ? 'absolute'
                  : chartMode === 'absolute'
                    ? 'comparative'
                    : 'percentage'
              )
            }
            className="transition-opacity hover:opacity-70"
          >
            {chartMode === 'percentage'
              ? '%'
              : chartMode === 'absolute'
                ? '#'
                : '📈'}
          </button>
        </div>
      </div>

      {/* CSS-in-JS for animations */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
