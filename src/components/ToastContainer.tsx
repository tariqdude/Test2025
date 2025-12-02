/**
 * Toast Notification Component
 * Displays notifications from the store notification system
 * Uses our accessibility utilities for screen reader announcements
 */

import { useStore } from '@nanostores/preact';
import {
  notifications,
  dismissNotification,
  type Notification,
} from '../store/index';
import { announce } from '../utils/a11y';
import { useEffect, useState } from 'preact/hooks';
import {
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  type LucideIcon,
} from 'lucide-preact';

interface ToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const iconMap: Record<Notification['type'], LucideIcon> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap: Record<Notification['type'], string> = {
  success: 'bg-green-500/10 border-green-500/30 text-green-400',
  error: 'bg-red-500/10 border-red-500/30 text-red-400',
  warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
};

const iconColorMap: Record<Notification['type'], string> = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
};

function Toast({ notification, onDismiss }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const Icon = iconMap[notification.type];
  const colors = colorMap[notification.type];
  const iconColor = iconColorMap[notification.type];

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 200);
  };

  // Auto-dismiss after duration
  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  // Announce to screen readers when notification appears
  useEffect(() => {
    const type = notification.type;
    const priority =
      type === 'error' || type === 'warning' ? 'assertive' : 'polite';
    announce(
      `${notification.title || type}: ${notification.message}`,
      priority
    );
  }, []);

  // Determine aria attributes
  const isAlert = notification.type === 'error';

  // Using separate render paths to satisfy ESLint a11y rules
  const baseClassName = `
    flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm
    shadow-lg max-w-sm w-full
    transition-all duration-200 ease-out
    ${colors}
    ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
  `;

  const content = (
    <>
      <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${iconColor}`} />

      <div className="min-w-0 flex-1">
        {notification.title && (
          <h4 className="mb-1 text-sm font-semibold">{notification.title}</h4>
        )}
        <p className="text-sm opacity-90">{notification.message}</p>

        {notification.action && (
          <button
            onClick={() => {
              notification.action!.onClick();
              handleDismiss();
            }}
            className="mt-2 text-sm font-medium underline underline-offset-2 transition-opacity hover:opacity-80"
          >
            {notification.action.label}
          </button>
        )}
      </div>

      <button
        onClick={handleDismiss}
        className="flex-shrink-0 rounded p-1 transition-colors hover:bg-white/10"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </>
  );

  // Render with appropriate ARIA role
  if (isAlert) {
    return (
      <div className={baseClassName} role="alert" aria-live="assertive">
        {content}
      </div>
    );
  }

  return (
    <div className={baseClassName} role="status" aria-live="polite">
      {content}
    </div>
  );
}

export default function ToastContainer() {
  const $notifications = useStore(notifications);

  const handleDismiss = (id: string) => {
    dismissNotification(id);
  };

  if ($notifications.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2"
      aria-label="Notifications"
    >
      {$notifications.map(notification => (
        <Toast
          key={notification.id}
          notification={notification}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
}
