import React, { useState, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import Loader from './components/Loader';
import SettingsModal from './components/SettingsModal';
import { SettingsIcon } from './components/icons';
import { generateVideoFromImage } from './services/geminiService';
import type { ImageFile } from './types';

type GeneratedVideo = {
  fileName: string;
  originalImageSrc: string;
  videoUrl: string | null;
  error: string | null;
};

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const aspectRatios = ['16:9', '9:16', '1:1', '4:3', '3:4'];

  const handleImagesAdd = useCallback((newFiles: ImageFile[]) => {
    setImageFiles(prev => [...prev, ...newFiles]);
    setGeneratedVideos([]);
    setError(null);
  }, []);

  const handleImageRemove = useCallback((indexToRemove: number) => {
    setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setGeneratedVideos([]);
  }, []);

  const handleGenerate = async () => {
    if (!apiKey) {
      setError("API Key is missing. Please add it in the settings.");
      setIsSettingsOpen(true);
      return;
    }
    if (imageFiles.length === 0) {
      setError("Please upload at least one image.");
      return;
    }
    if (!prompt.trim()) {
      setError("Please enter a prompt to animate the image(s).");
      return;
    }

    setError(null);
    setGeneratedVideos([]);
    setIsLoading(true);
    setLoadingMessage('');

    const results: GeneratedVideo[] = [];
    
    for (let i = 0; i < imageFiles.length; i++) {
        const imageFile = imageFiles[i];

        try {
            const progressUpdater = (msg: string) => {
                setLoadingMessage(`(${i + 1}/${imageFiles.length}) ${msg}`);
            };

            const url = await generateVideoFromImage(
                apiKey,
                { base64: imageFile.base64, mimeType: imageFile.file.type },
                prompt,
                aspectRatio,
                progressUpdater
            );
            results.push({
                fileName: imageFile.file.name,
                originalImageSrc: URL.createObjectURL(imageFile.file),
                videoUrl: url,
                error: null,
            });
        } catch (err: any) {
            results.push({
                fileName: imageFile.file.name,
                originalImageSrc: URL.createObjectURL(imageFile.file),
                videoUrl: null,
                error: err.message || 'An unexpected error occurred.',
            });
        }
        // Update UI after each video is processed
        setGeneratedVideos([...results]);
    }

    setIsLoading(false);
    setLoadingMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <svg className="w-8 h-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.509 2.012A2.5 2.5 0 0 1 6.331 1.5h11.338a2.5 2.5 0 0 1 1.822.512l2.668 2.31a2.5 2.5 0 0 1 0 3.356l-2.668 2.31A2.5 2.5 0 0 1 17.669 10.5H6.331a2.5 2.5 0 0 1-1.822-.512l-2.668-2.31a2.5 2.5 0 0 1 0-3.356L4.51 2.012Zm0 11a2.5 2.5 0 0 1 1.822-.512h11.338a2.5 2.5 0 0 1 1.822.512l2.668 2.31a2.5 2.5 0 0 1 0 3.356l-2.668 2.31a2.5 2.5 0 0 1-1.822.512H6.331a2.5 2.5 0 0 1-1.822-.512l-2.668-2.31a2.5 2.5 0 0 1 0-3.356l2.668-2.31Z" />
            </svg>
            <h1 className="text-2xl font-bold text-white">ZOHAIB ANIMATION</h1>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full hover:bg-slate-700 transition-colors"
            aria-label="Settings"
          >
            <SettingsIcon className="w-6 h-6 text-slate-400" />
          </button>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls Column */}
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 flex flex-col space-y-6">
            <div>
              <label className="text-lg font-semibold text-white mb-2 block">1. Upload Image(s)</label>
              <ImageUploader onImagesAdd={handleImagesAdd} onImageRemove={handleImageRemove} imageFiles={imageFiles} />
            </div>

            <div>
              <label htmlFor="prompt" className="text-lg font-semibold text-white mb-2 block">2. Describe Animation</label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A cinematic shot of the car driving through a neon-lit city at night, rain on the ground reflecting the lights."
                rows={4}
                className="w-full bg-slate-900 border border-slate-600 rounded-md p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
              />
            </div>

            <div>
              <label className="text-lg font-semibold text-white mb-2 block">3. Aspect Ratio</label>
              <div className="flex flex-wrap gap-2">
                {aspectRatios.map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      aspectRatio === ratio
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading || imageFiles.length === 0}
              className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                <span>{`Animate ${imageFiles.length > 0 ? imageFiles.length : ''} Image(s)`}</span>
              )}
            </button>
          </div>

          {/* Output Column */}
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 flex flex-col justify-center items-center min-h-[450px]">
            {error && <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</div>}
            
            {isLoading && !error && <Loader message={loadingMessage} />}
            
            {!isLoading && generatedVideos.length === 0 && !error && (
              <div className="text-center text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-4 text-lg">Your generated videos will appear here</p>
              </div>
            )}
            
            {!isLoading && generatedVideos.length > 0 && (
              <div className="w-full h-full">
                  <h3 className="text-lg font-semibold mb-4 text-white">Generated Videos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                      {generatedVideos.map((result, index) => (
                          <div key={index} className="bg-slate-900/70 p-3 rounded-lg border border-slate-700">
                              {result.videoUrl ? (
                                  <>
                                      <video src={result.videoUrl} controls autoPlay loop className="w-full rounded-md aspect-video bg-black" />
                                      <a
                                          href={result.videoUrl}
                                          download={`animation-${result.fileName}.mp4`}
                                          className="mt-3 w-full block text-center py-2 px-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-500 transition-colors text-sm"
                                      >
                                          Download Video
                                      </a>
                                  </>
                              ) : (
                                  <div className="aspect-video w-full flex flex-col items-center justify-center bg-slate-800 rounded-md p-4">
                                     <img src={result.originalImageSrc} className="w-16 h-16 object-cover rounded-md mb-3 opacity-50" alt="Failed original" />
                                     <p className="text-red-400 text-sm text-center font-semibold">Animation Failed</p>
                                     <p className="text-slate-400 text-xs text-center mt-1">{result.error}</p>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
            )}
          </div>
        </main>
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(key) => {
          setApiKey(key);
          setError(null);
        }}
        currentApiKey={apiKey}
      />
    </div>
  );
};

export default App;