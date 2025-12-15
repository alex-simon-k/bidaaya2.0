'use client';

import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import {
  FunnelChart,
  FunnelSeries,
  FunnelArc,
  FunnelAxis,
  FunnelAxisLabel,
  FunnelAxisLine,
} from 'reaviz';

// TypeScript interface for FunnelChart data points
interface FunnelDataPoint {
  key: string;
  data: number;
}

// SVG Icon Components
const UpArrowIcon: React.FC<{ className?: string; strokeColor?: string }> = ({
  className = 'w-5 h-[21px]',
  strokeColor = '#F08083',
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 20 21"
    fill="none"
  >
    <path
      d="M5.50134 9.11119L10.0013 4.66675M10.0013 4.66675L14.5013 9.11119M10.0013 4.66675L10.0013 16.3334"
      stroke={strokeColor}
      strokeWidth="2"
      strokeLinecap="square"
    />
  </svg>
);

const DownArrowIcon: React.FC<{ className?: string; strokeColor?: string }> = ({
  className = 'w-5 h-[21px]',
  strokeColor = '#40E5D1',
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 20 21"
    fill="none"
  >
    <path
      d="M14.4987 11.8888L9.99866 16.3333M9.99866 16.3333L5.49866 11.8888M9.99866 16.3333V4.66658"
      stroke={strokeColor}
      strokeWidth="2"
      strokeLinecap="square"
    />
  </svg>
);

interface MetricItem {
  label: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
}

interface StudentDistributionFunnelProps {
  title?: string;
  data: FunnelDataPoint[];
  primaryMetric?: {
    label: string;
    value: number;
    change: string;
    changeType: 'increase' | 'decrease';
    comparisonText?: string;
  };
  secondaryMetric?: {
    label: string;
    value: number;
    change: string;
    changeType: 'increase' | 'decrease';
    comparisonText?: string;
  };
  metrics?: MetricItem[];
  colorScheme?: string[];
  timeRangeOptions?: { value: string; label: string }[];
  defaultTimeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  className?: string;
}

export function StudentDistributionFunnel({
  title = 'Student Distribution',
  data,
  primaryMetric,
  secondaryMetric,
  metrics = [],
  colorScheme = ['#5B14C5'],
  timeRangeOptions = [
    { value: 'last-7-days', label: 'Last 7 Days' },
    { value: 'last-30-days', label: 'Last 30 Days' },
    { value: 'last-90-days', label: 'Last 90 Days' },
  ],
  defaultTimeRange = 'last-30-days',
  onTimeRangeChange,
  className = '',
}: StudentDistributionFunnelProps) {
  const [selectedTimeRange, setSelectedTimeRange] = React.useState(defaultTimeRange);

  // Validate and clean data
  const validatedData: FunnelDataPoint[] = data.map((item) => ({
    key: typeof item.key === 'string' ? item.key : String(item.key || 'Unknown Stage'),
    data: typeof item.data === 'number' && !isNaN(item.data) ? item.data : 0,
  }));

  const funnelAxisLineColor = '#7E7E8F75';

  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRange = e.target.value;
    setSelectedTimeRange(newRange);
    onTimeRangeChange?.(newRange);
  };

  return (
    <div
      className={`flex flex-col justify-between pt-3 pb-3 bg-white dark:bg-black rounded-xl shadow-lg w-full h-auto overflow-hidden text-black dark:text-white transition-colors duration-300 ${className}`}
    >
      <div className="flex justify-between items-center p-4 pb-3">
        <h3 className="text-lg text-left font-semibold">{title}</h3>
        <select
          aria-label="Select time range"
          value={selectedTimeRange}
          onChange={handleTimeRangeChange}
          className="p-2 text-xs rounded-md bg-gray-100 text-gray-800 dark:bg-[#262631] dark:text-white transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {timeRangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="h-[180px] w-full px-3">
        <FunnelChart
          id="studentDistributionFunnel"
          width={400}
          height={180}
          data={validatedData}
          series={
            <FunnelSeries
              arc={
                <FunnelArc
                  colorScheme={colorScheme}
                  gradient={null}
                  glow={{
                    blur: 30,
                    color: colorScheme[0] || '#5B14C5',
                  }}
                />
              }
              axis={
                <FunnelAxis
                  label={
                    <FunnelAxisLabel className="font-bold text-xs text-gray-600 dark:text-gray-400 transition-colors duration-300" />
                  }
                  line={<FunnelAxisLine strokeColor={funnelAxisLineColor} />}
                />
              }
            />
          }
        />
      </div>

      {(primaryMetric || secondaryMetric) && (
        <div className="flex w-full pl-4 pr-4 justify-between pb-2 pt-2">
          {primaryMetric && (
            <div className="flex flex-col gap-1 w-1/2">
              <span className="text-sm text-gray-500 dark:text-[#9A9AAF]">{primaryMetric.label}</span>
              <div className="flex items-center gap-2">
                <CountUp
                  className="font-mono text-2xl font-semibold"
                  start={0}
                  end={primaryMetric.value}
                  duration={2.5}
                />
                <div
                  className={`flex bg-[rgb(232,64,69)]/40 p-1 pl-1.5 pr-1.5 items-center rounded-full text-xs ${
                    primaryMetric.changeType === 'increase'
                      ? 'text-[#F08083]'
                      : 'bg-[rgb(64,229,209)]/40 text-[#40E5D1]'
                  }`}
                >
                  {primaryMetric.changeType === 'increase' ? (
                    <UpArrowIcon className="w-3 h-3" />
                  ) : (
                    <DownArrowIcon className="w-3 h-3" />
                  )}
                  {primaryMetric.change.replace('-', '').replace('+', '')}
                </div>
              </div>
              {primaryMetric.comparisonText && (
                <span className="text-gray-500 dark:text-[#9A9AAF] text-xs transition-colors duration-300">
                  {primaryMetric.comparisonText}
                </span>
              )}
            </div>
          )}
          {secondaryMetric && (
            <div className="flex flex-col gap-1 w-1/2">
              <span className="text-sm text-gray-500 dark:text-[#9A9AAF]">{secondaryMetric.label}</span>
              <div className="flex items-center gap-2">
                <CountUp
                  className="font-mono text-2xl font-semibold"
                  start={0}
                  end={secondaryMetric.value}
                  duration={2.5}
                />
                <div
                  className={`flex p-1 pl-1.5 pr-1.5 items-center rounded-full text-xs ${
                    secondaryMetric.changeType === 'increase'
                      ? 'bg-[rgb(232,64,69)]/40 text-[#F08083]'
                      : 'bg-[rgb(64,229,209)]/40 text-[#40E5D1]'
                  }`}
                >
                  {secondaryMetric.changeType === 'increase' ? (
                    <UpArrowIcon className="w-3 h-3" />
                  ) : (
                    <DownArrowIcon className="w-3 h-3" />
                  )}
                  {secondaryMetric.change.replace('-', '').replace('+', '')}
                </div>
              </div>
              {secondaryMetric.comparisonText && (
                <span className="text-gray-500 dark:text-[#9A9AAF] text-xs transition-colors duration-300">
                  {secondaryMetric.comparisonText}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {metrics.length > 0 && (
        <div className="flex flex-col pl-4 pr-4 font-mono divide-y divide-gray-200 dark:divide-[#262631] transition-colors duration-300">
          {metrics.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex w-full pb-2 pt-2 items-center gap-2"
            >
              <div className="flex flex-row gap-2 items-center text-sm w-1/2 text-gray-500 dark:text-[#9A9AAF] transition-colors duration-300">
                <span className="truncate" title={item.label}>
                  {item.label}
                </span>
              </div>
              <div className="flex gap-2 w-1/2 justify-end items-center">
                <span className="font-semibold text-base">{item.value}</span>
                <div
                  className={`flex p-1 pl-1.5 pr-1.5 items-center rounded-full text-xs ${
                    item.changeType === 'increase'
                      ? 'bg-[rgb(232,64,69)]/40 text-[#F08083]'
                      : 'bg-[rgb(64,229,209)]/40 text-[#40E5D1]'
                  }`}
                >
                  {item.changeType === 'increase' ? (
                    <UpArrowIcon className="w-3 h-3" />
                  ) : (
                    <DownArrowIcon className="w-3 h-3" />
                  )}
                  {item.change.replace('-', '').replace('+', '')}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
