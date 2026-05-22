/**
 * Food type indicator for admin menu cards — shown before item name.
 * All types use SVG icons — no emojis.
 */

function FssaiDot({ borderColor, dotColor, size }) {
  const dotR = (size - 6) / 2;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect x={1} y={1} width={size - 2} height={size - 2} rx={1}
        stroke={borderColor} strokeWidth={2} fill="white" />
      <circle cx={cx} cy={cy} r={dotR} fill={dotColor} />
    </svg>
  );
}

function EggIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M12 2C8.5 2 5 6.5 5 13a7 7 0 0 0 14 0C19 6.5 15.5 2 12 2Z"
        fill="white" stroke="#1a1a1a" strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx="12" cy="14" r="3.5" fill="#F59E0B" />
      <circle cx="10.8" cy="12.8" r="0.8" fill="white" opacity="0.7" />
    </svg>
  );
}

function DrinkIcon({ size }) {
  return (
    <span style={{ fontSize: size, lineHeight: 1, flexShrink: 0 }} aria-hidden="true">🥤</span>
  );
}

function HalalIcon({ size }) {
  return (
    <span style={{ fontSize: size, lineHeight: 1, flexShrink: 0 }} aria-hidden="true">🍖</span>
  );
}

/**
 * @param {{ type: string; size?: number }} props
 */
export default function AdminFoodTypeIndicator({ type, size = 13 }) {
  if (type === "veg")     return <FssaiDot borderColor="#16a34a" dotColor="#16a34a" size={size} />;
  if (type === "non-veg") return <FssaiDot borderColor="#92400e" dotColor="#92400e" size={size} />;
  if (type === "egg")     return <EggIcon size={size} />;
  if (type === "drink")   return <DrinkIcon size={size} />;
  if (type === "halal")   return <HalalIcon size={size} />;
  return null;
}
