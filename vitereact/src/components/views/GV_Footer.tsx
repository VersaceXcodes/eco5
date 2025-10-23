import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const GV_Footer: React.FC = () => {
  // Use Zustand to get authentication status
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);

  return (
    <>
      <footer className="bg-white shadow-lg border-t border-gray-100 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Contact Us</h2>
              <p className="mt-2 text-gray-600">Have questions? Reach out to us!</p>
              <p className="mt-2 text-gray-600">Email: support@example.com</p>
              <p className="mt-2 text-gray-600">Phone: +1-234-567-890</p>
            </div>

            {/* Social Media Links */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Follow Us</h2>
              <div className="flex space-x-4 mt-2">
                <a href="https://facebook.com" aria-label="Facebook" className="text-gray-600 hover:text-blue-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    {/* Insert SVG path for icon */}
                  </svg>
                </a>
                <a href="https://twitter.com" aria-label="Twitter" className="text-gray-600 hover:text-blue-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    {/* Insert SVG path for icon */}
                  </svg>
                </a>
                <a href="https://instagram.com" aria-label="Instagram" className="text-gray-600 hover:text-pink-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    {/* Insert SVG path for icon */}
                  </svg>
                </a>
              </div>
            </div>

            {/* Legal and Extra Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Information</h2>
              <ul className="mt-2 space-y-2">
                <li>
                  <Link to="/support" className="text-gray-600 hover:text-gray-900">
                    Support & FAQs
                  </Link>
                </li>
                <li>
                  <Link to="/legal/privacy-policy" className="text-gray-600 hover:text-gray-900">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/legal/terms-of-service" className="text-gray-600 hover:text-gray-900">
                    Terms of Service
                  </Link>
                </li>
                {isAuthenticated && (
                  <li>
                    <Link to="/account-settings" className="text-gray-600 hover:text-gray-900">
                      Account Settings
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-gray-200 mt-8 pt-8">
            <p className="text-sm text-center text-gray-500">© 2023 Eco5. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default GV_Footer;