
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-t-4 border-purple-600 animate-spin-slow"></div>
          <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-r-4 border-transparent animate-spin"></div>
        </div>
        <p className="text-purple-700 dark:text-purple-300 text-xl font-medium animate-pulse">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
