"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Group } from '@visx/group';
import { scaleLinear } from '@visx/scale';
import { Point } from '@visx/point';
import { Line, LineRadial } from '@visx/shape';
import { cn } from '@/lib/utils';

const orange = '#ff9933';
export const pumpkin = '#f5810c';
const silver = '#d9d9d9';
export const chartBackground = '#FAF7E9';

// Dark theme defaults
const darkGridColor = '#475569';
const darkFillColor = '#3b82f6';
const darkStrokeColor = '#3b82f6';
const darkPointColor = '#60a5fa';
const darkLabelColor = '#94a3b8';

const degrees = 360;

const genAngles = (length: number) =>
  [...new Array(length + 1)].map((_, i) => ({
    angle: i * (degrees / length) + (length % 2 === 0 ? 0 : degrees / length / 2),
  }));

const genPoints = (length: number, radius: number) => {
  const step = (Math.PI * 2) / length;
  return [...new Array(length)].map((_, i) => ({
    x: radius * Math.sin(i * step),
    y: radius * Math.cos(i * step),
  }));
};

function genPolygonPoints<Datum>(
  dataArray: Datum[],
  scale: (n: number) => number,
  getValue: (d: Datum) => number,
) {
  const step = (Math.PI * 2) / dataArray.length;
  let pointString = "";
  const points: { x: number; y: number }[] = [];

  if (dataArray.length === 0) {
    return { points, pointString };
  }

  for (let i = 0; i < dataArray.length; i++) {
    const xVal = scale(getValue(dataArray[i])) * Math.sin(i * step);
    const yVal = scale(getValue(dataArray[i])) * Math.cos(i * step);
    points.push({ x: xVal, y: yVal });
    pointString += `${xVal},${yVal} `;
  }
  return { points, pointString: pointString.trim() };
}

const defaultMargin = { top: 40, left: 80, right: 80, bottom: 80 };

export interface RadarChartData {
  name: string;
  value: number;
}

export interface RadarChartProps {
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  levels?: number;
  data: RadarChartData[];
  className?: string;
  fillColor?: string;
  strokeColor?: string;
  pointColor?: string;
  gridColor?: string;
  backgroundColor?: string;
  labelColor?: string;
  responsive?: boolean;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  width: propWidth = 400,
  height: propHeight = 300,
  margin = defaultMargin,
  levels = 5,
  data,
  className,
  fillColor = darkFillColor,
  strokeColor = darkStrokeColor,
  pointColor = darkPointColor,
  gridColor = darkGridColor,
  backgroundColor = 'transparent',
  labelColor = darkLabelColor,
  responsive = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: propWidth, height: propHeight });

  useEffect(() => {
    if (responsive && containerRef.current) {
      const updateDimensions = () => {
        const container = containerRef.current;
        if (container) {
          const containerWidth = container.clientWidth;
          const containerHeight = container.clientHeight;
          setDimensions({
            width: Math.max(300, containerWidth - 20),
            height: Math.max(250, containerHeight - 20),
          });
        }
      };

      updateDimensions();
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, [responsive]);

  const width = responsive ? dimensions.width : propWidth;
  const height = responsive ? dimensions.height : propHeight;

  if (width < 10 || !data || data.length === 0) return null; 

  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;
  const radius = Math.min(xMax, yMax) / 2;

  
  if (radius <= 0) return null;

  const radialScale = scaleLinear<number>({
    range: [0, Math.PI * 2],
    domain: [degrees, 0],
  });

  const yScale = scaleLinear<number>({
    range: [0, radius],
    domain: [0, Math.max(...data.map(d => d.value), 0)],
  });

  const webs = genAngles(data.length);
  const axisLineEndpoints = genPoints(data.length, radius); 
  const polygonDataPoints = genPolygonPoints(data, (d) => yScale(d) ?? 0, (d) => d.value);
  const zeroPoint = new Point({ x: 0, y: 0 });

  const content = (
    <svg width={width} height={height} className={cn(className)}>
      <rect fill={backgroundColor} width={width} height={height} rx={14} />
      <Group top={margin.top + yMax / 2} left={margin.left + xMax / 2}>
        {[...new Array(levels)].map((_, i) => (
          <LineRadial
            key={`web-${i}`}
            data={webs}
            angle={(d) => radialScale(d.angle) ?? 0}
            radius={((i + 1) * radius) / levels}
            fill="none"
            stroke={gridColor}
            strokeWidth={2}
            strokeOpacity={0.8}
            strokeLinecap="round"
          />
        ))}
        {[...new Array(data.length)].map((_, i) => (
          <Line key={`radar-line-${i}`} from={zeroPoint} to={axisLineEndpoints[i]} stroke={gridColor} />
        ))}
        {polygonDataPoints.pointString && (
          <polygon
            points={polygonDataPoints.pointString}
            fill={fillColor}
            fillOpacity={0.3}
            stroke={strokeColor}
            strokeWidth={1}
          />
        )}
        {polygonDataPoints.points.map((point, i) => (
          <circle key={`radar-point-${i}`} cx={point.x} cy={point.y} r={4} fill={pointColor} />
        ))}
        {/* Labels for each axis */}
        {axisLineEndpoints.map((point, i) => {
          const labelRadius = radius + 20;
          const labelX = point.x * (labelRadius / radius);
          const labelY = point.y * (labelRadius / radius);
          return (
            <text
              key={`label-${i}`}
              x={labelX}
              y={labelY}
              fontSize={12}
              fill={labelColor}
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-medium"
            >
              {data[i]?.name || ''}
            </text>
          );
        })}
      </Group>
    </svg>
  );

  if (responsive) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};
