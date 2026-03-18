import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Search, X } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   Accent token map
   ───────────────────────────────────────────────────────────────────────────── */
const ACCENT = {
  purple: {
    triggerBorderIdle : 'border-purple-500/30',
    triggerBorderOpen : 'border-purple-500/60',
    triggerGlowOpen   : '0 0 0 3px rgba(168,85,247,0.15), 0 0 24px rgba(168,85,247,0.12)',
    panelBorder       : 'rgba(168,85,247,0.25)',
    panelShadow       : '0 32px 80px rgba(0,0,0,0.9), 0 0 40px rgba(168,85,247,0.10)',
    topLineFrom       : '#7c3aed',
    topLineVia        : '#a78bfa',
    topLineTo         : '#4f46e5',
    searchFocusBorder : 'rgba(168,85,247,0.55)',
    searchFocusRing   : '0 0 0 2px rgba(168,85,247,0.15)',
    itemActiveBg      : 'rgba(168,85,247,0.13)',
    itemActiveBorder  : '#a855f7',
    itemHoverBg       : 'rgba(168,85,247,0.07)',
    checkColor        : '#c084fc',
    chevronColor      : '#a855f7',
    avatarFrom        : '#7c3aed',
    avatarTo          : '#4338ca',
    avatarGlow        : '0 0 10px rgba(168,85,247,0.50)',
    dotBg             : '#a855f7',
    dotGlow           : '0 0 7px 2px rgba(168,85,247,0.70)',
    labelColor        : '#d8b4fe',
    scrollColor       : 'rgba(139,92,246,0.50)',
    scrollHoverColor  : 'rgba(139,92,246,0.80)',
    caret             : '#a855f7',
    ambientGlow       : 'rgba(139,92,246,0.06)',
  },
  blue: {
    triggerBorderIdle : 'border-blue-500/30',
    triggerBorderOpen : 'border-blue-500/60',
    triggerGlowOpen   : '0 0 0 3px rgba(59,130,246,0.15), 0 0 24px rgba(59,130,246,0.12)',
    panelBorder       : 'rgba(59,130,246,0.25)',
    panelShadow       : '0 32px 80px rgba(0,0,0,0.9), 0 0 40px rgba(59,130,246,0.10)',
    topLineFrom       : '#1d4ed8',
    topLineVia        : '#60a5fa',
    topLineTo         : '#0891b2',
    searchFocusBorder : 'rgba(59,130,246,0.55)',
    searchFocusRing   : '0 0 0 2px rgba(59,130,246,0.15)',
    itemActiveBg      : 'rgba(59,130,246,0.13)',
    itemActiveBorder  : '#3b82f6',
    itemHoverBg       : 'rgba(59,130,246,0.07)',
    checkColor        : '#60a5fa',
    chevronColor      : '#3b82f6',
    avatarFrom        : '#1d4ed8',
    avatarTo          : '#0891b2',
    avatarGlow        : '0 0 10px rgba(59,130,246,0.50)',
    dotBg             : '#3b82f6',
    dotGlow           : '0 0 7px 2px rgba(59,130,246,0.70)',
    labelColor        : '#93c5fd',
    scrollColor       : 'rgba(59,130,246,0.50)',
    scrollHoverColor  : 'rgba(59,130,246,0.80)',
    caret             : '#3b82f6',
    ambientGlow       : 'rgba(59,130,246,0.06)',
  },
};

