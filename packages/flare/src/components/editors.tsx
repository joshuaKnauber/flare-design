import { useCallback, useMemo, useRef } from "react";
import { toHex } from "../utils";
import { SelectDropdown } from "./inputs";

// ── Display Mode Picker ────────────────────────────

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

// ── Alignment Matrix ───────────────────────────────

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

// ── Grid Track Editor ──────────────────────────────

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

// ── Box Shadow Editor ──────────────────────────────

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

  let color = "#00000040";
  const rgbMatch = working.match(/rgba?\([^)]+\)/i);
  if (rgbMatch) {
    color = rgbMatch[0];
    working = working.replace(rgbMatch[0], "").trim();
  } else {
    const hexMatch = working.match(/#[0-9a-fA-F]{3,8}/);
    if (hexMatch) {
      color = hexMatch[0];
      working = working.replace(hexMatch[0], "").trim();
    } else {
      const parts = working.split(/\s+/);
      if (parts.length > 2) {
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
