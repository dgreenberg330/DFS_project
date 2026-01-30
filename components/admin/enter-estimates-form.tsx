// ============================================================================
// Enter Estimates Form - Admin Component
// ============================================================================

'use client';

import { useState } from 'react';
import { batchUpdateDailyEstimates } from '@/actions/scoring';
import { calculateCurrentEstimate, getCurrentEstimateDay } from '@/lib/estimate-utils';
import { ContestWithMovies, Movie, EstimateDay } from '@/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface EnterEstimatesFormProps {
  contest: ContestWithMovies;
  movies: Movie[];
}

type DayTab = 'friday' | 'saturday' | 'sunday';

export function EnterEstimatesForm({ contest, movies }: EnterEstimatesFormProps) {
  const router = useRouter();

  // State for each day's estimates
  const [fridayEstimates, setFridayEstimates] = useState<Record<string, string>>(
    movies.reduce((acc, movie) => {
      acc[movie.id] = movie.friday_estimate?.toString() || '';
      return acc;
    }, {} as Record<string, string>)
  );

  const [saturdayEstimates, setSaturdayEstimates] = useState<Record<string, string>>(
    movies.reduce((acc, movie) => {
      acc[movie.id] = movie.saturday_estimate?.toString() || '';
      return acc;
    }, {} as Record<string, string>)
  );

  const [sundayEstimates, setSundayEstimates] = useState<Record<string, string>>(
    movies.reduce((acc, movie) => {
      acc[movie.id] = movie.sunday_estimate?.toString() || '';
      return acc;
    }, {} as Record<string, string>)
  );

  const [activeTab, setActiveTab] = useState<DayTab>('friday');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Calculate cumulative score for display
  function getCumulativeScore(movie: Movie, estimates: {
    friday: Record<string, string>;
    saturday: Record<string, string>;
    sunday: Record<string, string>;
  }): number | null {
    const fri = parseFloat(estimates.friday[movie.id]) || 0;
    const sat = parseFloat(estimates.saturday[movie.id]) || 0;
    const sun = parseFloat(estimates.sunday[movie.id]) || null;

    // If Sunday estimate is entered, use it (cumulative)
    if (sun !== null && sun > 0) return sun;
    // If Saturday estimate is entered, sum Fri + Sat
    if (sat > 0) return fri + sat;
    // If only Friday, return Friday
    if (fri > 0) return fri;
    return null;
  }

  async function handleSave(day: DayTab) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let estimates: Record<string, string>;
      switch (day) {
        case 'friday':
          estimates = fridayEstimates;
          break;
        case 'saturday':
          estimates = saturdayEstimates;
          break;
        case 'sunday':
          estimates = sundayEstimates;
          break;
      }

      // Build updates array
      const updates = Object.entries(estimates)
        .filter(([_, value]) => value !== '')
        .map(([movieId, value]) => ({
          movieId,
          estimate: parseFloat(value),
        }));

      if (updates.length === 0) {
        throw new Error(`Please enter at least one ${day} estimate`);
      }

      // Validate all values are non-negative
      const invalid = updates.filter(u => u.estimate < 0);
      if (invalid.length > 0) {
        throw new Error('Estimate values cannot be negative');
      }

      await batchUpdateDailyEstimates(updates, day);
      setSuccess(`${day.charAt(0).toUpperCase() + day.slice(1)} estimates saved successfully!`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update estimates');
    } finally {
      setLoading(false);
    }
  }

  // Check which movies have which estimates
  function getMovieStatus(movie: Movie): string {
    const parts: string[] = [];
    if (movie.friday_estimate !== null) parts.push('Fri');
    if (movie.saturday_estimate !== null) parts.push('Sat');
    if (movie.sunday_estimate !== null) parts.push('Sun');
    if (movie.actual_gross !== null) parts.push('Final');
    return parts.length > 0 ? parts.join(' + ') : 'No estimates';
  }

  const currentEstimates = {
    friday: fridayEstimates,
    saturday: saturdayEstimates,
    sunday: sundayEstimates,
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {(['friday', 'saturday', 'sunday'] as DayTab[]).map((day) => (
            <button
              key={day}
              onClick={() => setActiveTab(day)}
              className={`px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium border-b-2 ${
                activeTab === day
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {day.charAt(0).toUpperCase() + day.slice(1)}
              {day === 'sunday' && (
                <span className="ml-1 text-xs text-gray-400 hidden sm:inline">(cumulative)</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {success && (
        <div className="mx-6 mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">{success}</p>
        </div>
      )}

      {error && (
        <div className="mx-6 mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="mx-4 sm:mx-6 mt-4 sm:mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
        <h3 className="text-xs sm:text-sm font-medium text-blue-900 mb-1 sm:mb-2">
          {activeTab === 'friday' && 'Friday Estimates (Enter Saturday morning)'}
          {activeTab === 'saturday' && 'Saturday Estimates (Enter Sunday morning)'}
          {activeTab === 'sunday' && 'Sunday Estimates (Enter Monday morning)'}
        </h3>
        <p className="text-xs sm:text-sm text-blue-800">
          {activeTab === 'friday' && "Enter each movie's individual Friday gross estimate."}
          {activeTab === 'saturday' && "Enter each movie's individual Saturday gross estimate."}
          {activeTab === 'sunday' && 'Enter the cumulative weekend total (Fri-Sun) for each movie.'}
        </p>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-200">
        {movies.map((movie) => {
          const cumulative = getCumulativeScore(movie, currentEstimates);

          return (
            <div key={movie.id} className="p-4">
              <div className="font-medium text-gray-900 text-sm mb-2">{movie.title}</div>
              <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                <span>Salary: ${movie.salary}</span>
                <span>Proj: ${movie.projected_gross}M</span>
                {cumulative !== null && (
                  <span
                    className={`font-medium ${
                      cumulative > movie.projected_gross
                        ? 'text-green-600'
                        : cumulative < movie.projected_gross
                        ? 'text-red-600'
                        : 'text-gray-900'
                    }`}
                  >
                    Total: ${cumulative.toFixed(2)}M
                  </span>
                )}
              </div>
              <div className="flex items-center">
                <span className="text-gray-500 mr-1 text-sm">
                  {activeTab === 'friday' && 'Fri:'}
                  {activeTab === 'saturday' && 'Sat:'}
                  {activeTab === 'sunday' && 'Total:'} $
                </span>
                <input
                  type="number"
                  step="0.1"
                  value={
                    activeTab === 'friday'
                      ? fridayEstimates[movie.id] || ''
                      : activeTab === 'saturday'
                      ? saturdayEstimates[movie.id] || ''
                      : sundayEstimates[movie.id] || ''
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (activeTab === 'friday') {
                      setFridayEstimates({ ...fridayEstimates, [movie.id]: value });
                    } else if (activeTab === 'saturday') {
                      setSaturdayEstimates({ ...saturdayEstimates, [movie.id]: value });
                    } else {
                      setSundayEstimates({ ...sundayEstimates, [movie.id]: value });
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="0.0"
                />
                <span className="text-gray-500 ml-1 text-sm">M</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Movie Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Salary
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Projected
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {activeTab === 'friday' && 'Fri Est ($M)'}
                {activeTab === 'saturday' && 'Sat Est ($M)'}
                {activeTab === 'sunday' && 'Weekend Total ($M)'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Current Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {movies.map((movie) => {
              const cumulative = getCumulativeScore(movie, currentEstimates);

              return (
                <tr key={movie.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {movie.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    ${movie.salary}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    ${movie.projected_gross}M
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">$</span>
                      <input
                        type="number"
                        step="0.1"
                        value={
                          activeTab === 'friday'
                            ? fridayEstimates[movie.id] || ''
                            : activeTab === 'saturday'
                            ? saturdayEstimates[movie.id] || ''
                            : sundayEstimates[movie.id] || ''
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          if (activeTab === 'friday') {
                            setFridayEstimates({ ...fridayEstimates, [movie.id]: value });
                          } else if (activeTab === 'saturday') {
                            setSaturdayEstimates({ ...saturdayEstimates, [movie.id]: value });
                          } else {
                            setSundayEstimates({ ...sundayEstimates, [movie.id]: value });
                          }
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="0.0"
                      />
                      <span className="text-gray-500 ml-1">M</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {cumulative !== null ? (
                      <span
                        className={`font-medium ${
                          cumulative > movie.projected_gross
                            ? 'text-green-600'
                            : cumulative < movie.projected_gross
                            ? 'text-red-600'
                            : 'text-gray-900'
                        }`}
                      >
                        ${cumulative.toFixed(2)}M
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {getMovieStatus(movie)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="text-xs sm:text-sm text-gray-600">
            {activeTab === 'sunday' ? (
              <span>Enter total weekend gross (Fri-Sun combined)</span>
            ) : (
              <span>Enter individual {activeTab} gross for each movie</span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Link
              href={`/admin/contests/${contest.id}/actuals`}
              className="px-4 py-2 text-gray-700 font-medium hover:text-gray-900 text-center text-sm"
            >
              Enter Final Actuals &rarr;
            </Link>
            <button
              type="button"
              onClick={() => handleSave(activeTab)}
              disabled={loading}
              className="px-4 sm:px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Saving...' : `Save ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
