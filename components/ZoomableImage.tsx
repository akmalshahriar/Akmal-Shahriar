import React, { useState, useRef } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';

interface ZoomableImageProps {
    src: string;
    alt: string;
    downloadUrl: string;
    downloadName: string;
}

export const ZoomableImage: React.FC<ZoomableImageProps> = ({ src, alt, downloadUrl, downloadName }) => {
    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const startPanPoint = useRef({ x: 0, y: 0 });

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const { clientX, clientY, deltaY } = e;

        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;

        const zoomFactor = 1.1;
        const newScale = deltaY < 0 ? transform.scale * zoomFactor : transform.scale / zoomFactor;
        const clampedScale = Math.max(1, Math.min(newScale, 5));

        if (clampedScale === transform.scale) {
             if (clampedScale <= 1) setTransform({ scale: 1, x: 0, y: 0 });
             return;
        };

        const imageX = (mouseX - transform.x) / transform.scale;
        const imageY = (mouseY - transform.y) / transform.scale;

        const newX = mouseX - imageX * clampedScale;
        const newY = mouseY - imageY * clampedScale;
        
        if (clampedScale <= 1) {
            setTransform({ scale: 1, x: 0, y: 0 });
        } else {
            setTransform({
                scale: clampedScale,
                x: newX,
                y: newY,
            });
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (transform.scale > 1) {
            e.preventDefault();
            setIsPanning(true);
            startPanPoint.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
            if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            e.preventDefault();
            const newX = e.clientX - startPanPoint.current.x;
            const newY = e.clientY - startPanPoint.current.y;
            setTransform(prev => ({ ...prev, x: newX, y: newY }));
        }
    };

    const handleMouseUpOrLeave = () => {
        if (isPanning) {
            setIsPanning(false);
            if(containerRef.current) containerRef.current.style.cursor = 'grab';
        }
    };

    const handleDoubleClick = () => {
        setTransform({ scale: 1, x: 0, y: 0 });
    };

    return (
        <div
            ref={containerRef}
            className="relative group rounded-md overflow-hidden border-2 border-transparent hover:border-cyan-500 transition-colors w-full h-full bg-gray-900"
            style={{ touchAction: 'none', cursor: transform.scale > 1 ? 'grab' : 'default' }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onDoubleClick={handleDoubleClick}
        >
            <img
                src={src}
                alt={alt}
                className="w-full h-full object-cover"
                style={{
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                    transformOrigin: '0 0',
                    transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                }}
                draggable={false}
            />
            <div 
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                style={{ pointerEvents: 'none' }}
            >
                <a
                    href={downloadUrl}
                    download={downloadName}
                    className="bg-gray-900/70 p-2 rounded-full text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all duration-200"
                    title="Download Poster"
                    style={{ pointerEvents: 'auto' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <DownloadIcon className="h-6 w-6" />
                </a>
            </div>
        </div>
    );
};