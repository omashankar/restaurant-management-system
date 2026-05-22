/**
 * Food type indicator icons for menu items.
 *
 * veg     → FSSAI green square + green dot
 * non-veg → FSSAI brown/dark-red square + brown dot
 * egg     → egg icon (black outline + yellow yolk)
 * drink   → drink glass icon (blue)
 * halal   → halal crescent + star (teal)
 * other   → nothing shown
 */

/** FSSAI-style square + circle indicator */
function FssaiDot({ borderColor, dotColor, size }) {
  const pad = Math.max(2, Math.round(size * 0.12));
  const dotR = (size - pad * 2 - 4) / 2;
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
    >
      {/* outer square */}
      <rect
        x={1}
        y={1}
        width={size - 2}
        height={size - 2}
        rx={1}
        stroke={borderColor}
        strokeWidth={2}
        fill="white"
      />
      {/* filled circle */}
      <circle cx={cx} cy={cy} r={dotR} fill={dotColor} />
    </svg>
  );
}

/** Egg icon — black outline, white inside, yellow yolk */
function EggIcon({ size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* egg white shape */}
      <path
        d="M12 2C8.5 2 5 6.5 5 13a7 7 0 0 0 14 0C19 6.5 15.5 2 12 2Z"
        fill="white"
        stroke="#1a1a1a"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      {/* yolk */}
      <circle cx="12" cy="14" r="3.8" fill="#F59E0B" />
      {/* yolk shine */}
      <circle cx="10.8" cy="12.8" r="0.9" fill="white" opacity="0.7" />
    </svg>
  );
}

/** Drink glass icon — 🥤 emoji */
function DrinkIcon({ size }) {
  return (
    <span style={{ fontSize: size, lineHeight: 1, display: "block" }} aria-hidden="true">
      🥤
    </span>
  );
}

/** Halal icon — 🍖 meat/chicken leg emoji */
function HalalIcon({ size }) {
  return (
    <span style={{ fontSize: size, lineHeight: 1, display: "block" }} aria-hidden="true">
      🍖
    </span>
  );
}

/**
 * @param {{ type: string; size?: number; className?: string }} props
 * size — icon size in px (default 16)
 */
export default function FoodTypeIndicator({ type, size = 16, className = "" }) {
  let icon = null;

  if (type === "veg") {
    icon = <FssaiDot borderColor="#16a34a" dotColor="#16a34a" size={size} />;
  } else if (type === "non-veg") {
    icon = <FssaiDot borderColor="#92400e" dotColor="#92400e" size={size} />;
  } else if (type === "egg") {
    icon = <EggIcon size={size} />;
  } else if (type === "drink") {
    icon = <DrinkIcon size={size} />;
  } else if (type === "halal") {
    icon = <HalalIcon size={size} />;
  } else {
    return null;
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      title={type.charAt(0).toUpperCase() + type.slice(1)}
      aria-label={type}
    >
      {icon}
    </span>
  );
}
