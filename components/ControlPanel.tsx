import React, { useRef } from 'react';
import type { AspectRatio } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { MagicWandIcon } from './icons/MagicWandIcon';

interface ControlPanelProps {
    onProductImageChange: (files: FileList | null) => void;
    aspectRatio: AspectRatio;
    onAspectRatioChange: (ratio: AspectRatio) => void;
    concept: string;
    onConceptChange: (concept: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    productImagePreviews: string[];
    isSuggestingConcept: boolean;
}

const aspectRatios: AspectRatio[] = ['9:16', '1:1', '16:9', '3:4', '4:3'];

export const ControlPanel: React.FC<ControlPanelProps> = ({
    onProductImageChange,
    aspectRatio,
    onAspectRatioChange,
    concept,
    onConceptChange,
    onGenerate,
    isGenerating,
    productImagePreviews,
    isSuggestingConcept
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 h-full flex flex-col gap-6 border border-gray-700 shadow-lg">
            
            <div className="flex flex-col gap-2">
                <label className="text-lg font-semibold text-cyan-400">1. Product Images</label>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => onProductImageChange(e.target.files)}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    multiple
                />
                <div 
                    onClick={handleFileClick} 
                    className="cursor-pointer border-2 border-dashed border-gray-600 rounded-lg h-40 flex items-center justify-center text-gray-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors duration-300 overflow-hidden"
                >
                    {productImagePreviews.length > 0 ? (
                        <div className="flex space-x-2 p-2 h-full w-full overflow-x-auto">
                            {productImagePreviews.map((src, index) => (
                                <img key={index} src={`data:image/png;base64,${src}`} alt={`Product Preview ${index + 1}`} className="h-full w-auto object-contain rounded-md" />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center">
                            <UploadIcon className="mx-auto h-8 w-8 mb-2" />
                            <p>Click to upload</p>
                            <p className="text-xs">PNG, JPG, WEBP (multi-select)</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-lg font-semibold text-cyan-400">2. Aspect Ratio</label>
                <div className="grid grid-cols-5 gap-2">
                    {aspectRatios.map(ratio => (
                        <button
                            key={ratio}
                            onClick={() => onAspectRatioChange(ratio)}
                            className={`p-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                aspectRatio === ratio
                                    ? 'bg-cyan-500 text-black shadow-md scale-105'
                                    : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                        >
                            {ratio}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-2 flex-grow relative">
                <label htmlFor="concept" className="text-lg font-semibold text-cyan-400">3. Poster Concept</label>
                <textarea
                    id="concept"
                    value={concept}
                    onChange={(e) => onConceptChange(e.target.value)}
                    placeholder={isSuggestingConcept ? "AI is generating a concept..." : "e.g., 'A minimalist poster with a futuristic vibe...' or let the AI suggest one after uploading."}
                    className="w-full flex-grow bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow resize-none disabled:opacity-70"
                    disabled={isSuggestingConcept}
                />
                 {isSuggestingConcept && (
                    <div className="absolute bottom-3 right-3 h-4 w-4 border-2 border-t-cyan-400 border-gray-600 rounded-full animate-spin"></div>
                )}
            </div>

            <button
                onClick={onGenerate}
                disabled={isGenerating || productImagePreviews.length === 0 || !concept}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shadow-lg disabled:shadow-none"
            >
                <MagicWandIcon className="h-5 w-5" />
                {isGenerating ? 'Generating...' : 'Generate Poster'}
            </button>
        </div>
    );
};
