import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SYNTHETIC_SAMPLE_DATASET } from './data/syntheticSample';
import type { JourneyPlanRequest, JourneyPlanResult, SmartTransitDataset } from './data/types';
import { getAvailableSamplePairs, planJourneys } from './engine/journeyPlanner';
import { DataBanner } from './components/DataBanner';
import { DatasetSchemaView } from './components/DatasetSchemaView';
import { CrowdingAnalyticsView } from './components/CrowdingAnalyticsView';
import { JourneyComparisonList } from './components/JourneyComparisonList';
import { JourneySearchForm } from './components/JourneySearchForm';
import { SidebarNav } from './components/SidebarNav';
import type { WorkspaceSection } from './components/SidebarNav';
import { TopBar } from './components/TopBar';
import { TransitMap } from './components/TransitMap';

const DEFAULT_REQUEST: JourneyPlanRequest = {
  originStopId: 'stop-rajiv-chowk',
  destinationStopId: 'stop-hauz-khas',
  travelDate: '2026-11-20',
  travelTime: '09:00',
  priority: 'balanced',
  modeFilter: 'all',
};

export default function App() {
  const [dataset, setDataset] = useState<SmartTransitDataset>(SYNTHETIC_SAMPLE_DATASET);
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('planner');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [request, setRequest] = useState<JourneyPlanRequest>(DEFAULT_REQUEST);
  const [result, setResult] = useState<JourneyPlanResult | null>(() =>
    planJourneys(SYNTHETIC_SAMPLE_DATASET, DEFAULT_REQUEST)
  );
  const [selectedCorridorId, setSelectedCorridorId] = useState<string | null>(() => {
    const initial = planJourneys(SYNTHETIC_SAMPLE_DATASET, DEFAULT_REQUEST);
    return initial.options[0]?.corridor.id ?? null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string>('');
  const searchTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const availablePairs = useMemo(() => getAvailableSamplePairs(dataset), [dataset]);

  const executePlan = useCallback(
    (nextRequest: JourneyPlanRequest, activeDataset: SmartTransitDataset, withLoading = false) => {
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
      }

      const run = () => {
        const nextResult = planJourneys(activeDataset, nextRequest);
        setResult(nextResult);
        setSelectedCorridorId(nextResult.options[0]?.corridor.id ?? null);
        setIsLoading(false);

        if (nextResult.status === 'ok') {
          setLiveStatus(
            `Found ${nextResult.options.length} corridor ${
              nextResult.options.length === 1 ? 'option' : 'options'
            } ranked by ${nextRequest.priority.replace('_', ' ')}.`
          );
        } else if (nextResult.status === 'validation_error') {
          setLiveStatus(nextResult.errorMessage ?? 'Please fix journey inputs.');
        } else {
          setLiveStatus('No matching corridors found in the active dataset.');
        }
      };

      if (withLoading) {
        setIsLoading(true);
        searchTimerRef.current = window.setTimeout(run, 180);
      } else {
        run();
      }
    },
    []
  );

  const handleRequestChange = (next: JourneyPlanRequest) => {
    setRequest(next);
    // Keep priority/mode/time/date responsive immediately when valid routes are already displayed
    const priorityOrFilterChanged =
      next.priority !== request.priority ||
      next.modeFilter !== request.modeFilter ||
      next.travelTime !== request.travelTime ||
      next.travelDate !== request.travelDate;

    if (priorityOrFilterChanged && result !== null && next.originStopId && next.destinationStopId) {
      executePlan(next, dataset, false);
    }
  };

  const handleSearchSubmit = () => {
    executePlan(request, dataset, true);
  };

  const handleResetPlanner = () => {
    const cleared: JourneyPlanRequest = {
      ...request,
      originStopId: '',
      destinationStopId: '',
      modeFilter: 'all',
    };
    setRequest(cleared);
    setResult(null);
    setSelectedCorridorId(null);
    setLiveStatus('Cleared journey selection.');
  };

  const handleLoadSampleQuery = () => {
    const firstPair = availablePairs[0];
    const nextRequest: JourneyPlanRequest = {
      ...request,
      originStopId: firstPair?.originStopId ?? dataset.stops[0]?.id ?? '',
      destinationStopId: firstPair?.destinationStopId ?? dataset.stops[1]?.id ?? '',
      modeFilter: 'all',
    };
    setRequest(nextRequest);
    executePlan(nextRequest, dataset, true);
  };

  const handleResetModeFilter = () => {
    const nextRequest: JourneyPlanRequest = {
      ...request,
      modeFilter: 'all',
    };
    setRequest(nextRequest);
    executePlan(nextRequest, dataset, false);
  };

  const handleLoadValidatedDataset = (nextDataset: SmartTransitDataset) => {
    setDataset(nextDataset);
    const pairs = getAvailableSamplePairs(nextDataset);
    const nextReq: JourneyPlanRequest = {
      ...request,
      originStopId: pairs[0]?.originStopId ?? nextDataset.stops[0]?.id ?? '',
      destinationStopId: pairs[0]?.destinationStopId ?? nextDataset.stops[1]?.id ?? '',
      modeFilter: 'all',
    };
    setRequest(nextReq);
    executePlan(nextReq, nextDataset, false);
  };

  const handleResetToSynthetic = () => {
    setDataset(SYNTHETIC_SAMPLE_DATASET);
    setRequest(DEFAULT_REQUEST);
    executePlan(DEFAULT_REQUEST, SYNTHETIC_SAMPLE_DATASET, false);
  };

  const selectedOption = useMemo(() => {
    if (!result || result.status !== 'ok') return null;
    return (
      result.options.find((opt) => opt.corridor.id === selectedCorridorId) ??
      result.options[0] ??
      null
    );
  }, [result, selectedCorridorId]);

  const isUsingSynthetic = dataset.metadata.sourceType === 'synthetic_sample';
  const validationError =
    result?.status === 'validation_error' ? result.errorMessage : undefined;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-teal-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      <SidebarNav
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        sourceType={dataset.metadata.sourceType}
        stopCount={dataset.stops.length}
        corridorCount={dataset.corridors.length}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          activeSection={activeSection}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onPrimaryAction={() =>
            setActiveSection(activeSection === 'dataset' ? 'planner' : 'dataset')
          }
        />

        <main
          id="main-content"
          className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
        >
          <DataBanner
            metadata={dataset.metadata}
            onInspectDataset={() => setActiveSection('dataset')}
          />

          <div className="sr-only" role="status" aria-live="polite">
            {liveStatus}
          </div>

          {activeSection === 'planner' && (
            <div className="space-y-6">
              <JourneySearchForm
                stops={dataset.stops}
                request={request}
                availablePairs={availablePairs}
                isLoading={isLoading}
                validationError={validationError}
                onChangeRequest={handleRequestChange}
                onSubmit={handleSearchSubmit}
                onReset={handleResetPlanner}
              />

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-7">
                  <JourneyComparisonList
                    result={result}
                    stops={dataset.stops}
                    sourceType={dataset.metadata.sourceType}
                    selectedCorridorId={selectedOption?.corridor.id ?? null}
                    isLoading={isLoading}
                    onSelectCorridor={setSelectedCorridorId}
                    onLoadSampleQuery={handleLoadSampleQuery}
                    onResetModeFilter={handleResetModeFilter}
                  />
                </div>
                <div className="xl:col-span-5 xl:sticky xl:top-22">
                  <TransitMap
                    stops={dataset.stops}
                    selectedOption={selectedOption}
                    sourceType={dataset.metadata.sourceType}
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'analytics' && (
            <CrowdingAnalyticsView dataset={dataset} />
          )}

          {activeSection === 'dataset' && (
            <DatasetSchemaView
              dataset={dataset}
              isUsingSynthetic={isUsingSynthetic}
              onLoadValidatedDataset={handleLoadValidatedDataset}
              onResetToSynthetic={handleResetToSynthetic}
            />
          )}
        </main>

        <footer className="border-t border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
            <p>
              SmartTransit Delhi · Transport Stack Hackathon 2026 (Problem 2: Crowdedness-Aware Journey Planner)
            </p>
            <p>
              Map tiles &copy; OpenStreetMap contributors via Leaflet · Zero paid APIs
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
