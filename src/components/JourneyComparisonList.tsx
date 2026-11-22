import { AlertCircle, ArrowRight, Compass, Users } from 'lucide-react';
import type {
  DatasetSourceType,
  JourneyOption,
  JourneyPlanResult,
  TransitStop,
} from '../data/types';
import { TIME_SLOT_META } from '../engine/journeyPlanner';
import { formatModeLabel, getCrowdingVisualMeta } from './crowdingStyles';

interface JourneyComparisonListProps {
  result: JourneyPlanResult | null;
  stops: TransitStop[];
  sourceType: DatasetSourceType;
  selectedCorridorId: string | null;
  isLoading: boolean;
  onSelectCorridor: (corridorId: string) => void;
  onLoadSampleQuery: () => void;
  onResetModeFilter: () => void;
}

export function JourneyComparisonList({
  result,
  stops,
  sourceType,
  selectedCorridorId,
  isLoading,
  onSelectCorridor,
  onLoadSampleQuery,
  onResetModeFilter,
}: JourneyComparisonListProps) {
  const stopById = new Map(stops.map((s) => [s.id, s]));

  if (isLoading) {
    return (
      <section
        aria-label="Loading journey options"
        aria-busy="true"
        className="space-y-3"
      >
        {[0, 1, 2].map((idx) => (
          <div
            key={idx}
            className="rounded-xl bg-white border border-slate-200 p-5 animate-pulse"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="h-5 w-52 rounded bg-slate-200" />
              <div className="h-5 w-28 rounded bg-slate-200" />
            </div>
            <div className="mt-3 h-4 w-72 rounded bg-slate-100" />
            <div className="mt-4 h-2 w-full rounded bg-slate-100" />
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="h-4 w-44 rounded bg-slate-100" />
              <div className="h-4 w-24 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </section>
    );
  }

  // Initial state before user has submitted a journey query
  if (!result) {
    return (
      <section
        aria-label="Journey planner empty state"
        className="rounded-xl bg-white border border-slate-200 p-8 text-center"
      >
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Compass className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-base font-display font-semibold text-slate-900">
          Ready to compare Delhi transit corridors
        </h2>
        <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
          Select an origin, destination, and departure time above, then click Find Journeys to evaluate expected crowding categories.
        </p>
        <button
          type="button"
          onClick={onLoadSampleQuery}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors focus-visible:outline-2 focus-visible:outline-teal-700"
        >
          Try Rajiv Chowk to Hauz Khas test corridor
        </button>
      </section>
    );
  }

  if (result.status === 'validation_error') {
    return (
      <section
        aria-label="Journey validation state"
        className="rounded-xl bg-white border border-slate-200 p-6"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h2 className="text-base font-display font-semibold text-slate-900">
              Complete journey inputs to compare routes
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {result.errorMessage}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (result.status === 'empty' || result.options.length === 0) {
    return (
      <section
        aria-label="No matching corridors found"
        className="rounded-xl bg-white border border-slate-200 p-8 text-center"
      >
        <h2 className="text-base font-display font-semibold text-slate-900">
          No matching corridors in the active dataset
        </h2>
        <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
          The current {sourceType === 'synthetic_sample' ? 'tiny synthetic test fixture' : 'loaded dataset'} does not include a route for this stop pair and mode filter. Try switching to All Modes or picking one of the listed sample pairs.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onResetModeFilter}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors focus-visible:outline-2 focus-visible:outline-teal-700"
          >
            Show All Modes
          </button>
          <button
            type="button"
            onClick={onLoadSampleQuery}
            className="inline-flex items-center rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors focus-visible:outline-2 focus-visible:outline-teal-700"
          >
            Load Rajiv Chowk to Hauz Khas
          </button>
        </div>
      </section>
    );
  }

  const slotMeta = TIME_SLOT_META[result.timeSlot];

  return (
    <section aria-labelledby="journey-results-heading" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
        <h2
          id="journey-results-heading"
          className="text-base font-display font-semibold text-slate-900"
        >
          Journey Comparison ({result.options.length}{' '}
          {result.options.length === 1 ? 'option' : 'options'})
        </h2>
        <p className="text-xs text-slate-500 tabular-nums">
          {slotMeta.label} ({slotMeta.shortLabel}) ·{' '}
          {result.dayType === 'weekday' ? 'Weekday' : 'Weekend'} ·{' '}
          {sourceType === 'synthetic_sample' ? 'Synthetic test fixture' : 'Validated dataset'}
        </p>
      </div>

      <div className="space-y-3" role="list" aria-label="Recommended journey options">
        {result.options.map((option: JourneyOption, index: number) => {
          const isSelected = selectedCorridorId === option.corridor.id;
          const visual = getCrowdingVisualMeta(
            option.expectedCrowding,
            option.relativeCrowdingIndex
          );

          return (
            <article
              key={option.corridor.id}
              role="listitem"
              className={`rounded-xl bg-white border transition-colors ${
                isSelected
                  ? 'border-teal-700 ring-1 ring-teal-700'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="p-5">
                {/* Quiet 1-line unboxed kicker */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">
                      Option {index + 1}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{formatModeLabel(option.corridor.primaryMode)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {option.corridor.transfers === 0
                        ? 'Direct (0 transfers)'
                        : `${option.corridor.transfers} transfer${option.corridor.transfers > 1 ? 's' : ''}`}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{option.stopCount} stops</span>
                  </div>
                  {option.isRecommended && (
                    <span className="font-semibold text-teal-800">
                      Top Ranked for Current Priority
                    </span>
                  )}
                </div>

                {/* Primary title & crowding readout */}
                <div className="mt-2 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <h3 className="text-base font-display font-bold text-slate-900">
                      {option.corridor.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {option.recommendationReason}
                    </p>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <div
                      className={`inline-flex items-center gap-1.5 text-sm font-semibold ${visual.textClass}`}
                    >
                      <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{visual.label}</span>
                    </div>
                    <p className="text-xs font-mono text-slate-500 tabular-nums mt-0.5">
                      {option.relativeCrowdingIndex !== null
                        ? `${option.crowdingRecord?.isSyntheticTestValue ? 'Test index' : 'Demand index'}: ${option.relativeCrowdingIndex}/100`
                        : 'Index unavailable'}
                    </p>
                  </div>
                </div>

                {/* Accessible horizontal crowding bar */}
                <div className="mt-3.5">
                  <div
                    className="h-2 w-full rounded-full bg-slate-100 overflow-hidden"
                    role="progressbar"
                    aria-label={`Expected crowding level for ${option.corridor.name}: ${visual.label}`}
                    aria-valuenow={option.relativeCrowdingIndex ?? 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${visual.barClass}`}
                      style={{ width: `${visual.barWidthPct}%` }}
                    />
                  </div>
                </div>

                {/* Corridor legs */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2">
                  {option.corridor.legs.map((leg) => {
                    const fromName = stopById.get(leg.fromStopId)?.name ?? leg.fromStopId;
                    const toName = stopById.get(leg.toStopId)?.name ?? leg.toStopId;
                    return (
                      <div
                        key={leg.legId}
                        className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-2.5 w-2.5 rounded-xs shrink-0"
                            style={{ backgroundColor: leg.lineColor }}
                            aria-hidden="true"
                          />
                          <span className="font-medium text-slate-900">
                            {leg.lineName}
                          </span>
                          <span aria-hidden="true" className="text-slate-300">
                            /
                          </span>
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <span>{fromName}</span>
                            <ArrowRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                            <span>{toName}</span>
                          </span>
                        </div>
                        <span className="text-slate-500">
                          {leg.geometryType === 'gps_trace'
                            ? 'Verified GPS geometry'
                            : 'Schematic connector'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Footer metrics (transparently pending when official dataset not loaded) */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600 tabular-nums">
                    <span>
                      Travel time:{' '}
                      <strong className="font-medium text-slate-800">
                        {option.corridor.verifiedTravelTimeMinutes !== null
                          ? `${option.corridor.verifiedTravelTimeMinutes} min`
                          : 'Pending official data'}
                      </strong>
                    </span>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span>
                      Ticket volume:{' '}
                      <strong className="font-medium text-slate-800">
                        {option.crowdingRecord?.verifiedTicketVolume !== null &&
                        option.crowdingRecord?.verifiedTicketVolume !== undefined
                          ? option.crowdingRecord.verifiedTicketVolume.toLocaleString()
                          : 'Pending official data'}
                      </strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectCorridor(option.corridor.id)}
                    aria-pressed={isSelected}
                    className={`self-start sm:self-auto px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700 ${
                      isSelected
                        ? 'bg-teal-50 text-teal-900'
                        : 'text-teal-700 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? 'Highlighted on map' : 'Inspect on map'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
