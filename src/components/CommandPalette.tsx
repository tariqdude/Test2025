import { useState, useEffect, useRef } from 'preact/hooks';
import { navigate } from 'astro:transitions/client';
import {
  Search,
  Command,
  Moon,
  Sun,
  Monitor,
  FileText,
  Home,
  Box,
  X,
  User,
  Layout,
  type LucideIcon,
} from 'lucide-preact';
import Fuse from 'fuse.js';
import { setTheme } from '../store/theme';

interface CommandItem {
  id: string;
  label: string;
  icon: LucideIcon;
  action: () => void;
  category: 'Navigation' | 'Theme' | 'Actions' | 'Blog' | 'Authors' | 'Page';
  keywords?: string[];
  description?: string;
}

interface SearchIndexItem {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  date: string;
  tags: string[];
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchItems, setSearchItems] = useState<CommandItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Define commands
  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-home',
      label: 'Go to Home',
      icon: Home,
      action: () => navigate('/'),
      category: 'Navigation',
    },
    {
      id: 'nav-blog',
      label: 'Go to Blog',
      icon: FileText,
      action: () => navigate('/blog'),
      category: 'Navigation',
    },
    {
      id: 'nav-showcase',
      label: 'Go to Showcase',
      icon: Box,
      action: () => navigate('/showcase'),
      category: 'Navigation',
    },
    {
      id: 'nav-components',
      label: 'Go to Components',
      icon: Layout,
      action: () => navigate('/components'),
      category: 'Navigation',
    },
    // Theme
    {
      id: 'theme-ops',
      label: 'Theme: Ops Center',
      icon: Moon,
      action: () => setTheme('ops-center'),
      category: 'Theme',
      keywords: ['dark', 'neon'],
    },
    {
      id: 'theme-corp',
      label: 'Theme: Corporate',
      icon: Sun,
      action: () => setTheme('corporate'),
      category: 'Theme',
      keywords: ['light', 'clean'],
    },
    {
      id: 'theme-term',
      label: 'Theme: Terminal',
      icon: Monitor,
      action: () => setTheme('terminal'),
      category: 'Theme',
      keywords: ['hacker', 'green'],
    },
  ];

  useEffect(() => {
    const fetchSearchIndex = async () => {
      try {
        const response = await fetch('/search-index.json');
        if (!response.ok) return;
        const data = await response.json();
        const items = data.map((item: SearchIndexItem) => {
          let icon = FileText;
          if (item.category === 'Authors') icon = User;
          if (item.category === 'Page') icon = Layout;

          return {
            id: item.id,
            label: item.title,
            icon,
            action: () => navigate(item.url),
            category: item.category as CommandItem['category'],
            keywords: item.tags,
            description: item.description,
          };
        });
        setSearchItems(items);
      } catch (e) {
        console.error('Failed to load search index', e);
      }
    };

    if (isOpen && searchItems.length === 0) {
      fetchSearchIndex();
    }
  }, [isOpen]);

  const allCommands = [...commands, ...searchItems];

  // Fuzzy search setup
  const fuse = new Fuse(allCommands, {
    keys: ['label', 'category', 'keywords', 'description'],
    threshold: 0.3,
  });

  const filteredCommands = query
    ? fuse.search(query).map(result => result.item)
    : allCommands;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Navigation within list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const command = filteredCommands[selectedIndex];
        if (command) {
          command.action();
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="animate-in fade-in zoom-in-95 relative w-full max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-2xl duration-200">
        {/* Search Input */}
        <div className="flex items-center border-b border-white/10 px-4 py-3">
          <Search className="mr-3 h-5 w-5 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-lg text-white placeholder-zinc-500 focus:outline-none"
            placeholder="Type a command or search..."
            value={query}
            onInput={e => {
              setQuery((e.target as HTMLInputElement).value);
              setSelectedIndex(0);
            }}
          />
          <div className="flex items-center gap-2">
            <kbd className="hidden rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-400 sm:inline-block">
              ESC
            </kbd>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              aria-label="Close command palette"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <p>No results found.</p>
            </div>
          ) : (
            <ul ref={listRef} className="space-y-1">
              {filteredCommands.map((command, index) => {
                const Icon = command.icon;
                const isSelected = index === selectedIndex;

                return (
                  <li
                    key={command.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                    onClick={() => {
                      command.action();
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <Icon
                      className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-zinc-400'}`}
                    />
                    <div className="flex flex-1 flex-col">
                      <span className="font-medium">{command.label}</span>
                      <span
                        className={`text-xs ${isSelected ? 'text-indigo-200' : 'text-zinc-500'}`}
                      >
                        {command.category}
                      </span>
                    </div>
                    {isSelected && (
                      <Command className="h-4 w-4 text-indigo-200" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-zinc-900/50 px-4 py-2 text-xs text-zinc-500">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <span>
                <kbd className="font-sans">↑↓</kbd> to navigate
              </span>
              <span>
                <kbd className="font-sans">↵</kbd> to select
              </span>
            </div>
            <span>
              <kbd className="font-sans">Cmd K</kbd> to open
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
