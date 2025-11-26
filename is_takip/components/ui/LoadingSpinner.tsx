import React from 'react';

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center h-full w-full p-8" aria-label="İçerik yükleniyor">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <span className="sr-only">Yükleniyor...</span>
  </div>
);

export default LoadingSpinner;
