interface TimerCircleProps {
  progress: number; // 0..1 (logged/goal)
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
  phaseProgress?: number; // 0..1 for current phase countdown
}

export function TimerCircle({
  progress,
  size = 280,
  strokeWidth = 8,
  color = '#7c6cf0',
  children,
  phaseProgress,
}: TimerCircleProps) {
  const center = size / 2;
  const radius = center - strokeWidth * 2;
  const outerRadius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(progress, 1));

  // Phase progress ring (inner)
  const phaseRadius = radius - strokeWidth - 4;
  const phaseCircumference = 2 * Math.PI * phaseRadius;
  const phaseDashOffset = phaseCircumference * (1 - Math.min(phaseProgress ?? 0, 1));

  // Dot position at end of arc
  const angle = -Math.PI / 2 + 2 * Math.PI * Math.min(progress, 1);
  const dotX = center + radius * Math.cos(angle);
  const dotY = center + radius * Math.sin(angle);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Outer dashed decorative ring */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke="#1e1e3a"
          strokeWidth={1}
          strokeDasharray="4 6"
        />

        {/* Track background */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1e1e3a"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />

        {/* Phase progress ring (when timer is running) */}
        {phaseProgress !== undefined && (
          <>
            <circle
              cx={center}
              cy={center}
              r={phaseRadius}
              fill="none"
              stroke="#1e1e3a"
              strokeWidth={strokeWidth * 0.6}
            />
            <circle
              cx={center}
              cy={center}
              r={phaseRadius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth * 0.6}
              strokeLinecap="round"
              strokeDasharray={phaseCircumference}
              strokeDashoffset={phaseDashOffset}
              opacity={0.6}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </>
        )}

        {/* Glowing dot at arc endpoint */}
        {progress > 0.01 && (
          <circle
            cx={dotX}
            cy={dotY}
            r={strokeWidth * 0.8}
            fill={color}
            style={{
              filter: `drop-shadow(0 0 6px ${color})`,
              transform: 'rotate(90deg)',
              transformOrigin: `${dotX}px ${dotY}px`,
            }}
          />
        )}
      </svg>

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
