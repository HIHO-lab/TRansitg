import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { DatasetMetadata } from '../data/types';

interface DataBannerProps {
  metadata: DatasetMetadata;
  onInspectDataset: () => void;
}

export function DataBanner({ metadata, onInspectDataset }: DataBannerProps) {
  const isSynthetic = metadata.sourceType === 'synthetic_sample';

  return (
    <section
      aria-label="Active dataset provenance notice"
      className={`rounded-lg border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
        isSynthetic
          ? 'bg-amber-50/70 border-amber-200 text-amber-950'
          : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
      }`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        {isSynthetic ? (
          <AlertTriangle
            className="h-4 w-4 mt-0.5 shrink-0 text-amber-700"
            aria-hidden="true"
          />
        ) : (
          <CheckCircle2
            className="h-4 w-4 mt-0.5 shrink-0 text-emerald-700"
            aria-hidden="true"
          />
        )}
        <div className="text-xs sm:text-sm leading-5">
          <span className="font-semibold">
            {isSynthetic
              ? 'Synthetic Sample Dataset Active — For Testing Only.'
              : `Validated Dataset Loaded: ${metadata.datasetName}.`}
          </span>{' '}
          <span className={isSynthetic ? 'text-amber-900' : 'text-emerald-900'}>
            {metadata.disclaimer}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onInspectDataset}
        className={`self-start sm:self-center text-xs font-semibold underline underline-offset-4 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 rounded ${
          isSynthetic
            ? 'text-amber-900 hover:text-amber-700 focus-visible:outline-amber-700'
            : 'text-emerald-900 hover:text-emerald-700 focus-visible:outline-emerald-700'
        }`}
      >
        {isSynthetic ? 'Replace with official JSON' : 'Inspect dataset details'}
      </button>
    </section>
  );
}