/* inject custom scrollbar CSS once into <head> */
let _scrollInjected = false;
function ensureScrollbarCSS() {
  if (_scrollInjected || typeof document === 'undefined') return;
  _scrollInjected = true;
  const el = document.createElement('style');
  el.dataset.msScroll = '1';
  el.textContent = `
    .ms-options-list::-webkit-scrollbar { width: 4px; }
    .ms-options-list::-webkit-scrollbar-track { background: transparent; }
    .ms-options-list::-webkit-scrollbar-thumb {
      border-radius: 99px;
      background: var(--ms-scroll, rgba(139,92,246,0.45));
    }
    .ms-options-list::-webkit-scrollbar-thumb:hover {
      background: var(--ms-scroll-hover, rgba(139,92,246,0.75));
    }
  `;
  document.head.appendChild(el);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Initials avatar
   ───────────────────────────────────────────────────────────────────────────── */
function InitialsAvatar({ name = '?', from, to, glow, size = 36 }) {
  const letters = name
    .split(' ')
    .slice(0, 2)
    .map((w) => (w[0] || '').toUpperCase())
    .join('');
  return (
    <span
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: 8,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        boxShadow: glow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size > 30 ? 12 : 10,
        fontWeight: 700,
        color: '#fff',
        letterSpacing: '0.03em',
        flexShrink: 0,
      }}
    >
      {letters || '?'}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ModernSelect
   ───────────────────────────────────────────────────────────────────────────── */
/**
 * Props
 * ─────
 * value        string
 * onChange     (val: string) => void
 * options      Array<{ value: string; label: string; sub?: string }>
 * placeholder  string
 * accentColor  'purple' | 'blue'
 * label        string   (optional heading above trigger)
 */
export default function ModernSelect({
  value       = '',
  onChange,
  options     = [],
  placeholder = '— Select an option —',
  accentColor = 'purple',
  searchable  = false,
  label,
}) {
  const [open,     setOpen]     = useState(false);
  const [query,    setQuery]    = useState('');
  const [focusIdx, setFocusIdx] = useState(-1);
  const [rect,     setRect]     = useState(null);   // trigger bounding rect

  const triggerRef = useRef(null);
  const searchRef  = useRef(null);
  const listRef    = useRef(null);

  const ac = ACCENT[accentColor] ?? ACCENT.purple;

  /* ── derived ──────────────────────────────────────────────────────── */
  const selected = options.find((o) => o.value === value) ?? null;
  const filtered = searchable && query.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          (o.sub ?? '').toLowerCase().includes(query.toLowerCase()),
      )
    : options;

  /* ── measure trigger position (for portal placement) ─────────────── */
  const measureTrigger = useCallback(() => {
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
  }, []);

  /* ── open / close ─────────────────────────────────────────────────── */
  const openDropdown = () => {
    ensureScrollbarCSS();
    measureTrigger();
    const selectedIdx = options.findIndex((o) => o.value === value);
    setFocusIdx(selectedIdx >= 0 ? selectedIdx : 0);
    setOpen(true);
  };
  const closeDropdown = () => {
    setOpen(false);
    setFocusIdx(-1);
    if (searchable) {
      setQuery('');
    }
  };
  const toggleDropdown = () => (open ? closeDropdown() : openDropdown());

  /* ── reposition on scroll / resize while open ─────────────────────── */
  useEffect(() => {
    if (!open) return;
    const update = () => measureTrigger();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, measureTrigger]);

  /* ── scroll to selected row when opened ───────────────────────────── */
  useEffect(() => {
    if (open) {
      if (searchable) {
        setTimeout(() => searchRef.current?.focus(), 60);
      }
      setTimeout(() => {
        listRef.current
          ?.querySelector('[data-selected="true"]')
          ?.scrollIntoView({ block: 'nearest' });
      }, 90);
    }
  }, [open]);

  /* ── scroll focused row into view ─────────────────────────────────── */
  useEffect(() => {
    if (focusIdx < 0 || !listRef.current) return;
    listRef.current.children[focusIdx]?.scrollIntoView({ block: 'nearest' });
  }, [focusIdx]);

  /* ── close on outside click / Escape ──────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') closeDropdown(); };
    const onMouse = (e) => {
      /* close only if click is outside both trigger AND portal panel */
      if (
        triggerRef.current?.contains(e.target) === false &&
        document.getElementById('ms-portal-panel')?.contains(e.target) === false
      ) {
        closeDropdown();
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onMouse);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onMouse);
    };
  }, [open]);

  const onTriggerKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openDropdown();
      return;
    }

    if (!open || searchable) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIdx((i) => Math.min(i + 1, filtered.length - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIdx((i) => Math.max(i - 1, 0));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filtered[focusIdx];
      if (opt) {
        onChange(opt.value);
        closeDropdown();
      }
      return;
    }

    if (e.key === 'Escape' || e.key === 'Tab') {
      closeDropdown();
    }
  };

  const onSearchKeyDown = (e) => {
    if (!searchable) return;

    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIdx((i) => Math.min(i + 1, filtered.length - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIdx((i) => Math.max(i - 1, 0));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filtered[focusIdx];
      if (opt) {
        onChange(opt.value);
        closeDropdown();
      }
      return;
    }

    if (e.key === 'Escape' || e.key === 'Tab') {
      closeDropdown();
    }
  };

  const pickOption = (val) => { onChange(val); closeDropdown(); };

  /* ─────────────────────────────────────────────────────────────────── */
  /*  PORTAL PANEL                                                        */
  /* ─────────────────────────────────────────────────────────────────── */
  const portalContent = rect && (
    <AnimatePresence>
      {open && (
        <motion.div
          id="ms-portal-panel"
          key="ms-panel"
          initial={{ opacity: 0, scaleY: 0.93, y: -6 }}
          animate={{ opacity: 1, scaleY: 1.00, y: 0  }}
          exit  ={{ opacity: 0, scaleY: 0.93, y: -6  }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={{
            /* ── PORTAL POSITION ── never clipped by any parent ── */
            position  : 'fixed',
            top       : rect.bottom + 8,
            left      : rect.left,
            width     : rect.width,
            zIndex    : 99999,
            transformOrigin: 'top center',

            /* glass panel */
            background    : 'rgba(11,11,24,0.97)',
            backdropFilter: 'blur(28px)',
            border        : `1px solid ${ac.panelBorder}`,
            borderRadius  : 16,
            boxShadow     : ac.panelShadow,
            overflow      : 'hidden',      /* clip internal decorators only */
          }}
        >
          {/* neon top-line */}
          <div style={{
            height    : 2,
            background: `linear-gradient(90deg, ${ac.topLineFrom}, ${ac.topLineVia}, ${ac.topLineTo})`,
          }} />

          {/* ambient top glow */}
          <div style={{
            pointerEvents: 'none',
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${ac.ambientGlow} 0%, transparent 70%)`,
          }} />

          {searchable && (
            <>
              <div style={{ position: 'relative', padding: '10px 12px 8px' }}>
                <Search
                  size={13}
                  style={{
                    position: 'absolute', left: 24,
                    top: '50%', transform: 'translateY(-3px)',
                    color: '#6b7280', pointerEvents: 'none',
                  }}
                />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setFocusIdx(0);
                  }}
                  onKeyDown={onSearchKeyDown}
                  placeholder="Search..."
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 10,
                    padding: '8px 32px 8px 28px',
                    fontSize: 13,
                    color: '#fff',
                    outline: 'none',
                    caretColor: ac.caret,
                    transition: 'border-color .15s, box-shadow .15s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = ac.searchFocusBorder;
                    e.target.style.boxShadow   = ac.searchFocusRing;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.10)';
                    e.target.style.boxShadow   = 'none';
                  }}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setFocusIdx(0);
                      searchRef.current?.focus();
                    }}
                    style={{
                      position: 'absolute', right: 22,
                      top: '50%', transform: 'translateY(-3px)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#6b7280', display: 'flex', alignItems: 'center',
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 12px' }} />
            </>
          )}

          {/* ── options list ─────────────────────────────────
              max-h-60 + overflow-y-auto ensures ALL items render
              and shows a scrollbar when count exceeds visible area
          ─────────────────────────────────────────────────── */}
          <ul
            ref={listRef}
            className="ms-options-list"
            role="listbox"
            style={{
              /* ── MANDATORY SCROLL RULES ── */
              maxHeight    : 240,          /* = Tailwind max-h-60 */
              overflowY    : 'auto',       /* scroll when items exceed height */
              overflowX    : 'hidden',
              /* ── scrollbar CSS variable passthrough ── */
              '--ms-scroll'      : ac.scrollColor,
              '--ms-scroll-hover': ac.scrollHoverColor,
              padding: '8px 0',
              listStyle: 'none',
              margin: 0,
            }}
          >
            {filtered.length === 0 ? (
              <li style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '32px 16px', gap: 8, color: '#6b7280',
              }}>
                {searchable ? <Search size={20} style={{ opacity: 0.3 }} /> : null}
                <span style={{ fontSize: 12 }}>
                  {searchable ? `No results for "${query}"` : 'No options available'}
                </span>
              </li>
            ) : (
              filtered.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isFocused  = idx === focusIdx;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    data-selected={isSelected}
                    onClick={() => pickOption(opt.value)}
                    onMouseEnter={() => setFocusIdx(idx)}
                    style={{
                      display    : 'flex',
                      alignItems : 'center',
                      gap        : 10,
                      padding    : '9px 12px',
                      margin     : '0 6px',
                      borderRadius: 10,
                      cursor     : 'pointer',
                      borderLeft : isSelected
                        ? `2px solid ${ac.itemActiveBorder}`
                        : '2px solid transparent',
                      background : isSelected
                        ? ac.itemActiveBg
                        : isFocused
                        ? ac.itemHoverBg
                        : 'transparent',
                      transition : 'background .12s, border-color .12s',
                      boxSizing  : 'border-box',
                      userSelect : 'none',
                    }}
                  >
                    {/* avatar */}
                    <InitialsAvatar
                      name={opt.label}
                      from={isSelected ? ac.avatarFrom : '#374151'}
                      to={isSelected ? ac.avatarTo : '#1f2937'}
                      glow={isSelected ? ac.avatarGlow : 'none'}
                      size={32}
                    />

                    {/* text */}
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        display    : 'block',
                        fontSize   : 13,
                        fontWeight : isSelected ? 600 : 500,
                        color      : isSelected ? '#fff' : '#cbd5e1',
                        overflow   : 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace : 'nowrap',
                      }}>{opt.label}</span>
                      {opt.sub && (
                        <span style={{
                          display    : 'block',
                          fontSize   : 11,
                          color      : '#4b5563',
                          marginTop  : 2,
                          overflow   : 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace : 'nowrap',
                        }}>{opt.sub}</span>
                      )}
                    </span>

                    {/* checkmark / spacer */}
                    {isSelected
                      ? <Check size={14} strokeWidth={2.5} style={{ color: ac.checkColor, flexShrink: 0 }} />
                      : <span style={{ width: 14, flexShrink: 0 }} />
                    }
                  </li>
                );
              })
            )}
          </ul>

          {/* ── footer ──────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 16px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            <span style={{ fontSize: 11, color: '#4b5563' }}>
              {searchable ? `${filtered.length} of ${options.length}` : options.length} {options.length === 1 ? 'option' : 'options'}
            </span>
            {selected && (
              <button
                type="button"
                onClick={() => { onChange(''); closeDropdown(); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, color: '#4b5563', display: 'flex',
                  alignItems: 'center', gap: 3,
                  transition: 'color .15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#4b5563')}
              >
                <X size={10} /> Clear
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  /* ─────────────────────────────────────────────────────────────────── */
  /*  RENDER                                                              */
  /* ─────────────────────────────────────────────────────────────────── */
  return (
    <>
      {/* ── TRIGGER ─────────────────────────────────────────── */}
      {/*
          position:relative is on this wrapper.
          The panel is rendered via a portal into document.body,
          so it is NEVER clipped by any parent overflow:hidden.
      */}
      <div ref={triggerRef} style={{ position: 'relative', width: '100%' }}>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onKeyDown={onTriggerKeyDown}
          onClick={toggleDropdown}
          className={[
            'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left cursor-pointer outline-none',
            'border transition-all duration-200',
            open
              ? `bg-[rgba(14,14,28,0.9)] backdrop-blur-xl ${ac.triggerBorderOpen}`
              : `bg-[rgba(14,14,28,0.75)] backdrop-blur-xl ${ac.triggerBorderIdle}`,
          ].join(' ')}
          style={{ boxShadow: open ? ac.triggerGlowOpen : 'none', transition: 'box-shadow .2s, border-color .2s' }}
        >
          {/* avatar / placeholder icon */}
          {selected ? (
            <InitialsAvatar
              name={selected.label}
              from={ac.avatarFrom}
              to={ac.avatarTo}
              glow={ac.avatarGlow}
              size={36}
            />
          ) : (
            <span className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center bg-white/[.04] border border-white/10 text-gray-500">
              {searchable ? <Search size={15} /> : <ChevronDown size={15} />}
            </span>
          )}

          {/* label + sub */}
          <span className="flex-1 min-w-0">
            {selected ? (
              <>
                <span className="block text-sm font-semibold text-white truncate leading-tight">
                  {selected.label}
                </span>
                {selected.sub && (
                  <span className="block text-xs text-gray-500 truncate mt-0.5">
                    {selected.sub}
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm text-gray-500">{placeholder}</span>
            )}
          </span>

          {/* count badge */}
          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[.05] border border-white/10 text-gray-500">
            {options.length}
          </span>

          {/* animated chevron */}
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ color: ac.chevronColor, flexShrink: 0 }}
          >
            <ChevronDown size={18} strokeWidth={2.5} />
          </motion.span>
        </button>
      </div>

      {/* ── PORTAL PANEL → rendered in document.body ────────── */}
      {typeof document !== 'undefined' &&
        createPortal(portalContent, document.body)}
    </>
  );
}
