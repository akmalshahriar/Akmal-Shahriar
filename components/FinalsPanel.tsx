import React, { useState } from 'react';
import { ZoomableImage } from './ZoomableImage';

interface FinalsPanelProps {
    finalPosters: string[];
}

export const FinalsPanel: React.FC<FinalsPanelProps> = ({ finalPosters }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        // Logic is handled by the parent component via onAddToFinals
    };

    return (
        <div 
            className={`bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 h-full flex flex-col border border-gray-700 shadow-lg transition-all duration-300 ${isDragOver ? 'border-cyan-500 scale-105 shadow-cyan-500/20' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <h2 className="text-lg font-semibold text-cyan-400 mb-4 text-center border-b border-gray-700 pb-2">Final Posters</h2>
            <div className="flex-grow overflow-y-auto pr-2 grid grid-cols-2 gap-3">
                {finalPosters.length === 0 ? (
                    <div className="col-span-2 flex items-center justify-center text-gray-500 text-center h-full">
                        <p>Drag your favorite posters here to save them. <br/><br/> Hover and scroll on saved posters to zoom.</p>
                    </div>
                ) : (
                    finalPosters.map((url, index) => (
                        <ZoomableImage
                            key={index}
                            src={`data:image/png;base64,${url}`}
                            alt={`Final Poster ${index + 1}`}
                            downloadUrl={`data:image/png;base64,${url}`}
                            downloadName={`final-poster-${index + 1}.png`}
                        />
                    ))
                )}
            </div>
        </div>
    );
};