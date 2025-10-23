import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Define the type for the forum thread
interface ForumThread {
  id: string;
  thread_title: string;
  content: string;
  created_at: string;
}

// Function to fetch forum threads
const fetchForumThreads = async (authToken: string) => {
  const response = await axios.get<ForumThread[]>(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/community-forum`,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return response.data;
};

const UV_CommunityForum: React.FC = () => {
  const authToken = useAppStore((state) => state.authentication_state.auth_token);
  const isAuthenticated = useAppStore((state) => state.authentication_state.authentication_status.is_authenticated);

  const { data: threads, error, isLoading } = useQuery(
    ['forumThreads'],
    () => fetchForumThreads(authToken || ''),
    {
      enabled: isAuthenticated,
      staleTime: 60000, // 1 minute
      retry: 1,
    }
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto py-12 lg:py-20">
          <h1 className="text-3xl font-bold leading-tight text-gray-900">Community Forum</h1>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mt-8">
              <p className="text-sm">Failed to load forum threads.</p>
            </div>
          ) : (!threads || threads.length === 0) ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No discussion threads available. Start the first topic!</p>
            </div>
          ) : (
            <div className="space-y-6 mt-8">
              {threads.map((thread) => (
                <div key={thread.id} className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
                  <h3 className="text-xl font-semibold">{thread.thread_title}</h3>
                  <p className="mt-4 text-gray-700">{thread.content}</p>
                  <p className="mt-4 text-sm text-gray-500">Created at: {new Date(thread.created_at).toLocaleString()}</p>
                  <Link to={`/community-forum/thread/${thread.id}`} className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200">
                    View Thread
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UV_CommunityForum;