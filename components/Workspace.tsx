import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from './icons/RedoIcon';
import { ClearSelectionIcon } from './icons/ClearSelectionIcon';

interface WorkspaceProps {
    posterUrl: string | null;
    isLoading: boolean;
    loadingMessage: string;
    onEdit: (instruction: string, maskBase64?: string) => void;
    onAddToFinals: (posterUrl: string) => void;
    currentEditPrompt: string;
    setCurrentEditPrompt: (prompt: string) => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

interface Rect { x: number; y: number; width: number; height: number; }

export const Workspace: React.FC<WorkspaceProps> = ({
    posterUrl,
    isLoading,
    loadingMessage,
    onEdit,
    onAddToFinals,
    currentEditPrompt,
    setCurrentEditPrompt,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
}) => {
    const [selection, setSelection] = useState<Rect | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const startPoint = useRef<{ x: number; y: number } | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLImageElement>) => {
        if (posterUrl) {
            e.dataTransfer.setData("text/plain", posterUrl);
        }
    };
    
    const generateMask = (): string | undefined => {
        if (!selection || !imageRef.current || !posterUrl) return undefined;

        const originalImage = new Image();
        originalImage.src = `data:image/png;base64,${posterUrl}`;
        const { naturalWidth: originalWidth, naturalHeight: originalHeight } = originalImage;
        const { clientWidth: displayedWidth, clientHeight: displayedHeight } = imageRef.current;

        if (originalWidth === 0 || displayedWidth === 0) return undefined;

        const scaleX = originalWidth / displayedWidth;
        const scaleY = originalHeight / displayedHeight;

        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = originalWidth;
        maskCanvas.height = originalHeight;
        const ctx = maskCanvas.getContext('2d');
        if (!ctx) return undefined;

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, originalWidth, originalHeight);
        ctx.fillStyle = 'white';
        ctx.fillRect(selection.x * scaleX, selection.y * scaleY, selection.width * scaleX, selection.height * scaleY);

        return maskCanvas.toDataURL('image/png').split(',')[1];
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(currentEditPrompt.trim()) {
            const mask = generateMask();
            onEdit(currentEditPrompt, mask);
            setSelection(null);
        }
    };

    const syncCanvasSize = useCallback(() => {
        const image = imageRef.current;
        const canvas = canvasRef.current;
        if (image && canvas && image.clientWidth > 0) {
            const { clientWidth, clientHeight } = image;
            canvas.width = clientWidth;
            canvas.height = clientHeight;
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (selection) {
            ctx.setLineDash([6, 4]);
            ctx.strokeStyle = 'rgba(0, 255, 255, 1)';
            ctx.lineWidth = 2;
            ctx.strokeRect(selection.x, selection.y, selection.width, selection.height);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
            ctx.fillRect(selection.x, selection.y, selection.width, selection.height);
        }
    }, [selection]);

    useEffect(() => {
        const image = imageRef.current;
        if (!image) return;

        const observer = new ResizeObserver(syncCanvasSize);
        observer.observe(image);
        return () => observer.disconnect();
    }, [syncCanvasSize]);


    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if(isLoading) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        setIsDrawing(true);
        startPoint.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        setSelection(null);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !startPoint.current) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        const x = Math.min(startPoint.current.x, currentX);
        const y = Math.min(startPoint.current.y, currentY);
        const width = Math.abs(startPoint.current.x - currentX);
        const height = Math.abs(startPoint.current.y - currentY);
        setSelection({ x, y, width, height });
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
        startPoint.current = null;
    };


    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg h-full flex flex-col border border-gray-700 shadow-lg">
            <div className="flex-grow flex items-center justify-center p-4 relative overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-20">
                        <div className="w-16 h-16 border-4 border-t-cyan-400 border-gray-600 rounded-full animate-spin"></div>
                        <p className="mt-4 text-lg font-semibold tracking-wider">{loadingMessage}</p>
                    </div>
                )}
                {!posterUrl && !isLoading && (
                    <div className="text-center text-gray-500">
                        <p className="text-2xl">Your poster will appear here.</p>
                        <p>Fill in the details on the left to begin.</p>
                    </div>
                )}
                {posterUrl && (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img
                            ref={imageRef}
                            src={`data:image/png;base64,${posterUrl}`}
                            alt="Generated Poster"
                            className={`max-h-full max-w-full object-contain transition-opacity duration-500 ${isLoading ? 'opacity-30' : 'opacity-100'}`}
                            draggable
                            onDragStart={handleDragStart}
                            onLoad={syncCanvasSize}
                        />
                         <canvas 
                            ref={canvasRef}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-crosshair"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                         />
                         <div className="absolute top-2 right-2 flex flex-col gap-2">
                            <a
                                href={`data:image/png;base64,${posterUrl}`}
                                download="ai-poster.png"
                                className="bg-gray-900/70 p-2 rounded-full text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all duration-200"
                                title="Download Poster"
                            >
                                <DownloadIcon className="h-6 w-6" />
                            </a>
                             <button onClick={onUndo} disabled={!canUndo || isLoading} className="bg-gray-900/70 p-2 rounded-full text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" title="Undo">
                                <UndoIcon className="h-6 w-6" />
                            </button>
                            <button onClick={onRedo} disabled={!canRedo || isLoading} className="bg-gray-900/70 p-2 rounded-full text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" title="Redo">
                                <RedoIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {posterUrl && (
                <div className="p-4 border-t border-gray-700">
                    <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                        {selection && (
                           <button type="button" onClick={() => setSelection(null)} className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors" title="Clear Selection">
                               <ClearSelectionIcon className="h-6 w-6 text-cyan-400"/>
                           </button>
                        )}
                        <input
                            type="text"
                            value={currentEditPrompt}
                            onChange={(e) => setCurrentEditPrompt(e.target.value)}
                            placeholder={selection ? "Describe change for selected area..." : "Describe change for whole image..."}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow"
                            disabled={isLoading}
                        />
                        <button 
                            type="submit" 
                            disabled={isLoading || !currentEditPrompt}
                            className="bg-cyan-600 p-3 rounded-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                        >
                            <ArrowRightIcon className="h-6 w-6 text-white"/>
                        </button>
                    </form>
                     <p className="text-xs text-gray-500 mt-2 text-center">Draw on the image to edit a specific area. Drag to the right panel to save.</p>
                </div>
            )}
        </div>
    );
};
