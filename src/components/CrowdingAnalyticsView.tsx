import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DayType, SmartTransitDataset, TimeSlotId, TransitMode } from '../data/types';
import {
  TIME_SLOT_META,
  TIME_SLOT_ORDER,
  buildCorridorAnalyticsRows,
  buildTimeSlotAnalytics,
} from '../engine/journeyPlanner';
import { formatModeLabel, getCrowdingVisualMeta } from './crowdingStyles';

interface CrowdingAnalyticsViewProps {
  dataset: SmartTransitDataset;
}

const MODE_OPTIONS: Array<{ value: 'all' | TransitMode; label: string }> = [
  { value: 'all', label: 'All Modes' },
  { value: 'metro', label: 'Metro' },
  { value: 'bus', label: 'Bus' },
  { value: 'multimodal', label: 'Metro + Bus' },
];

export function CrowdingAnalyticsView({ dataset }: CrowdingAnalyticsViewProps) {
  const [dayType, setDayType] = useState<DayType>('weekday');
  const [modeFilter, setModeFilter] = useState<'all' | TransitMode>('all');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotId>('morning_peak');

  const isSynthetic = dataset.metadata.sourceType === 'synthetic_sample';

  const timeSlotSeries = useMemo(
    () => buildTimeSlotAnalytics(dataset, dayType, modeFilter),
    [dataset, dayType, modeFilter]
  );

  const corridorRows = useMemo(
    () => buildCorridorAnalyticsRows(dataset, selectedSlot, dayType, modeFilter),
    [dataset, selectedSlot, dayType, modeFilter]
  );

  const timeSlotChartData = useMemo(
    () =>
      timeSlotSeries.map((point) => ({
        ...point,
        axisLabel:
          point.timeSlot === 'early_morning'
            ? 'Early'
            : point.timeSlot === 'morning_peak'
              ? 'AM Peak'
              : point.timeSlot === 'midday'
                ? 'Midday'
                : point.timeSlot === 'evening_peak'
                  ? 'PM Peak'
                  : 'Late',
      })),
    [timeSlotSeries]
  );

  const hasChartData = timeSlotSeries.some((point) => point.recordCount > 0);
  const corridorChartData = corridorRows
    .filter((row) => row.relativeCrowdingIndex !== null)
    .map((row) => ({
      name: `${row.originName} to ${row.destinationName}`,
      shortName: `${row.originName.split(' ')[0]}–${row.destinationName.split(' ')[0]} (${formatModeLabel(row.primaryMode).replace('Delhi ', '').replace('DTC ', '')})`,
      index: row.relativeCrowdingIndex ?? 0,
      mode: formatModeLabel(row.primaryMode),
    }));

  const corridorChartHeight = Math.max(288, corridorChartData.length * 34);

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <section
        aria-labelledby="analytics-heading"
        className="rounded-xl bg-white border border-slate-200 p-5 sm:p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1
              id="analytics-heading"
              className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight"
            >
              Crowding Analytics
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {isSynthetic
                ? 'Visualizing synthetic sample test indices across demand windows and corridors. Replace with official Delhi ticketing aggregates for real transit evidence.'
                : 'Visualizing validated crowding indices from the loaded official dataset.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg" role="group" aria-label="Day type filter">
              {(['weekday', 'weekend'] as DayType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDayType(type)}
                  aria-pressed={dayType === type}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-teal-700 ${
                    dayType === type
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {type === 'weekday' ? 'Weekday' : 'Weekend'}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg" role="group" aria-label="Transit mode filter">
              {MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setModeFilter(opt.value)}
                  aria-pressed={modeFilter === opt.value}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-teal-700 ${
                    modeFilter === opt.value
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        {/* Time-of-day crowding profile */}
        <section
          aria-labelledby="timeslot-chart-heading"
          className="rounded-xl bg-white border border-slate-200 p-5 sm:p-6 flex flex-col"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2
                id="timeslot-chart-heading"
                className="text-base font-display font-semibold text-slate-900"
              >
                Crowding Index by Time Window
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isSynthetic
                  ? 'Synthetic 0–100 test index · Not real DMRC/DTC ridership'
                  : 'Normalized 0–100 crowding index from loaded dataset'}
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {dayType === 'weekday' ? 'Weekday' : 'Weekend'} · {formatModeLabel(modeFilter)}
            </span>
          </div>

          <div className="mt-5 flex-1 min-h-[300px] w-full" data-testid="timeslot-crowding-chart">
            {hasChartData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={timeSlotChartData}
                  margin={{ top: 8, right: 12, left: -12, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="axisLabel"
                    interval={0}
                    tick={{ fontSize: 12, fill: '#475569' }}
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.label ?? ''
                    }
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: '8px' }} />
                  {(modeFilter === 'all' || modeFilter === 'metro') && (
                    <Bar
                      dataKey="metroAvgIndex"
                      name="Metro (Test Index)"
                      fill="#2563EB"
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                  {(modeFilter === 'all' || modeFilter === 'bus') && (
                    <Bar
                      dataKey="busAvgIndex"
                      name="DTC Bus (Test Index)"
                      fill="#0D9488"
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                  {(modeFilter === 'all' || modeFilter === 'multimodal') && (
                    <Bar
                      dataKey="multimodalAvgIndex"
                      name="Metro + Bus (Test Index)"
                      fill="#CA8A04"
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-6 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-medium text-slate-800">
                  No time-slot records for this filter combination
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  The tiny synthetic fixture only includes weekend samples for select corridors. Switch to Weekday or All Modes to inspect records.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDayType('weekday');
                    setModeFilter('all');
                  }}
                  className="mt-4 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Reset analytics filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Corridor comparison horizontal bar chart */}
        <section
          aria-labelledby="corridor-chart-heading"
          className="rounded-xl bg-white border border-slate-200 p-5 sm:p-6 flex flex-col"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2
                id="corridor-chart-heading"
                className="text-base font-display font-semibold text-slate-900"
              >
                Corridor Load Comparison
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparing corridors for {TIME_SLOT_META[selectedSlot].label} ({TIME_SLOT_META[selectedSlot].shortLabel})
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600">
              <span className="sr-only">Select time slot for corridor comparison</span>
              <select
                aria-label="Time window for corridor comparison"
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value as TimeSlotId)}
                className="h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800 focus:border-teal-700 focus:outline-2 focus:outline-teal-700/20"
              >
                {TIME_SLOT_ORDER.map((slot) => (
                  <option key={slot} value={slot}>
                    {TIME_SLOT_META[slot].label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div
            className="mt-5 w-full"
            style={{ height: `${corridorChartHeight}px` }}
            data-testid="corridor-comparison-chart"
          >
            {corridorChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={corridorChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 18, left: 6, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: '#475569' }}
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="shortName"
                    width={175}
                    tick={{ fontSize: 11, fill: '#334155' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="index"
                    name={isSynthetic ? 'Synthetic Test Index' : 'Validated Crowding Index'}
                    fill="#0F766E"
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-6 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-medium text-slate-800">
                  No corridor records for {TIME_SLOT_META[selectedSlot].label}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Try choosing Morning Peak, Midday, or Evening Peak to view synthetic test records.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Tabular Corridor Breakdown */}
      <section
        aria-labelledby="corridor-table-heading"
        className="rounded-xl bg-white border border-slate-200 overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2
              id="corridor-table-heading"
              className="text-base font-display font-semibold text-slate-900"
            >
              Corridor Crowding Breakdown ({TIME_SLOT_META[selectedSlot].label})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tabular view of active dataset records · Verified ticket volume populates once official ticketing JSON is loaded
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            {corridorRows.length} corridors
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th scope="col" className="py-3 px-5">Corridor</th>
                <th scope="col" className="py-3 px-4">Origin / Destination</th>
                <th scope="col" className="py-3 px-4">Mode</th>
                <th scope="col" className="py-3 px-4">Expected Category</th>
                <th scope="col" className="py-3 px-4 text-right">
                  {isSynthetic ? 'Test Index' : 'Crowding Index'}
                </th>
                <th scope="col" className="py-3 px-5 text-right">Verified Ticket Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {corridorRows.map((row) => {
                const visual = getCrowdingVisualMeta(
                  row.expectedCrowding,
                  row.relativeCrowdingIndex
                );
                return (
                  <tr
                    key={row.corridorId}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-5 font-medium text-slate-900">
                      {row.corridorName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {row.originName} to {row.destinationName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {formatModeLabel(row.primaryMode)}
                    </td>
                    <td className={`py-3 px-4 font-semibold ${visual.textClass}`}>
                      {visual.label}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                      {row.relativeCrowdingIndex !== null
                        ? `${row.relativeCrowdingIndex}/100`
                        : '—'}
                    </td>
                    <td className="py-3 px-5 text-right font-mono tabular-nums text-slate-500">
                      {row.verifiedTicketVolume !== null
                        ? row.verifiedTicketVolume.toLocaleString()
                        : 'Pending official data'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
