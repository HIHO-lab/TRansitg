import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { CheckCircle2, Download, FileJson, RotateCcw, Upload } from 'lucide-react';
import type { SmartTransitDataset } from '../data/types';
import { parseAndValidateDatasetJson } from '../engine/datasetValidator';

interface DatasetSchemaViewProps {
  dataset: SmartTransitDataset;
  isUsingSynthetic: boolean;
  onLoadValidatedDataset: (nextDataset: SmartTransitDataset) => void;
  onResetToSynthetic: () => void;
}

const READINESS_ITEMS = [
  {
    capability: 'Crowdedness-aware route ranking engine',
    status: 'Working now',
    detail: 'Pure TypeScript scoring & filtering decoupled from UI components.',
  },
  {
    capability: 'Origin / destination, time window & priority comparison',
    status: 'Working now',
    detail: 'Validates inputs, categorizes time slots, compares alternatives.',
  },
  {
    capability: 'Interactive Leaflet + OpenStreetMap visualization',
    status: 'Working now',
    detail: 'Renders hub markers and schematic connectors; upgrades to GPS polylines automatically when supplied.',
  },
  {
    capability: 'JSON schema validator & dataset swap interface',
    status: 'Working now',
    detail: 'Upload or paste validated SmartTransitDataset JSON without code changes.',
  },
  {
    capability: 'Official Delhi ticketing boarding & occupancy aggregations',
    status: 'Requires official dataset',
    detail: 'Currently displays clearly marked synthetic test indices and "Pending official dataset" placeholders.',
  },
  {
    capability: 'Verified travel time estimates, fares & GTFS GPS traces',
    status: 'Requires official dataset',
    detail: 'Intentionally set to null in synthetic sample; never fabricated.',
  },
];

