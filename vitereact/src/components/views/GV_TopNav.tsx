import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const GV_TopNav: React.FC = () => {
  // Using individual selectors to avoid infinite loops
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const logoutUser = useAppStore(state => state.logout_user);

  return (
    <>
      <nav className="bg-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-xl font-bold text-blue-600">
                  Eco5
                </Link>
              </div>
              <div className="hidden md:flex md:space-x-8 ml-6">
                <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Home
                </Link>
                <Link to="/impact-calculator" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Impact Calculator
                </Link>
                <Link to="/community-forum" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Community Forum
                </Link>
                <Link to="/resource-library" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Resource Library
                </Link>
                <Link to="/about" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  About
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              {!isAuthenticated ? (
                <Link to="/auth?action=login" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Login / Signup
                </Link>
              ) : (
                <div className="relative inline-block">
                  <button
                    onClick={() => console.log('Toggle profile menu')}
                    className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
                    <span className="mr-2">{currentUser?.name}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06 0L10 10.9l3.71-3.69a.75.75 0 011.06 1.06L10.53 12l4.24 4.21a.75.75 0 11-1.06 1.06L10 13.06l-4.24 4.21a.75.75 0 11-1.06-1.06L9.5 12 5.23 7.21a.75.75 0 010-1.06z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <Link to="/account-settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Account Settings
                      </Link>
                      <button
                        onClick={logoutUser}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default GV_TopNav;