// ============================================================================
// Manage Movies Form - Admin Component
// ============================================================================

'use client';

import { useState } from 'react';
import { createMovie } from '@/actions/movies';
import { updateMovie, deleteMovie } from '@/actions/admin-movies';
import { ContestWithMovies, Movie } from '@/types';
import { useRouter } from 'next/navigation';

interface ManageMoviesFormProps {
  contest: ContestWithMovies;
  movies: Movie[];
}

export function ManageMoviesForm({ contest, movies: initialMovies }: ManageMoviesFormProps) {
  const router = useRouter();
  const [movies, setMovies] = useState(initialMovies);

  // Add movie form state
  const [title, setTitle] = useState('');
  const [releaseDate, setReleaseDate] = useState(contest.weekend_start);
  const [distributor, setDistributor] = useState('');
  const [theaterCount, setTheaterCount] = useState('');
  const [salary, setSalary] = useState('');
  const [projectedGross, setProjectedGross] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);

  // Edit/delete state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Movie>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAddMovie(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    setAddSuccess(false);

    try {
      const salaryNum = parseInt(salary);
      const projectedNum = parseFloat(projectedGross);

      if (salaryNum < 5 || salaryNum > 100) {
        throw new Error('Salary must be between $5 and $100');
      }

      const movie = await createMovie({
        contest_id: contest.id,
        title,
        release_date: releaseDate,
        distributor: distributor || undefined,
        theater_count: theaterCount ? parseInt(theaterCount) : undefined,
        salary: salaryNum,
        projected_gross: projectedNum,
      });

      setMovies([movie, ...movies].sort((a, b) => b.salary - a.salary));
      setAddSuccess(true);

      // Reset form
      setTitle('');
      setDistributor('');
      setTheaterCount('');
      setSalary('');
      setProjectedGross('');

      setTimeout(() => {
        setAddSuccess(false);
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setAddError(err.message || 'Failed to add movie');
    } finally {
      setAddLoading(false);
    }
  }

  function startEdit(movie: Movie) {
    setEditingId(movie.id);
    setEditData(movie);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditData({});
    setError(null);
  }

  async function saveEdit(movieId: string) {
    setEditLoading(true);
    setError(null);

    try {
      if (editData.salary && (editData.salary < 5 || editData.salary > 100)) {
        throw new Error('Salary must be between $5 and $100');
      }

      const updated = await updateMovie(movieId, editData);
      setMovies(movies.map(m => m.id === movieId ? updated : m).sort((a, b) => b.salary - a.salary));
      setEditingId(null);
      setEditData({});
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update movie');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete(movie: Movie) {
    if (!confirm(`Delete "${movie.title}"? This cannot be undone.`)) {
      return;
    }

    setDeleteLoading(movie.id);
    setError(null);

    try {
      await deleteMovie(movie.id);
      setMovies(movies.filter(m => m.id !== movie.id));
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete movie');
    } finally {
      setDeleteLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Add Movie Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Add Movie</h2>

        {addSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm">Movie added successfully!</p>
          </div>
        )}

        {addError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{addError}</p>
          </div>
        )}

        <form onSubmit={handleAddMovie} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Release Date *
            </label>
            <input
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Distributor
            </label>
            <input
              type="text"
              value={distributor}
              onChange={(e) => setDistributor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Theater Count
            </label>
            <input
              type="number"
              value={theaterCount}
              onChange={(e) => setTheaterCount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salary ($5-$100) *
            </label>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="5"
              max="100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Projected Gross (millions) *
            </label>
            <input
              type="number"
              step="0.1"
              value={projectedGross}
              onChange={(e) => setProjectedGross(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="col-span-2">
            <button
              type="submit"
              disabled={addLoading}
              className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {addLoading ? 'Adding...' : 'Add Movie'}
            </button>
          </div>
        </form>
      </div>

      {/* Movie List Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            Movies ({movies.length})
          </h2>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {movies.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No movies yet. Add your first movie above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distributor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Theaters</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projected</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {movies.map((movie) => {
                  const isEditing = editingId === movie.id;

                  return (
                    <tr key={movie.id} className={isEditing ? 'bg-blue-50' : ''}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.title ?? movie.title}
                            onChange={(e) => setEditData({...editData, title: e.target.value})}
                            className="px-2 py-1 border rounded w-full"
                          />
                        ) : movie.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editData.release_date ?? movie.release_date}
                            onChange={(e) => setEditData({...editData, release_date: e.target.value})}
                            className="px-2 py-1 border rounded"
                          />
                        ) : movie.release_date}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.distributor ?? movie.distributor ?? ''}
                            onChange={(e) => setEditData({...editData, distributor: e.target.value || null})}
                            className="px-2 py-1 border rounded w-full"
                            placeholder="Distributor"
                          />
                        ) : (movie.distributor || '-')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editData.theater_count ?? movie.theater_count ?? ''}
                            onChange={(e) => setEditData({...editData, theater_count: e.target.value ? parseInt(e.target.value) : null})}
                            className="px-2 py-1 border rounded w-24"
                            placeholder="Theaters"
                            min="0"
                          />
                        ) : (movie.theater_count?.toLocaleString() || '-')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editData.salary ?? movie.salary}
                            onChange={(e) => setEditData({...editData, salary: parseInt(e.target.value)})}
                            className="px-2 py-1 border rounded w-20"
                            min="5"
                            max="100"
                          />
                        ) : `$${movie.salary}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.1"
                            value={editData.projected_gross ?? movie.projected_gross}
                            onChange={(e) => setEditData({...editData, projected_gross: parseFloat(e.target.value)})}
                            className="px-2 py-1 border rounded w-24"
                          />
                        ) : `$${movie.projected_gross}M`}
                      </td>
                      <td className="px-6 py-4 text-sm text-right space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(movie.id)}
                              disabled={editLoading}
                              className="text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={editLoading}
                              className="text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(movie)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(movie)}
                              disabled={deleteLoading === movie.id}
                              className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                            >
                              {deleteLoading === movie.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
