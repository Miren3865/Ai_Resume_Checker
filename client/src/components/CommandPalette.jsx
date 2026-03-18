import { useEffect, useMemo, useRef, useState } from 'react';
import { Command } from 'cmdk';
import {
  BriefcaseBusiness,
  ChevronRight,
  FileUp,
  Flame,
  Gauge,
  Search,
  Swords,
} from 'lucide-react';

const ACTIONS = [
  {
    id: 'upload-resume',
    label: 'Upload Resume',
    description: 'Jump to the resume upload workspace',
    to: '/resumes',
    icon: FileUp,
  },
  {
    id: 'add-job',
    label: 'Add Job Description',
    description: 'Create or edit a hiring requirement',
    to: '/jobs',
    icon: BriefcaseBusiness,
  },
  {
    id: 'run-evaluation',
    label: 'Run Evaluation',
    description: 'Start an AI scoring session',
    to: '/evaluations/new',
    icon: Gauge,
  },
  {
    id: 'resume-battle',
    label: 'Resume Battle',
    description: 'Compare multiple candidates instantly',
    to: '/battle',
    icon: Swords,
  },
];

export default function CommandPalette({ navigate }) {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const commandRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
        setSelectedIndex(0);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      const maxIndex = ACTIONS.length - 1;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < maxIndex ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedAction = ACTIONS[selectedIndex];
        if (selectedAction) {
          onSelect(selectedAction.to);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };

    // Listen on the command ref element specifically
    const element = commandRef.current;
    if (element) {
      element.addEventListener('keydown', handleKeyDown);
      return () => element.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, selectedIndex]);

  const onSelect = (path) => {
    setOpen(false);
    setSelectedIndex(0);
    navigate(path);
  };

  const actions = useMemo(() => ACTIONS, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-8 top-5 z-[60] hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 backdrop-blur-xl transition hover:border-purple-400/45 hover:text-white lg:flex"
        style={{ boxShadow: '0 0 20px rgba(99,102,241,0.2)' }}
      >
        <Search size={13} />
        <span>Command</span>
        <kbd className="rounded-md border border-white/15 bg-black/40 px-1.5 py-0.5 text-[10px] text-slate-400">Ctrl K</kbd>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[80] bg-[#04050e]/65 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <Command
            ref={commandRef}
            label="Global Command Menu"
            className="fixed left-1/2 top-[14%] z-[90] w-[min(640px,92vw)] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-[#090b16]/95 text-slate-100 shadow-[0_0_60px_rgba(99,102,241,0.45)] backdrop-blur-2xl"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(168,85,247,0.2),transparent_34%),radial-gradient(circle_at_90%_80%,rgba(6,182,212,0.15),transparent_36%)]" />

            <div className="relative border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <Search size={16} className="text-indigo-300" />
                <Command.Input
                  autoFocus
                  placeholder="Search actions, pages, commands..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="relative max-h-[380px] overflow-y-auto p-2">
              <Command.Group heading="Quick Actions" className="space-y-1">
                {actions.map((action, idx) => {
                  const Icon = action.icon;
                  const isSelected = selectedIndex === idx;
                  return (
                    <Command.Item
                      key={action.id}
                      value={action.label}
                      onSelect={() => onSelect(action.to)}
                      className={`group flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition aria-selected:border-indigo-400/45 aria-selected:bg-indigo-500/15 ${
                        isSelected
                          ? 'border-indigo-400/45 bg-indigo-500/15'
                          : 'border-transparent text-slate-200 hover:border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="rounded-lg border border-white/10 bg-white/5 p-2 text-indigo-200">
                          <Icon size={14} />
                        </span>
                        <span>
                          <span className="block font-semibold">{action.label}</span>
                          <span className="block text-xs text-slate-400">{action.description}</span>
                        </span>
                      </span>

                      <span className={`flex items-center gap-1 text-xs transition ${
                        isSelected ? 'text-indigo-200' : 'text-slate-400'
                      }`}>
                        Run
                        <ChevronRight size={12} />
                      </span>
                    </Command.Item>
                  );
                })}
              </Command.Group>

              <div className="mt-2 rounded-xl border border-purple-500/20 bg-purple-500/10 px-3 py-2 text-xs text-purple-100">
                <div className="mb-0.5 flex items-center gap-2 font-semibold">
                  <Flame size={12} />
                  Pro tip
                </div>
                Use arrow keys to navigate and press Enter to launch an action.
              </div>
            </div>
          </Command>
        </>
      )}
    </>
  );
}
