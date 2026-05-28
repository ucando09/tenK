import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface TimerCircleProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
  phaseProgress?: number;
}

export function TimerCircle({
  progress,
  size = 260,
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

  const phaseRadius = radius - strokeWidth - 4;
  const phaseCircumference = 2 * Math.PI * phaseRadius;
  const phaseDashOffset = phaseCircumference * (1 - Math.min(phaseProgress ?? 0, 1));

  // Dot at arc endpoint
  const angle = -Math.PI / 2 + 2 * Math.PI * Math.min(progress, 1);
  const dotX = center + radius * Math.cos(angle);
  const dotY = center + radius * Math.sin(angle);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute' }}
      >
        <G rotation="-90" origin={`${center}, ${center}`}>
          {/* Outer dashed decorative ring */}
          <Circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="none"
            stroke="#1e1e3a"
            strokeWidth={1}
            strokeDasharray="4 6"
          />

          {/* Track background */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#1e1e3a"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Progress arc */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />

          {/* Phase progress ring */}
          {phaseProgress !== undefined && (
            <>
              <Circle
                cx={center}
                cy={center}
                r={phaseRadius}
                fill="none"
                stroke="#1e1e3a"
                strokeWidth={strokeWidth * 0.6}
              />
              <Circle
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
              />
            </>
          )}

          {/* Dot */}
          {progress > 0.01 && (
            <Circle
              cx={dotX}
              cy={dotY}
              r={strokeWidth * 0.8}
              fill={color}
            />
          )}
        </G>
      </Svg>

      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}
