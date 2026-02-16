export function IconSun() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.2" />
      <line
        x1="7"
        y1="0.5"
        x2="7"
        y2="2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="7"
        y1="12"
        x2="7"
        y2="13.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="0.5"
        y1="7"
        x2="2"
        y2="7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="7"
        x2="13.5"
        y2="7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="2.4"
        y1="2.4"
        x2="3.5"
        y2="3.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="10.5"
        y1="10.5"
        x2="11.6"
        y2="11.6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="2.4"
        y1="11.6"
        x2="3.5"
        y2="10.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="10.5"
        y1="3.5"
        x2="11.6"
        y2="2.4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconMoon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M12.5 7.8A5.5 5.5 0 1 1 6.2 1.5 4.3 4.3 0 0 0 12.5 7.8Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCrosshair() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <line
        x1="8"
        y1="1"
        x2="8"
        y2="4"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <line
        x1="8"
        y1="12"
        x2="8"
        y2="15"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <line
        x1="1"
        y1="8"
        x2="4"
        y2="8"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <line
        x1="12"
        y1="8"
        x2="15"
        y2="8"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      style={{
        transform: open ? "rotate(0deg)" : "rotate(-90deg)",
        transition: "transform 0.15s ease",
      }}
    >
      <path
        d="M3 4.5L6 7.5L9 4.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCorners() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M2 10V6a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconRoundedRect() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect
        x="2"
        y="2"
        width="10"
        height="10"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function IconDashedRect() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect
        x="2"
        y="2"
        width="10"
        height="10"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="3 2"
      />
    </svg>
  );
}

export function IconSolidRect() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect
        x="2"
        y="2"
        width="10"
        height="10"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function IconCollapse() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M9 5L12 2M12 2H9M12 2V5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 9L2 12M2 12H5M2 12V9"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconFlare() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 256 256"
    >
      <path fill="currentColor" d="M136,160a40,40,0,1,1-40-40A40,40,0,0,1,136,160Zm74.34-37.66-48,48a8,8,0,0,0,11.32,11.32l48-48a8,8,0,0,0-11.32-11.32Zm-20.68-12.68a8,8,0,0,0-11.32-11.32l-24,24a8,8,0,0,0,11.32,11.32Zm40-51.32a8,8,0,0,0-11.32,0l-16,16a8,8,0,0,0,11.32,11.32l16-16A8,8,0,0,0,229.66,58.34ZM122.34,101.66a8,8,0,0,0,11.32,0l72-72a8,8,0,1,0-11.32-11.32l-72,72A8,8,0,0,0,122.34,101.66ZM135.6,199.6a56,56,0,0,1-79.2-79.2l82.75-82.74a8,8,0,1,0-11.32-11.32L45.09,109.09A72,72,0,1,0,146.91,210.91,8,8,0,0,0,135.6,199.6Z"></path>
    </svg>
  );
}
