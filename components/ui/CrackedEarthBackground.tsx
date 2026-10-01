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
    <>
      <div
        className={`cracked-earth ${className}`}
        aria-hidden="true"
      />
      <svg
        width="0"
        height="0"
        className="absolute pointer-events-none"
        style={{ position: 'absolute', width: 0, height: 0 }}
        aria-hidden="true"
      >
        <filter id="cracks" colorInterpolationFilters="sRGB">
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
            <feFuncA type="discrete" tableValues="0 1" />
          </feComponentTransfer>
          <feConvolveMatrix
            order="3 3"
            kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1"
            in="plates"
            result="edges"
          />
          <feComponentTransfer in="edges" result="invertedEdges">
            <feFuncR type="table" tableValues="1 0" />
            <feFuncG type="table" tableValues="1 0" />
            <feFuncB type="table" tableValues="1 0" />
          </feComponentTransfer>
          <feFlood className="crack-flood" result="bgColor" />
          <feComposite operator="in" in="bgColor" in2="invertedEdges" />
        </filter>
      </svg>
    </>
  );
}
