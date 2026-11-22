import type { FormEvent } from 'react';
import { ArrowLeftRight, RotateCcw, Search } from 'lucide-react';
import type {
  JourneyPlanRequest,
  TransitMode,
  TransitStop,
  TravelPriority,
} from '../data/types';
import { TIME_SLOT_META, resolveDayType, resolveTimeSlot } from '../engine/journeyPlanner';

interface JourneySearchFormProps {
  stops: TransitStop[];
  request: JourneyPlanRequest;
  availablePairs: Array<{
    originStopId: string;
    destinationStopId: string;
    label: string;
    routeCount: number;
  }>;
  isLoading: boolean;
  validationError?: string;
  onChangeRequest: (next: JourneyPlanRequest) => void;
  onSubmit: () => void;
  onReset: () => void;
}

const PRIORITY_OPTIONS: Array<{ value: TravelPriority; label: string }> = [
  { value: 'balanced', label: 'Balanced' },
  { value: 'least_crowded', label: 'Least Crowded' },
  { value: 'fewest_transfers', label: 'Fewest Transfers' },
];

const MODE_OPTIONS: Array<{ value: 'all' | TransitMode; label: string }> = [
  { value: 'all', label: 'All Modes' },
  { value: 'metro', label: 'Metro' },
  { value: 'bus', label: 'Bus' },
  { value: 'multimodal', label: 'Metro + Bus' },
];

export function JourneySearchForm({
  stops,
  request,
  availablePairs,
  isLoading,
  validationError,
  onChangeRequest,
  onSubmit,
  onReset,
}: JourneySearchFormProps) {
  const activeTimeSlot = resolveTimeSlot(request.travelTime);
  const activeDayType = resolveDayType(request.travelDate);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const handleSwapStops = () => {
    onChangeRequest({
      ...request,
      originStopId: request.destinationStopId,
      destinationStopId: request.originStopId,
    });
  };

  return (
    <section
      aria-labelledby="journey-form-heading"
      className="rounded-xl bg-white border border-slate-200 p-5 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h1
            id="journey-form-heading"
            className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight"
          >
            Crowdedness-Aware Journey Planner
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Compare Delhi public transit corridors by expected crowding category, transfer count, and departure window.
          </p>
        </div>
        <p className="text-xs font-mono text-slate-500 tabular-nums whitespace-nowrap">
          Window: {TIME_SLOT_META[activeTimeSlot].label} · {activeDayType === 'weekday' ? 'Weekday' : 'Weekend'}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-5">
        {/* Origin, Swap, Destination, Date, Time */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4">
            <label
              htmlFor="origin-stop"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Origin hub
            </label>
            <select
              id="origin-stop"
              name="originStopId"
              value={request.originStopId}
              onChange={(e) =>
                onChangeRequest({ ...request, originStopId: e.target.value })
              }
              className="w-full h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-teal-700 focus:outline-2 focus:outline-teal-700/20"
            >
              <option value="">Select origin stop</option>
              {stops.map((stop) => (
                <option key={stop.id} value={stop.id}>
                  {stop.name} ({stop.code})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1 flex justify-start md:justify-center">
            <button
              type="button"
              onClick={handleSwapStops}
              aria-label="Swap origin and destination stops"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors focus-visible:outline-2 focus-visible:outline-teal-700"
            >
              <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="md:col-span-4">
            <label
              htmlFor="destination-stop"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Destination hub
            </label>
            <select
              id="destination-stop"
              name="destinationStopId"
              value={request.destinationStopId}
              onChange={(e) =>
                onChangeRequest({ ...request, destinationStopId: e.target.value })
              }
              className="w-full h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-teal-700 focus:outline-2 focus:outline-teal-700/20"
            >
              <option value="">Select destination stop</option>
              {stops.map((stop) => (
                <option key={stop.id} value={stop.id}>
                  {stop.name} ({stop.code})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="travel-date"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Date
              </label>
              <input
                id="travel-date"
                type="date"
                value={request.travelDate}
                onChange={(e) =>
                  onChangeRequest({ ...request, travelDate: e.target.value })
                }
                className="w-full h-11 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-900 tabular-nums focus:border-teal-700 focus:outline-2 focus:outline-teal-700/20"
              />
            </div>

            <div>
              <label
                htmlFor="travel-time"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Time
              </label>
              <input
                id="travel-time"
                type="time"
                value={request.travelTime}
                onChange={(e) =>
                  onChangeRequest({ ...request, travelTime: e.target.value })
                }
                className="w-full h-11 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-900 tabular-nums focus:border-teal-700 focus:outline-2 focus:outline-teal-700/20"
              />
            </div>
          </div>
        </div>

        {/* Priority & Mode Segmented Controls + Actions */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 flex-wrap">
            <fieldset>
              <legend className="text-xs font-semibold text-slate-700 mb-1.5">
                Ranking priority
              </legend>
              <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {PRIORITY_OPTIONS.map((option) => {
                  const active = request.priority === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        onChangeRequest({ ...request, priority: option.value })
                      }
                      aria-pressed={active}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700 ${
                        active
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-xs font-semibold text-slate-700 mb-1.5">
                Transit mode
              </legend>
              <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {MODE_OPTIONS.map((option) => {
                  const active = request.modeFilter === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        onChangeRequest({ ...request, modeFilter: option.value })
                      }
                      aria-pressed={active}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700 ${
                        active
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Clear</span>
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-teal-700 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span>{isLoading ? 'Evaluating...' : 'Find Journeys'}</span>
            </button>
          </div>
        </div>

        {/* Inline Validation Feedback */}
        {validationError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800"
          >
            {validationError}
          </div>
        )}

        {/* Quick test pairs from active dataset */}
        {availablePairs.length > 0 && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <span className="font-medium text-slate-500">
              Available corridors in active dataset:
            </span>
            {availablePairs.map((pair) => {
              const isSelected =
                request.originStopId === pair.originStopId &&
                request.destinationStopId === pair.destinationStopId;
              return (
                <button
                  key={`${pair.originStopId}-${pair.destinationStopId}`}
                  type="button"
                  onClick={() =>
                    onChangeRequest({
                      ...request,
                      originStopId: pair.originStopId,
                      destinationStopId: pair.destinationStopId,
                    })
                  }
                  className={`underline underline-offset-4 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-teal-700 rounded ${
                    isSelected
                      ? 'font-semibold text-teal-800'
                      : 'text-slate-600 hover:text-teal-700'
                  }`}
                >
                  {pair.label} ({pair.routeCount})
                </button>
              );
            })}
          </div>
        )}
      </form>
    </section>
  );
}
