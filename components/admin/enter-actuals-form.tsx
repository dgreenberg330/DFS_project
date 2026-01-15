// ============================================================================
// Enter Actuals Form - Admin Component
// ============================================================================

'use client';

import { useState } from 'react';
import { batchUpdateActuals } from '@/actions/scoring';
import { ContestWithMovies, Movie } from '@/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface EnterActualsFormProps {
  contest: ContestWithMovies;
  movies: Movie[];
}

export function EnterActualsForm({ contest, movies }: EnterActualsFormProps) {
  const router = useRouter();

  // Initialize actuals from existing data
  const [actuals, setActuals] = useState<Record<string, string>>(
    movies.reduce((acc, movie) => {
      acc[movie.id] = movie.actual_gross?.toString() || '';
      return acc;
    }, {} as Record<string, string>)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleActualChange(movieId: string, value: string) {
    setActuals({ ...actuals, [movieId]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Build updates array
      const updates = Object.entries(actuals)
        .filter(([_, value]) => value !== '')
        .map(([movieId, value]) => ({
          movieId,
          actualGross: parseFloat(value),
        }));

      if (updates.length === 0) {
        throw new Error('Please enter at least one actual gross value');
      }

      // Validate all values are non-negative
      const invalid = updates.filter(u => u.actualGross < 0);
      if (invalid.length > 0) {
        throw new Error('Actual gross values cannot be negative');
      }

      await batchUpdateActuals(updates);
      setSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update actuals');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {success && (
        <div className="mx-6 mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium mb-2">
            Actuals updated successfully!
          </p>
          <Link
            href={`/admin/contests/${contest.id}/score`}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Proceed to Scoring →
          </Link>
        </div>
      )}

      {error && (
        <div className="mx-6 mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Movie Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Projected Gross
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actual Gross (millions)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {movies.map((movie) => (
                <tr key={movie.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {movie.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    ${movie.salary}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    ${movie.projected_gross}M
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">$</span>
                      <input
                        type="number"
                        step="0.1"
                        value={actuals[movie.id] || ''}
                        onChange={(e) => handleActualChange(movie.id, e.target.value)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.0"
                      />
                      <span className="text-gray-500 ml-1">M</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Enter opening weekend gross (Friday-Sunday) in millions
            </p>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save All Actuals'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
