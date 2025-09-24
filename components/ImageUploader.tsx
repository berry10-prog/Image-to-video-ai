import React, { useState, useCallback } from 'react';
import { UploadIcon, CloseIcon } from './icons';
import type { ImageFile } from '../types';

interface ImageUploaderProps {
  onImagesAdd: (images: ImageFile[]) => void;
  onImageRemove: (index: number) => void;
  imageFiles: ImageFile[];
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesAdd, onImageRemove, imageFiles }) => {
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: ImageFile[] = [];
    const promises: Promise<void>[] = [];

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const promise = new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            newImages.push({ file, base64: (reader.result as string).split(',')[1] });
            resolve();
          };
          reader.readAsDataURL(file);
        });
        promises.push(promise);
      }
    });

    Promise.all(promises).then(() => {
        if(newImages.length > 0) {
            onImagesAdd(newImages);
        }
    });
  }, [onImagesAdd]);

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    handleFileChange(event.dataTransfer.files);
  }, [handleFileChange]);

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(true);
  };

  const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
  };
  
  const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(event.target.files);
    // Reset file input to allow re-uploading the same file
    event.target.value = '';
  };

  return (
    <div className="flex flex-col space-y-4">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => document.getElementById('file-upload')?.click()}
        className={`relative flex flex-col items-center justify-center w-full py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200
          ${dragOver ? 'border-indigo-400 bg-slate-700/50' : 'border-slate-600 hover:border-indigo-500 hover:bg-slate-800/60'}`}
      >
        <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={onFileInputChange} multiple />
        <div className="text-center text-slate-400">
          <UploadIcon className="mx-auto w-10 h-10 text-slate-500" />
          <p className="mt-2 font-semibold">
            {imageFiles.length > 0 ? 'Add more images' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-sm">PNG, JPG, WEBP, etc.</p>
        </div>
      </div>

      {imageFiles.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-48 overflow-y-auto pr-2 rounded-lg">
          {imageFiles.map((image, index) => (
            <div key={`${image.file.name}-${index}`} className="relative group aspect-square">
              <img src={URL.createObjectURL(image.file)} alt={`Preview ${index + 1}`} className="object-cover h-full w-full rounded-md" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-md">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageRemove(index);
                  }}
                  className="bg-red-600/80 hover:bg-red-500/90 rounded-full p-1.5 transition-colors duration-200"
                  aria-label={`Remove image ${index + 1}`}
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
