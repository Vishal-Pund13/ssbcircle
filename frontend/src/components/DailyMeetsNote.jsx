// Shown when a visitor lands and nobody else is around, so a quiet moment gives
// them a concrete time to come back for instead of a reason to bounce.
//
// The times below are a standing commitment kept by hand: there is no recurring
// room support yet, so someone opens these rooms each night. If that changes,
// change this copy — it should never promise a meet that will not happen.
import { Clock } from 'lucide-react';

export default function DailyMeetsNote() {
  return (
    <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 bg-brand-50 border border-brand-100 rounded-xl px-4 sm:px-5 py-4">
      <div className="w-10 h-10 rounded-xl bg-white border border-brand-100 flex items-center justify-center shrink-0">
        <Clock className="w-5 h-5 text-brand-600" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">No other aspirants right now?</p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          Practice meets run every day at <span className="font-semibold text-brand-700">10 PM</span> and{' '}
          <span className="font-semibold text-brand-700">11 PM IST</span>. Come back at those times and join in.
        </p>
      </div>
    </div>
  );
}
