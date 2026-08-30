'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useReactFlow, useViewport } from '@xyflow/react';
import { getStroke } from 'perfect-freehand';
import { DrawingStroke, DrawingTool } from '@/types/drawing';
import { generateId } from '@/lib/utils';

interface DrawingCanvasProps {
  ideaId: string;
  strokes: DrawingStroke[];
  onStrokesChange: (strokes: DrawingStroke[]) => void;
  isDrawingMode: boolean;
  activeTool: DrawingTool;
  activeColor: string;
  activeSize: number;
}

// Convert outline points from getStroke to SVG path string
export function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return '';
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q'] as (string | number)[]
  );
  d.push('Z');
  return d.join(' ');
}

export function DrawingCanvas({
  ideaId,
  strokes,
  onStrokesChange,
  isDrawingMode,
  activeTool,
  activeColor,
  activeSize,
}: DrawingCanvasProps) {
  const { screenToFlowPosition } = useReactFlow();
  const viewport = useViewport();
  const [currentPoints, setCurrentPoints] = useState<number[][] | null>(null);
  const isPointerDownRef = useRef(false);

  // Handle Pointer Down
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawingMode || e.button !== 0) return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      isPointerDownRef.current = true;

      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const pressure = e.pressure !== undefined && e.pressure > 0 ? e.pressure : 0.5;

      if (activeTool === 'eraser') {
        // Erase strokes near click
        const radius = activeSize * 4;
        const remaining = strokes.filter(s => {
          return !s.points.some(([px, py]) => Math.hypot(px - flowPos.x, py - flowPos.y) < radius);
        });
        if (remaining.length !== strokes.length) {
          onStrokesChange(remaining);
        }
        return;
      }

      setCurrentPoints([[flowPos.x, flowPos.y, pressure]]);
    },
    [isDrawingMode, activeTool, activeSize, strokes, screenToFlowPosition, onStrokesChange]
  );

  // Handle Pointer Move
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawingMode || !isPointerDownRef.current) return;
      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const pressure = e.pressure !== undefined && e.pressure > 0 ? e.pressure : 0.5;

      if (activeTool === 'eraser') {
        const radius = activeSize * 4;
        const remaining = strokes.filter(s => {
          return !s.points.some(([px, py]) => Math.hypot(px - flowPos.x, py - flowPos.y) < radius);
        });
        if (remaining.length !== strokes.length) {
          onStrokesChange(remaining);
        }
        return;
      }

      setCurrentPoints(pts => (pts ? [...pts, [flowPos.x, flowPos.y, pressure]] : [[flowPos.x, flowPos.y, pressure]]));
    },
    [isDrawingMode, activeTool, activeSize, strokes, screenToFlowPosition, onStrokesChange]
  );

  // Handle Pointer Up
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawingMode || !isPointerDownRef.current) return;
      isPointerDownRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      if (currentPoints && currentPoints.length > 0 && activeTool !== 'eraser') {
        const newStroke: DrawingStroke = {
          id: generateId(),
          ideaId,
          points: currentPoints,
          color: activeColor,
          size: activeSize,
          tool: activeTool,
          opacity: activeTool === 'highlighter' ? 0.35 : 0.95,
          createdAt: new Date().toISOString(),
        };
        onStrokesChange([...strokes, newStroke]);
      }
      setCurrentPoints(null);
    },
    [isDrawingMode, currentPoints, activeTool, activeColor, activeSize, ideaId, strokes, onStrokesChange]
  );

  // Freehand options for pen & highlighter
  const getStrokeOptions = (strokeSize: number, tool: 'pen' | 'highlighter') => ({
    size: tool === 'highlighter' ? strokeSize * 2.8 : strokeSize,
    thinning: tool === 'highlighter' ? 0.1 : 0.4,
    smoothing: 0.65,
    streamline: 0.55,
    easing: (t: number) => t,
    start: { taper: tool === 'highlighter' ? 0 : strokeSize * 1.2, cap: true },
    end: { taper: tool === 'highlighter' ? 0 : strokeSize * 1.2, cap: true },
  });

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        pointerEvents: isDrawingMode ? 'auto' : 'none',
        zIndex: 5, // Sits above background, beneath interactive nodes if in navigate mode
        cursor: isDrawingMode
          ? activeTool === 'eraser'
            ? 'crosshair'
            : activeTool === 'highlighter'
            ? 'cell'
            : 'crosshair'
          : 'default',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <svg
        className="w-full h-full"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
          overflow: 'visible',
        }}
      >
        {/* Render Saved Strokes */}
        {strokes.map(stroke => {
          const outline = getStroke(stroke.points, getStrokeOptions(stroke.size, stroke.tool));
          const pathData = getSvgPathFromStroke(outline);
          return (
            <path
              key={stroke.id}
              d={pathData}
              fill={stroke.color}
              opacity={stroke.opacity ?? (stroke.tool === 'highlighter' ? 0.35 : 0.95)}
              style={{
                mixBlendMode: stroke.tool === 'highlighter' ? 'multiply' : 'normal',
                transition: 'opacity 0.15s',
              }}
            />
          );
        })}

        {/* Render Active Live Stroke */}
        {currentPoints && currentPoints.length > 0 && activeTool !== 'eraser' && (
          <path
            d={getSvgPathFromStroke(getStroke(currentPoints, getStrokeOptions(activeSize, activeTool)))}
            fill={activeColor}
            opacity={activeTool === 'highlighter' ? 0.35 : 0.95}
            style={{
              mixBlendMode: activeTool === 'highlighter' ? 'multiply' : 'normal',
            }}
          />
        )}
      </svg>
    </div>
  );
}
