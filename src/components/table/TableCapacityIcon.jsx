const baseSvgClass =
  "[vector-effect:non-scaling-stroke] stroke-current text-inherit";

function TableShape({ x, y, width, height, radius }) {
  return (
    <>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={radius}
        className={`${baseSvgClass} fill-current/5`}
        strokeWidth="2.2"
      />
      <rect
        x={x + 4}
        y={y + 4}
        width={width - 8}
        height={height - 8}
        rx={Math.max(radius - 2, 1)}
        className={`${baseSvgClass} fill-none opacity-70`}
        strokeWidth="1.4"
      />
    </>
  );
}

function Seat({ x, y, w = 6, h = 7 }) {
  return (
    <>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="2"
        className={`${baseSvgClass} fill-none`}
        strokeWidth="2"
      />
      <line
        x1={x + 1.6}
        y1={y + h + 1.8}
        x2={x + w - 1.6}
        y2={y + h + 1.8}
        className={baseSvgClass}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </>
  );
}

function TwoSeatIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <TableShape x={20} y={20} width={24} height={24} radius={7} />
      <Seat x={7} y={28.5} />
      <Seat x={51} y={28.5} />
    </svg>
  );
}

function FourSeatIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <TableShape x={18} y={18} width={28} height={28} radius={8} />
      <Seat x={29} y={7} />
      <Seat x={29} y={50} />
      <Seat x={7} y={29} />
      <Seat x={51} y={29} />
    </svg>
  );
}

function SixSeatIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <TableShape x={14} y={20} width={36} height={24} radius={8} />
      <Seat x={20} y={7} />
      <Seat x={38} y={7} />
      <Seat x={20} y={50} />
      <Seat x={38} y={50} />
      <Seat x={7} y={29} />
      <Seat x={51} y={29} />
    </svg>
  );
}

function EightSeatIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <TableShape x={13} y={17} width={38} height={30} radius={8} />
      <Seat x={16} y={6.5} />
      <Seat x={29} y={6.5} />
      <Seat x={42} y={6.5} />
      <Seat x={16} y={50.5} />
      <Seat x={29} y={50.5} />
      <Seat x={42} y={50.5} />
      <Seat x={6.5} y={23.5} h={6.5} />
      <Seat x={51} y={23.5} h={6.5} />
    </svg>
  );
}

function GroupSeatIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <circle
        cx="32"
        cy="32"
        r="13.5"
        className={`${baseSvgClass} fill-current/5`}
        strokeWidth="2.2"
      />
      <circle
        cx="32"
        cy="32"
        r="9.5"
        className={`${baseSvgClass} fill-none opacity-70`}
        strokeWidth="1.4"
      />
      <Seat x={29} y={3.5} w={6} h={6.5} />
      <Seat x={29} y={54} w={6} h={6.5} />
      <Seat x={3.5} y={29} w={6.5} h={6} />
      <Seat x={54} y={29} w={6.5} h={6} />
      <Seat x={10.5} y={10.5} w={6} h={6} />
      <Seat x={47.5} y={10.5} w={6} h={6} />
      <Seat x={47.5} y={47.5} w={6} h={6} />
      <Seat x={10.5} y={47.5} w={6} h={6} />
    </svg>
  );
}

export function getTableIcon(capacity) {
  const seats = Number(capacity) || 0;
  if (seats <= 2) return "two";
  if (seats <= 4) return "four";
  if (seats <= 6) return "six";
  if (seats <= 8) return "eight";
  return "group";
}

export default function TableCapacityIcon({ capacity, className = "" }) {
  const iconType = getTableIcon(capacity);

  if (iconType === "two") return <TwoSeatIcon className={className} />;
  if (iconType === "four") return <FourSeatIcon className={className} />;
  if (iconType === "six") return <SixSeatIcon className={className} />;
  if (iconType === "eight") return <EightSeatIcon className={className} />;
  return <GroupSeatIcon className={className} />;
}
