/**
 * Food type indicator for admin menu cards — shown before item name.
 * Veg/Non-Veg → FSSAI square+dot SVG
 * Egg → 🥚, Drink → 🥤, Halal → 🍖
 */

function FssaiDot({ borderColor, dotColor, size }) {
  const dotR = (size - 6) / 2;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <rect x={1} y={1} width={size - 2} height={size - 2} rx={1} stroke={borderColor} strokeWidth={2} fill="white" />
      <circle cx={cx} cy={cy} r={dotR} fill={dotColor} />
    </svg>
  );
}

/**
 * @param {{ type: string; size?: number }} props
 */
export default function AdminFoodTypeIndicator({ type, size = 13 }) {
  if (type === "veg") {
    return <FssaiDot borderColor="#16a34a" dotColor="#16a34a" size={size} />;
  }
  if (type === "non-veg") {
    return <FssaiDot borderColor="#92400e" dotColor="#92400e" size={size} />;
  }

  const emojiMap = { egg: "🥚", drink: "🥤", halal: "🍖" };
  const emoji = emojiMap[type];
  if (!emoji) return null;

  return (
    <span
      style={{ fontSize: size, lineHeight: 1, flexShrink: 0 }}
      aria-hidden="true"
    >
      {emoji}
    </span>
  );
}
