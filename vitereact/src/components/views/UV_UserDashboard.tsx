import React, { useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { userDashboardSchema, UserDashboard } from '@/zodSchemas';

const UV_UserDashboard: React.FC = () => {
  // Accessing the authentication state
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const userId = useAppStore(state => state.authentication_state.current_user?.id);

  // Query function for fetching user dashboard data
  const fetchUserDashboardData = useCallback(async (): Promise<UserDashboard> => {
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/dashboard/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    return userDashboardSchema.parse(response.data);
  }, [authToken, userId]);

  // Using React Query to fetch and cache the dashboard data
  const { data, error, isLoading, refetch } = useQuery(
    ['dashboardData', userId],
    fetchUserDashboardData,
    { 
      enabled: !!userId, 
      staleTime: 1000 * 60 * 5,  // 5 minutes
      retry: 1 
    }
  );

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-lg shadow-gray-200/50">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Your Dashboard</h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-12 lg:py-20 px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 border border-red-200 px-6 py-4 mb-8 rounded-lg">
              <p>Error loading dashboard data. Please try again.</p>
              <button onClick={() => refetch()} className="text-blue-700 hover:underline">
                Retry
              </button>
            </div>
          ) : (
            data && (
              <div className="space-y-6">
                <div className="bg-white shadow-lg rounded-xl p-6 lg:p-8">
                  <h2 className="text-2xl font-semibold text-gray-900">Your Carbon Footprint</h2>
                  <p className="text-gray-800">Current Footprint: {data.carbon_footprint} tons CO₂e</p>
                </div>

                <div className="bg-white shadow-lg rounded-xl p-6 lg:p-8">
                  <h2 className="text-2xl font-semibold text-gray-900">Historical Data</h2>
                  <p className="text-gray-800">{data.historical_data || 'No historical data available.'}</p>
                </div>

                <div className="bg-white shadow-lg rounded-xl p-6 lg:p-8">
                  <h2 className="text-2xl font-semibold text-gray-900">Daily Tips</h2>
                  <p className="text-gray-800">{data.daily_tips || 'No tips available for today.'}</p>
                </div>

                <div className="space-y-4">
                  <Link to="/impact-calculator" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-blue-700">
                    Explore Impact Calculator
                  </Link>
                  <Link to="/community-forum" className="inline-block bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-200 transition-all duration-200">
                    Join Community Discussions
                  </Link>
                </div>
              </div>
            )
          )}
        </main>
      </div>
    </>
  );
};

export default UV_UserDashboard;