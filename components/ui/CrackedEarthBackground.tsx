'use client';

import React from 'react';

interface CrackedEarthBackgroundProps {
  baseFrequency?: string | number;
  numOctaves?: number;
  seed?: string | number;
  className?: string;
}

export function CrackedEarthBackground({
  baseFrequency = '0.02',
  numOctaves = 5,
  seed = '10',
  className = '',
}: CrackedEarthBackgroundProps) {
  return (
    <div
      className={`cracked-earth-layer fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100vw', height: '100vh' }}
        preserveAspectRatio="none"
      >
        <defs>
          <filter
            id="cracks"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency={baseFrequency}
              numOctaves={numOctaves}
              seed={seed}
              result="noise"
            />
            <feColorMatrix
              type="luminanceToAlpha"
              in="noise"
              result="alphaNoise"
            />
            <feComponentTransfer in="alphaNoise" result="plates">
              <feFuncA type="discrete" tableValues="0 0.25 0.5 0.75 1" />
            </feComponentTransfer>
            <feMorphology
              operator="dilate"
              radius="1"
              in="plates"
              result="dilated"
            />
            <feComposite
              operator="out"
              in="dilated"
              in2="plates"
              result="cracksOnly"
            />
            <feFlood
              floodColor="var(--cracked-earth-line, #383028)"
              floodOpacity="var(--cracked-earth-opacity, 0.06)"
              result="crackColor"
            />
            <feComposite
              operator="in"
              in="crackColor"
              in2="cracksOnly"
              result="coloredCracks"
            />
          </filter>
        </defs>
        {/* Base paper layer */}
        <rect
          width="100%"
          height="100%"
          fill="var(--cracked-earth-base, var(--bg, #F4F1EA))"
        />
        {/* Subtle procedural cracked earth texture layer */}
        <rect
          width="100%"
          height="100%"
          filter="url(#cracks)"
        />
      </svg>
    </div>
  );
}
