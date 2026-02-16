import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconChevron } from "./icons";
import { getElementLabel, isFlareElement } from "./utils";

const SECTION_KEY = "flare-section-";

export function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(SECTION_KEY + title);
      if (stored !== null) return stored === "true";
    } catch {}
    return defaultOpen;
  });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(SECTION_KEY + title, String(next));
    } catch {}
  };

  return (
    <div className="f-section">
      <button className="f-section-header" onClick={toggle}>
        <IconChevron open={open} />
        <span>{title}</span>
      </button>
      {open && <div className="f-section-body">{children}</div>}
    </div>
  );
}

export function SubPanel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="f-subpanel">
      <span className="f-subpanel-label">{label}</span>
      <div className="f-subpanel-body">{children}</div>
    </div>
  );
}

export function PropRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="f-prop-row">
      <span className="f-prop-label">{label}</span>
      <div className="f-prop-value">{children}</div>
    </div>
  );
}

const CSS_UNITS = [
  "px",
  "em",
  "rem",
  "%",
  "vw",
  "vh",
  "auto",
  "fit-content",
  "max-content",
  "min-content",
];

export const TYPO_UNITS = ["px", "em", "rem", "%", "normal"];
export const FONT_SIZE_UNITS = ["px", "em", "rem", "%", "vw", "vh"];

/** Parse "16px" → { num: 16, unit: "px" }, "auto" → { num: NaN, unit: "auto" } */
function parseValue(val: string): { num: number; unit: string; raw: string } {
  const m = val.match(
    /^([\d.+-]+)\s*(px|em|rem|%|vw|vh|ch|vmin|vmax|pt|cm|mm|in)?$/,
  );
  if (m) return { num: parseFloat(m[1]), unit: m[2] || "", raw: val };
  return { num: NaN, unit: "", raw: val };
}

/** Check if a string looks like a partial or complete number (for typing) */
function isNumericInput(s: string): boolean {
  return s === "" || /^[+-]?\d*\.?\d*$/.test(s);
}

/** Strip the unit from a value for display, returning just the number string */
function stripUnit(val: string): string {
  const p = parseValue(val);
  return !isNaN(p.num) && p.unit ? String(p.num) : val;
}

