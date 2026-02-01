// ============================================================================
// User Search Component - Search for users to add as friends
// ============================================================================

'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { searchUsers, sendFriendRequest, cancelFriendRequest, acceptFriendRequest } from '@/actions/friends';
import type { UserSearchResult } from '@/types';

export function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search on query change
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        const searchResults = await searchUsers(query);
        setResults(searchResults);
        setIsOpen(true);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSendRequest = async (userId: string) => {
    startTransition(async () => {
      const result = await sendFriendRequest(userId);
      if (result.success) {
        setMessage({ type: 'success', text: 'Friend request sent' });
        // Refresh search results
        const searchResults = await searchUsers(query);
        setResults(searchResults);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send request' });
      }
      setTimeout(() => setMessage(null), 3000);
    });
  };

  const handleCancelRequest = async (requestId: string) => {
    startTransition(async () => {
      const result = await cancelFriendRequest(requestId);
      if (result.success) {
        setMessage({ type: 'success', text: 'Request cancelled' });
        const searchResults = await searchUsers(query);
        setResults(searchResults);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to cancel request' });
      }
      setTimeout(() => setMessage(null), 3000);
    });
  };

  const handleAcceptRequest = async (requestId: string) => {
    startTransition(async () => {
      const result = await acceptFriendRequest(requestId);
      if (result.success) {
        setMessage({ type: 'success', text: 'Friend added' });
        const searchResults = await searchUsers(query);
        setResults(searchResults);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to accept request' });
      }
      setTimeout(() => setMessage(null), 3000);
    });
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Search by username..."
          className="w-full px-3 py-2 bg-dark-elevated border border-dark-border rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
        />
        {isPending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-dark-elevated border border-dark-border rounded-lg shadow-lg overflow-hidden">
          {results.map((user) => (
            <div
              key={user.user_id}
              className="flex items-center justify-between px-3 py-2 hover:bg-dark-surface"
            >
              <span className="text-gray-100 text-sm">@{user.username}</span>
              {user.friend_status === 'friends' && (
                <span className="text-xs text-gray-400">Already friends</span>
              )}
              {user.friend_status === 'pending_sent' && (
                <button
                  onClick={() => user.request_id && handleCancelRequest(user.request_id)}
                  disabled={isPending}
                  className="text-xs text-gray-400 hover:text-red-400 disabled:opacity-50"
                >
                  Cancel request
                </button>
              )}
              {user.friend_status === 'pending_received' && (
                <button
                  onClick={() => user.request_id && handleAcceptRequest(user.request_id)}
                  disabled={isPending}
                  className="text-xs text-accent hover:text-accent-light disabled:opacity-50"
                >
                  Accept request
                </button>
              )}
              {user.friend_status === 'none' && (
                <button
                  onClick={() => handleSendRequest(user.user_id)}
                  disabled={isPending}
                  className="text-xs text-accent hover:text-accent-light disabled:opacity-50"
                >
                  Add friend
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && query.length >= 2 && results.length === 0 && !isPending && (
        <div className="absolute z-10 w-full mt-1 bg-dark-elevated border border-dark-border rounded-lg shadow-lg p-3">
          <p className="text-sm text-gray-400">No users found</p>
        </div>
      )}

      {/* Status message */}
      {message && (
        <div
          className={`mt-2 text-sm py-2 px-3 rounded ${
            message.type === 'success'
              ? 'bg-green-900/30 text-green-400'
              : 'bg-red-900/30 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