export function DatasetSchemaView({
  dataset,
  isUsingSynthetic,
  onLoadValidatedDataset,
  onResetToSynthetic,
}: DatasetSchemaViewProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleValidateAndApply = () => {
    setSuccessMessage(null);
    const result = parseAndValidateDatasetJson(jsonInput);
    if (!result.valid || !result.dataset) {
      setValidationErrors(result.errors);
      return;
    }

    setValidationErrors([]);
    onLoadValidatedDataset(result.dataset);
    setSuccessMessage(
      `Loaded "${result.dataset.metadata.datasetName}" (${result.dataset.stops.length} stops, ${result.dataset.corridors.length} corridors, ${result.dataset.crowdingRecords.length} crowding records).`
    );
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      setJsonInput(content);
      setSuccessMessage(null);
      const result = parseAndValidateDatasetJson(content);
      if (!result.valid || !result.dataset) {
        setValidationErrors(result.errors);
        return;
      }
      setValidationErrors([]);
      onLoadValidatedDataset(result.dataset);
      setSuccessMessage(`Validated and loaded file "${file.name}".`);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([JSON.stringify(dataset, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'smarttransit-delhi-dataset-schema-v1.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrefillTemplate = () => {
    setValidationErrors([]);
    setSuccessMessage(null);
    const sampleOfficialTemplate: SmartTransitDataset = {
      ...dataset,
      metadata: {
        ...dataset.metadata,
        datasetName: 'Validated Official Ticketing Import (Preview Structure)',
        sourceType: 'official_validated',
        version: '1.0.0-import-template',
        disclaimer:
          'Imported JSON structure validated against SmartTransitDataset v1.0.0 schema.',
      },
    };
    setJsonInput(JSON.stringify(sampleOfficialTemplate, null, 2));
  };

  return (
    <div className="space-y-6">
      {/* Active dataset overview */}
      <section
        aria-labelledby="dataset-heading"
        className="rounded-xl bg-white border border-slate-200 p-5 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h1
              id="dataset-heading"
              className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight"
            >
              Dataset Interface & Schema Readiness
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Replace the synthetic test fixture with validated JSON output derived from the official Delhi ticketing dataset.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-teal-700"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Download JSON template</span>
            </button>
            {!isUsingSynthetic && (
              <button
                type="button"
                onClick={() => {
                  onResetToSynthetic();
                  setSuccessMessage('Restored built-in synthetic sample test fixture.');
                  setValidationErrors([]);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-teal-700"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Reset to synthetic sample</span>
              </button>
            )}
          </div>
        </div>

        {/* Flat summary metrics */}
        <dl className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="pt-1">
            <dt className="text-xs font-medium text-slate-500">Active source type</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {isUsingSynthetic ? 'Synthetic Test Sample' : 'Validated Official JSON'}
            </dd>
          </div>
          <div className="pt-1">
            <dt className="text-xs font-medium text-slate-500">Schema version</dt>
            <dd className="mt-1 text-sm font-mono font-semibold text-slate-900 tabular-nums">
              v{dataset.schemaVersion}
            </dd>
          </div>
          <div className="pt-1">
            <dt className="text-xs font-medium text-slate-500">Loaded transit hubs</dt>
            <dd className="mt-1 text-sm font-mono font-semibold text-slate-900 tabular-nums">
              {dataset.stops.length} stops · {dataset.corridors.length} corridors
            </dd>
          </div>
          <div className="pt-1">
            <dt className="text-xs font-medium text-slate-500">Crowding records</dt>
            <dd className="mt-1 text-sm font-mono font-semibold text-slate-900 tabular-nums">
              {dataset.crowdingRecords.length} time-slot entries
            </dd>
          </div>
        </dl>
      </section>

      {/* Loader + Readiness Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* JSON Import & Validation Panel */}
        <section
          aria-labelledby="json-loader-heading"
          className="xl:col-span-7 rounded-xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2
                id="json-loader-heading"
                className="text-base font-display font-semibold text-slate-900"
              >
                Import Validated JSON Dataset
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload a <code className="font-mono text-slate-700">.json</code> file or paste preprocessed official Delhi ticketing results conforming to{' '}
                <code className="font-mono text-slate-700">SmartTransitDataset</code>.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="sr-only"
                id="dataset-file-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-teal-700"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Upload .json file</span>
              </button>
              <button
                type="button"
                onClick={handlePrefillTemplate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-teal-700"
              >
                <FileJson className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Fill JSON structure</span>
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="dataset-json-textarea"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Validated SmartTransitDataset JSON payload
            </label>
            <textarea
              id="dataset-json-textarea"
              rows={11}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='Paste JSON conforming to { "schemaVersion": "1.0.0", "metadata": { ... }, "stops": [...], "corridors": [...], "crowdingRecords": [...] }'
              className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-xs text-slate-900 focus:bg-white focus:border-teal-700 focus:outline-2 focus:outline-teal-700/20"
            />
          </div>

          {validationErrors.length > 0 && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-900 space-y-1"
            >
              <p className="font-semibold">Dataset validation failed:</p>
              <ul className="list-disc pl-5 space-y-0.5">
                {validationErrors.slice(0, 6).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900 flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setJsonInput('');
                setValidationErrors([]);
                setSuccessMessage(null);
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-2 focus-visible:outline-teal-700"
            >
              Clear editor
            </button>
            <button
              type="button"
              onClick={handleValidateAndApply}
              className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Validate & Load Dataset
            </button>
          </div>
        </section>

        {/* Working vs Pending Official Data Checklist */}
        <section
          aria-labelledby="readiness-heading"
          className="xl:col-span-5 rounded-xl bg-white border border-slate-200 p-5 sm:p-6"
        >
          <div className="pb-3 border-b border-slate-100">
            <h2
              id="readiness-heading"
              className="text-base font-display font-semibold text-slate-900"
            >
              Hackathon Data Readiness Status
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Clear separation between implemented software capabilities and fields awaiting official Delhi ticketing records.
            </p>
          </div>

          <ul className="mt-4 divide-y divide-slate-100">
            {READINESS_ITEMS.map((item) => {
              const isReady = item.status === 'Working now';
              return (
                <li key={item.capability} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {item.capability}
                    </span>
                    <span
                      className={`text-xs font-semibold whitespace-nowrap shrink-0 ${
                        isReady ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">{item.detail}</p>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