export function ValueInput({
  value,
  suffix,
  prefix,
  onChange,
  units,
}: {
  value: string;
  suffix?: string;
  prefix?: string;
  onChange?: (val: string) => void;
  units?: string[];
}) {
  // draft = full CSS value (e.g. "16px")
  // inputStr = what's shown in the input (e.g. "16", unit shown separately)
  const [draft, setDraft] = useState(value);
  const [inputStr, setInputStr] = useState(() => stripUnit(value));
  const [focused, setFocused] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrubRef = useRef<{
    startX: number;
    startVal: number;
    unit: string;
  } | null>(null);

  const draftParsed = parseValue(draft);
  const currentUnit = draftParsed.unit;

  // Sync when value changes externally (and we're not focused)
  useEffect(() => {
    if (!focused) {
      setDraft(value);
      setInputStr(stripUnit(value));
    }
  }, [value, focused]);

  const emit = (fullVal: string) => {
    setDraft(fullVal);
    onChange?.(fullVal);
  };

  // Live update: call onChange on every keystroke
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputStr(raw);

    // Check if user typed a full value with unit (e.g. "2em")
    const typed = parseValue(raw);
    if (!isNaN(typed.num) && typed.unit) {
      emit(raw);
      return;
    }

    // If we have a unit and input looks numeric, auto-append the unit
    if (currentUnit && isNumericInput(raw)) {
      emit(raw === "" ? "" : `${raw}${currentUnit}`);
    } else {
      emit(raw);
    }
  };

  const handleFocus = () => {
    setFocused(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleBlur = () => {
    setFocused(false);
    setUnitOpen(false);
    // Re-sync display from the settled draft
    setInputStr(stripUnit(draft));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setDraft(value);
      setInputStr(stripUnit(value));
      onChange?.(value);
      inputRef.current?.blur();
    }
    // Arrow up/down to nudge numeric values
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (!isNaN(draftParsed.num)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const next = draftParsed.num + (e.key === "ArrowUp" ? step : -step);
        const newVal = `${next}${currentUnit}`;
        setDraft(newVal);
        setInputStr(String(next));
        onChange?.(newVal);
      }
    }
  };

  // Drag-to-scrub on the prefix label
  const handleScrubStart = (e: React.MouseEvent) => {
    if (!onChange) return;
    e.preventDefault();
    if (isNaN(draftParsed.num)) return;
    scrubRef.current = {
      startX: e.clientX,
      startVal: draftParsed.num,
      unit: currentUnit,
    };

    const onMove = (ev: MouseEvent) => {
      if (!scrubRef.current) return;
      const delta = ev.clientX - scrubRef.current.startX;
      const step = ev.shiftKey ? 10 : 1;
      const raw = scrubRef.current.startVal + Math.round(delta / 2) * step;
      // Round to avoid floating-point noise (keep at most 2 decimals)
      const next = Math.round(raw * 100) / 100;
      const newVal = `${next}${scrubRef.current.unit}`;
      setDraft(newVal);
      setInputStr(String(next));
      onChange(newVal);
    };
    const onUp = () => {
      scrubRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "ew-resize";
  };

  const unitList = units ?? CSS_UNITS;

  // Unit dropdown: change the unit while keeping the number
  const handleUnitChange = (newUnit: string) => {
    const isKeyword = unitList
      .filter(
        (u) =>
          !/^[a-z%]+$/.test(u) ||
          [
            "auto",
            "fit-content",
            "max-content",
            "min-content",
            "normal",
            "inherit",
            "initial",
            "unset",
            "none",
          ].includes(u),
      )
      .includes(newUnit);
    if (isKeyword) {
      setDraft(newUnit);
      setInputStr(newUnit);
      onChange?.(newUnit);
    } else {
      // Use existing number, or fall back to 0 if current value is a keyword
      const num = isNaN(draftParsed.num) ? 0 : draftParsed.num;
      const newVal = `${num}${newUnit}`;
      setDraft(newVal);
      setInputStr(String(num));
      onChange?.(newVal);
    }
    setUnitOpen(false);
  };

  const isKeywordVal =
    unitList.includes(draft.trim()) && parseValue(draft.trim()).unit === "";
  const showUnit =
    onChange && (currentUnit || !isNaN(draftParsed.num) || isKeywordVal);

  if (!onChange) {
    return (
      <div className="f-value-input">
        {prefix && <span className="f-value-prefix">{prefix}</span>}
        <span>{stripUnit(value)}</span>
        {suffix && <span className="f-value-suffix">{suffix}</span>}
      </div>
    );
  }

  return (
    <div
      className={`f-value-input editable${focused ? " focused" : ""}${isKeywordVal && !focused ? " keyword" : ""}`}
    >
      {prefix && (
        <span
          className={`f-value-prefix${!isKeywordVal ? " scrubable" : ""}`}
          onMouseDown={!isKeywordVal ? handleScrubStart : undefined}
          title={!isKeywordVal ? "Drag to adjust" : undefined}
        >
          {prefix}
        </span>
      )}
      {isKeywordVal && !focused ? (
        <span className="f-keyword-label">{draft}</span>
      ) : (
        <input
          ref={inputRef}
          value={inputStr}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      )}
      {showUnit && (
        <div className="f-unit-dropdown-wrap">
          <button
            className="f-unit-btn"
            onMouseDown={(e) => {
              e.preventDefault();
              setUnitOpen(!unitOpen);
            }}
            tabIndex={-1}
          >
            {isKeywordVal ? draft.trim() : currentUnit || "—"}
          </button>
          {unitOpen && (
            <div className="f-unit-menu">
              {unitList.map((u) => (
                <button
                  key={u}
                  className={`f-unit-option${u === currentUnit || (isKeywordVal && u === draft.trim()) ? " active" : ""}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleUnitChange(u);
                  }}
                >
                  {u}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {suffix && <span className="f-value-suffix">{suffix}</span>}
    </div>
  );
}

function toHex(color: string): string {
  // Convert rgb()/rgba() to #hex for the native color picker
  const m = color.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
  if (m) {
    const [, r, g, b] = m;
    return (
      "#" +
      [r, g, b].map((c) => Number(c).toString(16).padStart(2, "0")).join("")
    );
  }
  // Already hex or named color — return as-is
  if (color.startsWith("#"))
    return color.length === 4
      ? "#" + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]
      : color;
  return "#000000";
}

export function ColorSwatch({
  color,
  onChange,
}: {
  color: string;
  onChange?: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(color);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(color);
  }, [color]);
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== color && onChange) onChange(draft);
  };

  const openPicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    pickerRef.current?.click();
  };

  return (
    <div
      className={`f-color-row${onChange ? " editable" : ""}`}
      onClick={() => onChange && setEditing(true)}
    >
      <div
        className="f-swatch"
        style={{ background: color }}
        onClick={onChange ? openPicker : undefined}
      />
      {onChange && (
        <input
          ref={pickerRef}
          type="color"
          className="f-color-picker"
          value={toHex(color)}
          onChange={(e) => {
            onChange(e.target.value);
          }}
        />
      )}
      {editing ? (
        <input
          ref={inputRef}
          className="f-color-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(color);
              setEditing(false);
            }
          }}
        />
      ) : (
        <span className="f-color-hex">{color}</span>
      )}
    </div>
  );
}

export function SelectDropdown({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: string[];
  value: string;
  onChange?: (val: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const root = ref.current?.getRootNode() as Document | ShadowRoot;
    if (!root) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    root.addEventListener("mousedown", handleClick as EventListener);
    return () =>
      root.removeEventListener("mousedown", handleClick as EventListener);
  }, [open]);

  const displayLabel = value || placeholder || "";

  return (
    <div className="f-dropdown" ref={ref}>
      <button
        className="f-dropdown-trigger"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span className={!value && placeholder ? "f-dropdown-placeholder" : ""}>
          {displayLabel}
        </span>
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          className={`f-dropdown-chevron${open ? " open" : ""}`}
        >
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className="f-dropdown-menu">
          {options.map((opt) => (
            <button
              key={opt}
              className={`f-dropdown-option${opt === value ? " active" : ""}`}
              onClick={() => {
                onChange?.(opt);
                setOpen(false);
              }}
              type="button"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Font Dropdown (searchable combobox) ────────────
export function FontDropdown({
  fonts,
  value,
  onChange,
}: {
  fonts: string[];
  value: string;
  onChange?: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close on outside click (Shadow DOM aware)
  useEffect(() => {
    if (!open) return;
    const root = ref.current?.getRootNode() as Document | ShadowRoot;
    if (!root) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    root.addEventListener("mousedown", handleClick as EventListener);
    return () =>
      root.removeEventListener("mousedown", handleClick as EventListener);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const filtered = useMemo(() => {
    if (!search) return fonts;
    const q = search.toLowerCase();
    return fonts.filter((f) => f.toLowerCase().includes(q));
  }, [fonts, search]);

  const handleSelect = useCallback(
    (font: string) => {
      onChange?.(font);
      setOpen(false);
      setSearch("");
    },
    [onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setSearch("");
    } else if (e.key === "Enter" && search) {
      // Accept typed value directly
      handleSelect(search);
    }
  };

  // Clean display value: strip quotes
  const displayValue = value.replace(/^["']|["']$/g, "");

  return (
    <div className="f-font-dropdown" ref={ref}>
      <button
        className="f-dropdown-trigger"
        onClick={() => setOpen(!open)}
        type="button"
        style={displayValue ? { fontFamily: displayValue } : undefined}
      >
        <span>{displayValue || "Select font…"}</span>
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          className={`f-dropdown-chevron${open ? " open" : ""}`}
        >
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className="f-font-dropdown-menu">
          <input
            ref={inputRef}
            className="f-font-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search fonts…"
            spellCheck={false}
          />
          <div className="f-font-list" ref={listRef}>
            {filtered.length === 0 && (
              <div className="f-font-empty">
                {search ? (
                  <button
                    className="f-dropdown-option"
                    onClick={() => handleSelect(search)}
                    type="button"
                  >
                    Use "{search}"
                  </button>
                ) : (
                  "No fonts found"
                )}
              </div>
            )}
            {filtered.map((font) => (
              <button
                key={font}
                className={`f-dropdown-option${font === displayValue ? " active" : ""}`}
                onClick={() => handleSelect(font)}
                type="button"
                style={{ fontFamily: font }}
              >
                {font}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DisplayModePreview({ mode }: { mode: string }) {
  const c = "currentColor";
  switch (mode) {
    case "block":
      return (
        <svg width="28" height="18" viewBox="0 0 28 18" fill="none">
          <rect
            x="1"
            y="1"
            width="26"
            height="5"
            rx="1.5"
            fill={c}
            opacity="0.6"
          />
          <rect
            x="1"
            y="7"
            width="26"
            height="5"
            rx="1.5"
            fill={c}
            opacity="0.4"
          />
          <rect
            x="1"
            y="13"
            width="26"
            height="4"
            rx="1.5"
            fill={c}
            opacity="0.25"
          />
        </svg>
      );
    case "flex":
      return (
        <svg width="28" height="18" viewBox="0 0 28 18" fill="none">
          <rect
            x="1"
            y="2"
            width="7"
            height="14"
            rx="1.5"
            fill={c}
            opacity="0.55"
          />
          <rect
            x="10"
            y="2"
            width="9"
            height="14"
            rx="1.5"
            fill={c}
            opacity="0.4"
          />
          <rect
            x="21"
            y="2"
            width="6"
            height="14"
            rx="1.5"
            fill={c}
            opacity="0.25"
          />
        </svg>
      );
    case "grid":
      return (
        <svg width="28" height="18" viewBox="0 0 28 18" fill="none">
          <rect
            x="1"
            y="1"
            width="12"
            height="7"
            rx="1.5"
            fill={c}
            opacity="0.5"
          />
          <rect
            x="15"
            y="1"
            width="12"
            height="7"
            rx="1.5"
            fill={c}
            opacity="0.35"
          />
          <rect
            x="1"
            y="10"
            width="12"
            height="7"
            rx="1.5"
            fill={c}
            opacity="0.3"
          />
          <rect
            x="15"
            y="10"
            width="12"
            height="7"
            rx="1.5"
            fill={c}
            opacity="0.2"
          />
        </svg>
      );
    default:
      return null;
  }
}

const PRIMARY_MODES = [
  { value: "block", label: "Block" },
  { value: "flex", label: "Flex" },
  { value: "grid", label: "Grid" },
];

const OTHER_MODES = [
  "inline",
  "inline-block",
  "inline-flex",
  "inline-grid",
  "none",
];

export function DisplayModePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const isPrimary = PRIMARY_MODES.some((m) => m.value === value);

  return (
    <div className="f-display-picker">
      <div className="f-display-tiles">
        {PRIMARY_MODES.map((mode) => (
          <button
            key={mode.value}
            className={`f-display-tile${mode.value === value ? " active" : ""}`}
            onClick={() => onChange(mode.value)}
            title={mode.label}
          >
            <DisplayModePreview mode={mode.value} />
            <span>{mode.label}</span>
          </button>
        ))}
        <div className="f-display-tile f-display-more">
          <SelectDropdown
            options={OTHER_MODES}
            value={isPrimary ? "" : value}
            onChange={onChange}
            placeholder="More"
          />
        </div>
      </div>
    </div>
  );
}

export function IconButton({
  options,
  value,
  onChange,
}: {
  options: { value: string; icon: React.ReactNode; label: string }[];
  value: string;
  onChange?: (val: string) => void;
}) {
  return (
    <div className="f-icon-btn-group">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`f-icon-btn${opt.value === value ? " active" : ""}`}
          onClick={() => onChange?.(opt.value)}
          title={opt.label}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}

/* ── Grid Track Editor ─────────────────────────── */

/** Parse "1fr 200px auto" → [{type:"fr", value:"1"}, {type:"px", value:"200"}, {type:"auto", value:""}] */
function parseTracks(raw: string): { type: string; value: string }[] {
  if (!raw || raw === "none") return [];
  return raw
    .trim()
    .split(/\s+/)
    .map((t) => {
      if (t === "auto") return { type: "auto", value: "" };
      if (t.endsWith("fr")) return { type: "fr", value: t.replace("fr", "") };
      if (t.endsWith("px")) return { type: "px", value: t.replace("px", "") };
      if (t.endsWith("%")) return { type: "%", value: t.replace("%", "") };
      if (t.startsWith("minmax")) return { type: "minmax", value: t };
      // fallback
      return { type: "px", value: t };
    });
}

function serializeTracks(tracks: { type: string; value: string }[]): string {
  if (tracks.length === 0) return "none";
  return tracks
    .map((t) => {
      if (t.type === "auto") return "auto";
      if (t.type === "minmax") return t.value || "minmax(0, 1fr)";
      return `${t.value || "1"}${t.type}`;
    })
    .join(" ");
}

const TRACK_TYPES = ["fr", "px", "%", "auto", "minmax"];

function GridTrackList({
  label,
  tracks,
  onChange,
}: {
  label: string;
  tracks: { type: string; value: string }[];
  onChange: (tracks: { type: string; value: string }[]) => void;
}) {
  const addTrack = () => {
    onChange([...tracks, { type: "fr", value: "1" }]);
  };
  const removeTrack = (idx: number) => {
    const next = tracks.filter((_, i) => i !== idx);
    onChange(next.length ? next : []);
  };
  const updateTrack = (idx: number, field: "type" | "value", val: string) => {
    const next = tracks.map((t, i) => {
      if (i !== idx) return t;
      if (field === "type") {
        if (val === "auto") return { type: "auto", value: "" };
        if (val === "minmax")
          return { type: "minmax", value: "minmax(0, 1fr)" };
        return { ...t, type: val, value: t.value || "1" };
      }
      return { ...t, value: val };
    });
    onChange(next);
  };

  return (
    <div className="f-grid-track-list">
      <div className="f-grid-track-header">
        <span className="f-grid-track-label">{label}</span>
        <button
          className="f-grid-track-add"
          onClick={addTrack}
          title={`Add ${label.toLowerCase().slice(0, -1)}`}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M5 1v8M1 5h8"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      {tracks.map((track, idx) => (
        <div key={idx} className="f-grid-track-row">
          <span className="f-grid-track-num">{idx + 1}</span>
          <SelectDropdown
            options={TRACK_TYPES}
            value={track.type}
            onChange={(v) => updateTrack(idx, "type", v)}
          />
          {track.type !== "auto" && track.type !== "minmax" && (
            <input
              className="f-grid-track-input"
              type="text"
              value={track.value}
              onChange={(e) => updateTrack(idx, "value", e.target.value)}
              onBlur={() => {
                if (!track.value) updateTrack(idx, "value", "1");
              }}
            />
          )}
          {track.type === "minmax" && (
            <input
              className="f-grid-track-input f-grid-track-input-wide"
              type="text"
              value={track.value}
              onChange={(e) => updateTrack(idx, "value", e.target.value)}
            />
          )}
          {track.type === "auto" && (
            <span className="f-grid-track-auto-label">auto</span>
          )}
          <button
            className="f-grid-track-remove"
            onClick={() => removeTrack(idx)}
            title="Remove track"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M2 5h6"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      ))}
      {tracks.length === 0 && (
        <div className="f-grid-track-empty">
          No {label.toLowerCase()} defined
        </div>
      )}
    </div>
  );
}

export function GridTrackEditor({
  columns,
  rows,
  onChangeColumns,
  onChangeRows,
}: {
  columns: string;
  rows: string;
  onChangeColumns: (v: string) => void;
  onChangeRows: (v: string) => void;
}) {
  const colTracks = parseTracks(columns);
  const rowTracks = parseTracks(rows);

  return (
    <div className="f-grid-editor">
      <GridTrackList
        label="Columns"
        tracks={colTracks}
        onChange={(t) => onChangeColumns(serializeTracks(t))}
      />
      <GridTrackList
        label="Rows"
        tracks={rowTracks}
        onChange={(t) => onChangeRows(serializeTracks(t))}
      />
    </div>
  );
}

const JUSTIFY_MAP = ["flex-start", "center", "flex-end"];
const ALIGN_MAP = ["flex-start", "center", "flex-end"];
const SPACE_CYCLE = ["space-between", "space-around", "space-evenly"];

export function AlignmentMatrix({
  justifyContent,
  alignItems,
  onChangeJustify,
  onChangeAlign,
  direction = "row",
}: {
  justifyContent: string;
  alignItems: string;
  onChangeJustify: (val: string) => void;
  onChangeAlign: (val: string) => void;
  direction?: string;
}) {
  const isVertical = direction === "column" || direction === "column-reverse";
  const isSpaceValue = SPACE_CYCLE.includes(justifyContent);

  // In row mode:    columns = justify (H), rows = align (V)
  // In column mode: columns = align (H),   rows = justify (V)
  const activeCol = isVertical
    ? ALIGN_MAP.indexOf(alignItems)
    : JUSTIFY_MAP.indexOf(justifyContent);
  const activeRow = isVertical
    ? JUSTIFY_MAP.indexOf(justifyContent)
    : ALIGN_MAP.indexOf(alignItems);

  return (
    <div className="f-align-matrix">
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => {
          const jVal = isVertical ? JUSTIFY_MAP[row] : JUSTIFY_MAP[col];
          const aVal = isVertical ? ALIGN_MAP[col] : ALIGN_MAP[row];

          const isPositionalActive = row === activeRow && col === activeCol;
          // Spread along the main axis: row for horizontal, column for vertical
          const isSpread = isSpaceValue
            ? isVertical
              ? col === activeCol
              : row === activeRow
            : false;

          return (
            <button
              key={`${row}-${col}`}
              className={`f-align-dot${
                isPositionalActive ? " active" : ""
              }${isSpread ? " spread" : ""}`}
              title={`justify: ${jVal}; align: ${aVal}`}
              onClick={() => {
                onChangeJustify(jVal);
                onChangeAlign(aVal);
              }}
              onDoubleClick={(e) => {
                e.preventDefault();
                const idx = SPACE_CYCLE.indexOf(justifyContent);
                const next = SPACE_CYCLE[(idx + 1) % SPACE_CYCLE.length];
                onChangeJustify(next);
                onChangeAlign(aVal);
              }}
            />
          );
        }),
      )}
    </div>
  );
}

export function BoxModelDiagram() {
  return (
    <div className="f-boxmodel">
      <div className="f-boxmodel-ring f-boxmodel-margin">
        <span className="f-boxmodel-label">margin</span>
        <span className="f-boxmodel-val top">0</span>
        <span className="f-boxmodel-val right">0</span>
        <span className="f-boxmodel-val bottom">0</span>
        <span className="f-boxmodel-val left">0</span>
        <div className="f-boxmodel-ring f-boxmodel-padding">
          <span className="f-boxmodel-label">padding</span>
          <span className="f-boxmodel-val top">16</span>
          <span className="f-boxmodel-val right">24</span>
          <span className="f-boxmodel-val bottom">16</span>
          <span className="f-boxmodel-val left">24</span>
          <div className="f-boxmodel-content">
            <span>320 × 48</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SelectedElementLabel({ el }: { el: Element | null }) {
  if (!el) {
    return <span className="f-el-none">No element selected</span>;
  }
  const { tag, id, cls } = getElementLabel(el);
  return (
    <div className="f-selected-el">
      <span className="f-el-tag">{`<${tag}>`}</span>
      {id && <span className="f-el-id">{id}</span>}
      {cls && <span className="f-el-class">{cls}</span>}
    </div>
  );
}

export function Breadcrumb({
  el,
  onSelect,
  onHover,
  onHoverEnd,
}: {
  el: Element | null;
  onSelect: (el: Element) => void;
  onHover?: (el: Element) => void;
  onHoverEnd?: () => void;
}) {
  if (!el) return <span className="f-el-none">No element selected</span>;

  // Walk from el up to body, collect path
  const path: Element[] = [];
  let cur: Element | null = el;
  while (cur && cur !== document.documentElement) {
    if (!isFlareElement(cur)) path.unshift(cur);
    cur = cur.parentElement;
  }

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Auto-scroll to the end (selected element)
    const container = scrollRef.current;
    if (container) container.scrollLeft = container.scrollWidth;
  }, [el]);

  return (
    <div className="f-breadcrumb" ref={scrollRef}>
      {path.map((node, i) => {
        const { tag, id, cls } = getElementLabel(node);
        const isActive = node === el;
        return (
          <span key={i} className="f-crumb-item">
            {i > 0 && <span className="f-crumb-sep">&gt;</span>}
            <button
              className={`f-crumb${isActive ? " active" : ""}`}
              onClick={() => onSelect(node)}
              onMouseEnter={() => onHover?.(node)}
              onMouseLeave={() => onHoverEnd?.()}
            >
              {tag}
              {id}
              {cls}
            </button>
          </span>
        );
      })}
    </div>
  );
}

export function CopyPromptBar({
  changeCount,
  onCopy,
  onReset,
}: {
  changeCount: number;
  onCopy: () => void;
  onReset: () => void;
}) {
  const [state, setState] = useState<"idle" | "countdown">("idle");
  const [seconds, setSeconds] = useState(5);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleCopy = () => {
    onCopy();
    setState("countdown");
    setSeconds(5);
    clearTimer();
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const remaining = Math.ceil(5 - elapsed);
      if (remaining <= 0) {
        clearTimer();
        setState("idle");
        onReset();
      } else {
        setSeconds(remaining);
      }
    }, 100);
  };

  const handleCancel = () => {
    clearTimer();
    setState("idle");
  };

  // Cleanup on unmount
  useEffect(() => clearTimer, []);

  if (changeCount === 0) return null;

  return (
    <div
      className={`f-copy-bar${state === "countdown" ? " f-copy-bar-countdown" : ""}`}
    >
      {state === "countdown" && <div className="f-copy-progress" />}
      <div className="f-copy-bar-inner">
        {state === "idle" ? (
          <>
            <span className="f-changes-count">
              {changeCount} {changeCount === 1 ? "change" : "changes"}
            </span>
            <div className="f-copy-bar-actions">
              <button className="f-reset-btn" onClick={onReset}>
                Reset
              </button>
              <button className="f-copy-btn" onClick={handleCopy}>
                Copy Prompt
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="f-changes-count">
              Copied! Resetting changes in {seconds}s…
            </span>
            <button className="f-cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Box Shadow Editor ─────────────────────────────
interface ShadowParts {
  x: string;
  y: string;
  blur: string;
  spread: string;
  color: string;
  inset: boolean;
}

function parseShadow(raw: string): ShadowParts {
  const s = raw.trim();
  if (!s || s === "none") {
    return {
      x: "0",
      y: "0",
      blur: "0",
      spread: "0",
      color: "#00000040",
      inset: false,
    };
  }

  let inset = false;
  let working = s;
  if (/\binset\b/i.test(working)) {
    inset = true;
    working = working.replace(/\binset\b/i, "").trim();
  }

  // Extract color — could be at start or end, could be rgb()/rgba()/#hex/named
  let color = "#00000040";
  // Try rgb/rgba first
  const rgbMatch = working.match(/rgba?\([^)]+\)/i);
  if (rgbMatch) {
    color = rgbMatch[0];
    working = working.replace(rgbMatch[0], "").trim();
  } else {
    // Try hex
    const hexMatch = working.match(/#[0-9a-fA-F]{3,8}/);
    if (hexMatch) {
      color = hexMatch[0];
      working = working.replace(hexMatch[0], "").trim();
    } else {
      // Try named color at start or end
      const parts = working.split(/\s+/);
      if (parts.length > 2) {
        // Color might be last or first token if not a number
        const last = parts[parts.length - 1];
        const first = parts[0];
        if (!/^[+-]?\d/.test(last)) {
          color = last;
          parts.pop();
          working = parts.join(" ");
        } else if (!/^[+-]?\d/.test(first)) {
          color = first;
          parts.shift();
          working = parts.join(" ");
        }
      }
    }
  }

  // Remaining should be numeric values: x y [blur [spread]]
  const nums = working.split(/\s+/).filter(Boolean);
  return {
    x: nums[0] || "0",
    y: nums[1] || "0",
    blur: nums[2] || "0",
    spread: nums[3] || "0",
    color,
    inset,
  };
}

function serializeShadow(p: ShadowParts): string {
  const parts: string[] = [];
  if (p.inset) parts.push("inset");
  parts.push(p.x.includes("px") || p.x === "0" ? p.x : `${p.x}px`);
  parts.push(p.y.includes("px") || p.y === "0" ? p.y : `${p.y}px`);
  parts.push(p.blur.includes("px") || p.blur === "0" ? p.blur : `${p.blur}px`);
  parts.push(
    p.spread.includes("px") || p.spread === "0" ? p.spread : `${p.spread}px`,
  );
  parts.push(p.color);
  return parts.join(" ");
}

// Ensure value has px suffix for shadow numeric values
function ensurePx(v: string): string {
  if (!v || v === "0") return "0";
  if (/px|em|rem|%|vw|vh/.test(v)) return v;
  const n = parseFloat(v);
  if (!isNaN(n)) return `${n}px`;
  return v;
}

export function BoxShadowEditor({
  value,
  onChange,
}: {
  value: string;
  onChange?: (val: string) => void;
}) {
  const parts = useMemo(() => parseShadow(value), [value]);
  const pickerRef = useRef<HTMLInputElement>(null);

  const update = useCallback(
    (patch: Partial<ShadowParts>) => {
      const next = { ...parts, ...patch };
      onChange?.(serializeShadow(next));
    },
    [parts, onChange],
  );

  const stripPx = (v: string) => {
    const n = parseFloat(v);
    return isNaN(n) ? v : String(n);
  };

  const handleNumChange =
    (key: "x" | "y" | "blur" | "spread") => (v: string) => {
      update({ [key]: ensurePx(v) });
    };

  const openPicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    pickerRef.current?.click();
  };

  return (
    <div className="f-shadow-editor">
      <div className="f-prop-grid">
        <div className="f-shadow-field">
          <span className="f-shadow-field-label">X</span>
          <input
            className="f-shadow-input"
            value={stripPx(parts.x)}
            onChange={(e) => handleNumChange("x")(e.target.value)}
            type="number"
          />
        </div>
        <div className="f-shadow-field">
          <span className="f-shadow-field-label">Y</span>
          <input
            className="f-shadow-input"
            value={stripPx(parts.y)}
            onChange={(e) => handleNumChange("y")(e.target.value)}
            type="number"
          />
        </div>
      </div>
      <div className="f-prop-grid">
        <div className="f-shadow-field">
          <span className="f-shadow-field-label">Blur</span>
          <input
            className="f-shadow-input"
            value={stripPx(parts.blur)}
            onChange={(e) => handleNumChange("blur")(e.target.value)}
            type="number"
            min="0"
          />
        </div>
        <div className="f-shadow-field">
          <span className="f-shadow-field-label">Spread</span>
          <input
            className="f-shadow-input"
            value={stripPx(parts.spread)}
            onChange={(e) => handleNumChange("spread")(e.target.value)}
            type="number"
          />
        </div>
      </div>
      <div className="f-shadow-bottom-row">
        <div className="f-shadow-color-row">
          <div
            className="f-swatch"
            style={{ background: parts.color }}
            onClick={openPicker}
          />
          <input
            ref={pickerRef}
            type="color"
            className="f-color-picker"
            value={toHex(parts.color)}
            onChange={(e) => update({ color: e.target.value })}
          />
          <span className="f-shadow-color-label">{parts.color}</span>
        </div>
        <button
          className={`f-shadow-inset-btn${parts.inset ? " active" : ""}`}
          onClick={() => update({ inset: !parts.inset })}
          type="button"
          title={parts.inset ? "Remove inset" : "Add inset"}
        >
          Inset
        </button>
      </div>
    </div>
  );
}
