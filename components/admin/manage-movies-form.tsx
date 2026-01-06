// ============================================================================
// Manage Movies Form - Admin Component
// ============================================================================

'use client';

import { useState } from 'react';
import { createMovie, batchCreateMovies } from '@/actions/movies';
import { updateMovie, deleteMovie, copyMovieToContest } from '@/actions/admin-movies';
import { ContestWithMovies, Movie } from '@/types';
import { useRouter } from 'next/navigation';

interface ManageMoviesFormProps {
  contest: ContestWithMovies;
  movies: Movie[];
  historicalMovies: Movie[];
}

export function ManageMoviesForm({ contest, movies: initialMovies, historicalMovies }: ManageMoviesFormProps) {
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

  // Historical movies state
  const [showHistorical, setShowHistorical] = useState(false);
  const [historicalSearch, setHistoricalSearch] = useState('');
  const [historicalLoading, setHistoricalLoading] = useState<string | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // CSV batch upload state
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSuccess, setCsvSuccess] = useState(false);

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

  async function handleCopyHistoricalMovie(movie: Movie) {
    setHistoricalLoading(movie.id);
    setError(null);

    try {
      const copied = await copyMovieToContest(movie.id, contest.id);
      setMovies([copied, ...movies].sort((a, b) => b.salary - a.salary));
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to copy movie');
    } finally {
      setHistoricalLoading(null);
    }
  }

  async function handleCsvUpload(e: React.FormEvent) {
    e.preventDefault();
    setCsvLoading(true);
    setCsvError(null);
    setCsvSuccess(false);

    try {
      // Parse CSV (expecting: title,release_date,distributor,theater_count,salary,projected_gross)
      const lines = csvText.trim().split('\n');
      if (lines.length === 0) {
        throw new Error('CSV is empty');
      }

      // Skip header if present
      const hasHeader = lines[0].toLowerCase().includes('title');
      const dataLines = hasHeader ? lines.slice(1) : lines;

      const movieInputs = dataLines.map((line, index) => {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length < 6) {
          throw new Error(`Line ${index + 1}: Expected 6 columns (title,release_date,distributor,theater_count,salary,projected_gross)`);
        }

        const [title, release_date, distributor, theater_count, salary, projected_gross] = parts;

        const salaryNum = parseInt(salary);
        const projectedNum = parseFloat(projected_gross);
        const theaterNum = theater_count ? parseInt(theater_count) : undefined;

        if (salaryNum < 5 || salaryNum > 100) {
          throw new Error(`Line ${index + 1}: Salary must be between $5 and $100`);
        }

        return {
          contest_id: contest.id,
          title,
          release_date,
          distributor: distributor || undefined,
          theater_count: theaterNum,
          salary: salaryNum,
          projected_gross: projectedNum,
        };
      });

      const newMovies = await batchCreateMovies(movieInputs);
      setMovies([...newMovies, ...movies].sort((a, b) => b.salary - a.salary));
      setCsvSuccess(true);
      setCsvText('');

      setTimeout(() => {
        setCsvSuccess(false);
        setShowCsvUpload(false);
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setCsvError(err.message || 'Failed to upload CSV');
    } finally {
      setCsvLoading(false);
    }
  }

  // Filter historical movies by search
  const filteredHistorical = historicalMovies.filter(movie =>
    movie.title.toLowerCase().includes(historicalSearch.toLowerCase())
  );

  // Group historical movies by release date
  const groupedHistorical = filteredHistorical.reduce((groups, movie) => {
    const date = movie.release_date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(movie);
    return groups;
  }, {} as Record<string, Movie[]>);

  // Sort dates descending (most recent first)
  const sortedDates = Object.keys(groupedHistorical).sort((a, b) => b.localeCompare(a));

  function toggleDateGroup(date: string) {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
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

      {/* Historical Movies Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Select from Historical Movies</h2>
          <button
            onClick={() => setShowHistorical(!showHistorical)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showHistorical ? 'Hide' : 'Show'} ({historicalMovies.length})
          </button>
        </div>

        {showHistorical && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search movies..."
              value={historicalSearch}
              onChange={(e) => setHistoricalSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            {filteredHistorical.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                {historicalSearch ? 'No movies found' : 'No historical movies available'}
              </p>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-4">
                {sortedDates.map((date) => {
                  const isExpanded = expandedDates.has(date);
                  return (
                    <div key={date}>
                      <button
                        onClick={() => toggleDateGroup(date)}
                        className="w-full sticky top-0 bg-gray-100 px-3 py-2 font-semibold text-sm text-gray-700 border-b border-gray-300 hover:bg-gray-200 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <span className={`inline-block mr-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                            ▶
                          </span>
                          {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                          <span className="text-gray-500 ml-2">({groupedHistorical[date].length})</span>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="space-y-2 mt-2">
                          {groupedHistorical[date].map((movie) => (
                            <div
                              key={movie.id}
                              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{movie.title}</div>
                                <div className="text-xs text-gray-500">
                                  {movie.distributor || 'No distributor'} • ${movie.salary} • Proj: {movie.projected_gross}M
                                </div>
                              </div>
                              <button
                                onClick={() => handleCopyHistoricalMovie(movie)}
                                disabled={historicalLoading === movie.id}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                              >
                                {historicalLoading === movie.id ? 'Adding...' : 'Add to Contest'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CSV Batch Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Batch Upload (CSV)</h2>
          <button
            onClick={() => setShowCsvUpload(!showCsvUpload)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showCsvUpload ? 'Hide' : 'Show'}
          </button>
        </div>

        {showCsvUpload && (
          <div>
            {csvSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">Movies uploaded successfully!</p>
              </div>
            )}

            {csvError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{csvError}</p>
              </div>
            )}

            <form onSubmit={handleCsvUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV Data
                </label>
                <div className="mb-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <div className="font-medium mb-1">Format (comma-separated):</div>
                  <code>title,release_date,distributor,theater_count,salary,projected_gross</code>
                  <div className="mt-2 font-medium">Example:</div>
                  <code>Wicked,2024-11-22,Universal,3888,48,120.5</code>
                </div>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={10}
                  placeholder="Paste CSV data here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={csvLoading}
                className="w-full py-2 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {csvLoading ? 'Uploading...' : 'Upload Movies'}
              </button>
            </form>
          </div>
        )}
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
