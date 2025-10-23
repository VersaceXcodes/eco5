import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';

interface ImpactResponse {
  travelImpact: number;
  energyImpact: number;
}

const UV_ImpactCalculator: React.FC = () => {
  const user_id = useAppStore(state => state.authentication_state.current_user?.id);
  const auth_token = useAppStore(state => state.authentication_state.auth_token);
  const [travelHabits, setTravelHabits] = useState<string | null>(null);
  const [energyConsumption, setEnergyConsumption] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const calculateImpact = useMutation<ImpactResponse, Error, void, void>({
    mutationFn: async () => {
      if (!user_id || !auth_token) throw new Error('User must be authenticated');
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/impact-calculator`,
        { user_id, travel_habits: travelHabits, energy_consumption: energyConsumption },
        { headers: { Authorization: `Bearer ${auth_token}`, 'Content-Type': 'application/json' } }
      );
      return {
        travelImpact: response.data.travel_impact,
        energyImpact: response.data.energy_impact
      };
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
    },
    onSuccess: (data) => {
      alert(`Impact calculated!\nTravel Impact: ${data.travelImpact}\nEnergy Impact: ${data.energyImpact}`);
      setErrorMessage(null);
      setTravelHabits(null);
      setEnergyConsumption(null);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    calculateImpact.mutate();
  };

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <h2 className="text-center text-3xl font-extrabold text-gray-900">Impact Calculator</h2>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                <p className="text-sm">{errorMessage}</p>
              </div>
            )}
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="travelHabits" className="sr-only">Travel Habits</label>
                <input
                  id="travelHabits"
                  name="travelHabits"
                  type="text"
                  value={travelHabits ?? ''}
                  onChange={(e) => setTravelHabits(e.target.value)}
                  placeholder="Travel Habits"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="energyConsumption" className="sr-only">Energy Consumption</label>
                <input
                  id="energyConsumption"
                  name="energyConsumption"
                  type="text"
                  value={energyConsumption ?? ''}
                  onChange={(e) => setEnergyConsumption(e.target.value)}
                  placeholder="Energy Consumption"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={calculateImpact.isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {calculateImpact.isLoading ? 'Calculating...' : 'Calculate Impact'}
              </button>
            </div>
          </form>
          <div className="text-center mt-4">
            <Link to="/dashboard" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
              Go back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_ImpactCalculator;