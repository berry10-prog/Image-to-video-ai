
import React from 'react';

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-800/50 rounded-lg p-8">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
        <p className="mt-6 text-lg font-medium text-slate-300 text-center">{message}</p>
        <p className="mt-2 text-sm text-slate-400 text-center">This may take a few minutes. Please don't close this window.</p>
    </div>
  );
};

export default Loader;
