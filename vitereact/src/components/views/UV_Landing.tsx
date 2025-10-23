import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const UV_Landing: React.FC = () => {
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  
  if (isAuthenticated) {
    window.location.replace('/dashboard');
    return null;
  }

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="text-center py-10 bg-white shadow-sm">
          <h1 className="text-4xl font-bold text-gray-900">Welcome to Eco5</h1>
          <p className="text-xl text-gray-600 mt-2">Join us in making a sustainable difference.</p>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-12 lg:py-20 flex-grow">
          <section className="max-w-4xl mx-auto space-y-12">
            <div className="bg-white shadow-lg p-6 lg:p-8 rounded-xl border border-gray-100">
              <h2 className="text-2xl font-semibold text-gray-900">Why Choose Eco5?</h2>
              <p className="mt-4 text-base text-gray-600 leading-relaxed">
                Eco5 offers personalized tools to track your carbon footprint, engage in community challenges, and access a wealth of resources to support your sustainable journey.
              </p>
            </div>

            <div className="bg-white shadow-lg p-6 lg:p-8 rounded-xl border border-gray-100">
              <h2 className="text-2xl font-semibold text-gray-900">Key Features</h2>
              <ul className="mt-4 text-base text-gray-600 space-y-2 list-disc list-inside">
                <li>Customizable Dashboards</li>
                <li>Impact Calculators</li>
                <li>Community Engagement</li>
                <li>Resource Library and Tips</li>
              </ul>
            </div>

            <div className="flex justify-center space-x-6">
              <Link to="/auth?action=signup" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg transition-all duration-200">
                Get Started
              </Link>
              <Link to="/about" className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium border border-gray-300 transition-all duration-200">
                Learn More
              </Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

export default UV_Landing;