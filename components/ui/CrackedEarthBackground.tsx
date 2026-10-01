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
  numOctaves = 4,
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
        preserveAspectRatio="none"
      >
        <defs>
          <filter
            id="cracks"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
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
              <feFuncA type="discrete" tableValues="0 1 0 1 0 1 0 1" />
            </feComponentTransfer>
            <feMorphology
              operator="dilate"
              radius="1.5"
              in="plates"
              result="dilated"
            />
            <feComposite
              operator="xor"
              in="plates"
              in2="dilated"
              result="cracksOnly"
            />
            <feFlood className="crack-flood" result="crackColor" />
            <feComposite
              operator="in"
              in="crackColor"
              in2="cracksOnly"
              result="coloredCracks"
            />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#cracks)" />
      </svg>
    </div>
  );
}
