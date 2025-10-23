import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';

interface Resource {
  id: string;
  type: string;
  title: string;
  description: string | null;
  url: string | null;
}

const fetchResources = async (authToken: string | null, searchQuery: string) => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/resource-library`,
    {
      params: { search: searchQuery },
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  return response.data.map((resource: any): Resource => ({
    id: resource.id,
    type: resource.content_type,
    title: resource.title,
    description: resource.description,
    url: resource.content_url,
  }));
};

const UV_ResourceLibrary: React.FC = () => {
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const { data: resources, isLoading, error } = useQuery(
    ['resourceLibrary', searchQuery],
    () => fetchResources(authToken, searchQuery),
    {
      enabled: !!authToken,
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  const handleSelectResource = (resource: Resource) => {
    setSelectedResource(resource);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setSelectedResource(null);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Resource Library</h1>
          
          <input
            type="text"
            placeholder="Search resources"
            value={searchQuery}
            onChange={handleSearchChange}
            className="mb-6 w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-100"
          />
          
          {isLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-red-600">Error fetching resources</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources?.map(resource => (
                <div key={resource.id} className="bg-white shadow-lg rounded-xl overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-2xl font-semibold text-gray-900">{resource.title}</h2>
                    <p className="text-gray-600 mt-2 mb-4">{resource.description}</p>
                    {resource.url && (
                      <div className="flex items-center space-x-4">
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                        >
                          Download
                        </a>
                        <button
                          onClick={() => handleSelectResource(resource)}
                          className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition"
                        >
                          View Details
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {selectedResource && (
            <div className="mt-8 p-6 bg-white shadow-lg rounded-xl">
              <h3 className="text-3xl font-bold text-gray-900">{selectedResource.title}</h3>
              <p className="text-gray-600 mt-4">{selectedResource.description}</p>
              {selectedResource.url && (
                <a
                  href={selectedResource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  Download Resource
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UV_ResourceLibrary;