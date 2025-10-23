/** @jsxImportSource preact */
import clsx from 'clsx';
import type { FunctionalComponent } from 'preact';

interface Metric {
  id: string;
  label: string;
  summary: string;
  value: string;
  delta: string;
  widthClass: string;
  gradientClass: string;
  trend: 'up' | 'down' | 'stable';
}

interface AnimatedChartProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

const trendIcon: Record<Metric['trend'], string> = {
  up: '▲',
  down: '▼',
  stable: '◆',
};

const trendLabel: Record<Metric['trend'], string> = {
  up: 'Positive trend',
  down: 'Negative trend',
  stable: 'Stable trend',
};

const trendColour: Record<Metric['trend'], string> = {
  up: 'text-emerald-300',
  down: 'text-rose-300',
  stable: 'text-slate-300',
};

const defaultMetrics: Metric[] = [
  {
    id: 'astro',
    label: 'Astro',
    summary: 'Static-first experience layer tuned for GitHub Pages.',
    value: '92%',
    delta: '+6.4%',
    widthClass: 'w-[92%] sm:w-[88%] lg:w-[92%]',
    gradientClass: 'from-indigo-400 via-purple-400 to-sky-400',
    trend: 'up',
  },
  {
    id: 'svelte',
    label: 'Svelte',
    summary: 'Compile-time interactivity for focused widgets.',
    value: '76%',
    delta: '+3.2%',
    widthClass: 'w-[76%] sm:w-[70%] lg:w-[76%]',
    gradientClass: 'from-emerald-400 via-lime-400 to-teal-400',
    trend: 'up',
  },
  {
    id: 'preact',
    label: 'Preact',
    summary: 'Lightweight islands when hydration is unavoidable.',
    value: '54%',
    delta: '+1.1%',
    widthClass: 'w-[54%] sm:w-[50%] lg:w-[54%]',
    gradientClass: 'from-sky-400 via-cyan-400 to-blue-400',
    trend: 'stable',
  },
  {
    id: 'vue',
    label: 'Vue',
    summary: 'Progressive enhancement for team dashboards.',
    value: '41%',
    delta: '-0.6%',
    widthClass: 'w-[41%] sm:w-[46%] lg:w-[41%]',
    gradientClass: 'from-emerald-300 via-emerald-400 to-emerald-500',
    trend: 'down',
  },
];

const AnimatedChart: FunctionalComponent<AnimatedChartProps> = ({
  title = 'Framework adoption snapshot',
  subtitle = 'Usage share across the components included in Elite Project.',
  className = '',
}) => {
  return (
    <section
      className={clsx(
        'glass-panel border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl',
        className
      )}
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
            Tech stack pulse
          </p>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            {title}
          </h2>
          <p className="max-w-xl text-sm text-slate-300">{subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-slate-300">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Growth signals
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            Watchlist
          </span>
        </div>
      </header>

      <div className="mt-8 space-y-6">
        {defaultMetrics.map(metric => (
          <article
            key={metric.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-white">
                  {metric.label}
                </h3>
                <p className="text-sm text-slate-300">{metric.summary}</p>
              </div>

              <div className="flex items-center gap-4 text-right sm:text-left">
                <div className="text-2xl font-semibold text-white">
                  {metric.value}
                </div>
                <div
                  className={clsx(
                    'text-sm font-medium',
                    trendColour[metric.trend]
                  )}
                  aria-label={`${trendLabel[metric.trend]} ${metric.delta}`}
                >
                  {trendIcon[metric.trend]} {metric.delta}
                </div>
              </div>
            </div>

            <div className="relative mt-5 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className={clsx(
                  'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-700 ease-out',
                  metric.gradientClass,
                  metric.widthClass
                )}
                aria-hidden="true"
              />
            </div>
          </article>
        ))}
      </div>

      <footer className="mt-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-semibold text-white">Methodology:</span>{' '}
          Aggregated from six months of release metrics across static client
          portals.
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Rising adoption
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            Requires review
          </span>
        </div>
      </footer>
    </section>
  );
};

export default AnimatedChart;
