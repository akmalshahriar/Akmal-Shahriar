import React, { useState, useCallback, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { Workspace } from './components/Workspace';
import { FinalsPanel } from './components/FinalsPanel';
import { generatePoster, editPoster, suggestConcept } from './services/geminiService';
import type { AspectRatio } from './types';
import { fileToBase64 } from './utils/fileUtils';

const App: React.FC = () => {
    const [productImages, setProductImages] = useState<Array<{ file: File, base64: string }>>([]);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
    const [concept, setConcept] = useState<string>('');
    const [posterHistory, setPosterHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSuggestingConcept, setIsSuggestingConcept] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [finalPosters, setFinalPosters] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [currentEditPrompt, setCurrentEditPrompt] = useState<string>("");

    const currentPoster = posterHistory[historyIndex] ?? null;
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < posterHistory.length - 1;

    const loadingMessages = [
        "Analyzing product essence...",
        "Conceptualizing visual harmony...",
        "Mixing digital color palettes...",
        "Engaging neural art generators...",
        "Architecting poster structure...",
        "Applying futuristic finish...",
        "Finalizing creative output..."
    ];

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isLoading) {
            let i = 0;
            setLoadingMessage(loadingMessages[0]);
            interval = setInterval(() => {
                i = (i + 1) % loadingMessages.length;
                setLoadingMessage(loadingMessages[i]);
            }, 2500);
        }
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading]);


    const handleGeneratePoster = useCallback(async () => {
        if (productImages.length === 0 || !concept) {
            setError("Please upload product images and describe your concept.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const initialPrompt = `Create a visually stunning, professional promotional poster featuring the product in the provided image(s).
- Concept: "${concept}".
- The poster's aspect ratio must be ${aspectRatio}.
- Completely replace the original background with a new, creative one that fits the concept. The product should be perfectly integrated.
- The final output should be a high-quality, eye-catching advertisement. Do not add any text unless specified in the concept.`;

            const imagePayload = productImages.map(p => ({ base64: p.base64, mimeType: p.file.type }));
            const result = await generatePoster(imagePayload, initialPrompt);
            const newHistory = [result];
            setPosterHistory(newHistory);
            setHistoryIndex(0);
            setCurrentEditPrompt("");
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [productImages, concept, aspectRatio]);

    const handleEditPoster = useCallback(async (editInstruction: string, maskBase64?: string) => {
        if (!currentPoster || !editInstruction) {
            setError("Cannot edit without a generated poster and an instruction.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setCurrentEditPrompt(editInstruction);
        try {
            const result = await editPoster(currentPoster, 'image/png', editInstruction, maskBase64);
            const newHistory = [...posterHistory.slice(0, historyIndex + 1), result];
            setPosterHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);

        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "An unknown error occurred during edit.");
        } finally {
            setIsLoading(false);
            setCurrentEditPrompt("");
        }
    }, [currentPoster, posterHistory, historyIndex]);

    const handleUndo = () => {
        if (canUndo) {
            setHistoryIndex(historyIndex - 1);
        }
    };

    const handleRedo = () => {
        if (canRedo) {
            setHistoryIndex(historyIndex + 1);
        }
    };

    const handleFileChange = async (files: FileList | null) => {
        if (files && files.length > 0) {
            setPosterHistory([]);
            setHistoryIndex(-1);
            setError(null);
            setConcept('');
            setIsSuggestingConcept(true);
            try {
                const fileArray = Array.from(files);
                const base64Promises = fileArray.map(file => fileToBase64(file));
                const base64Strings = await Promise.all(base64Promises);
                
                const newProductImages = fileArray.map((file, index) => ({
                    file,
                    base64: base64Strings[index],
                }));
                
                setProductImages(newProductImages);

                const imagePayload = newProductImages.map(p => ({ base64: p.base64, mimeType: p.file.type }));
                const suggestion = await suggestConcept(imagePayload);
                setConcept(suggestion);

            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to read image files or get concept suggestion.");
                setProductImages([]);
            } finally {
                setIsSuggestingConcept(false);
            }
        }
    };
    
    const addFinalPoster = (posterUrl: string) => {
        if (!finalPosters.includes(posterUrl)) {
            setFinalPosters(prev => [...prev, posterUrl]);
        }
    };
    
    return (
        <div className="bg-gray-900 text-white min-h-screen flex flex-col p-4 font-sans selection:bg-cyan-500 selection:text-black">
            <header className="text-center mb-4 border-b border-gray-700 pb-2">
                <h1 className="text-3xl font-bold tracking-wider text-cyan-400">AI POSTER ARCHITECT</h1>
                <p className="text-gray-400 text-sm">Design with the Future</p>
            </header>
             {error && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-6 py-2 rounded-lg shadow-lg z-50 animate-pulse" onClick={() => setError(null)}>
                    <p>{error}</p>
                </div>
            )}
            <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
                <div className="lg:col-span-3">
                    <ControlPanel
                        onProductImageChange={handleFileChange}
                        aspectRatio={aspectRatio}
                        onAspectRatioChange={setAspectRatio}
                        concept={concept}
                        onConceptChange={setConcept}
                        onGenerate={handleGeneratePoster}
                        isGenerating={isLoading || isSuggestingConcept}
                        productImagePreviews={productImages.map(p => p.base64)}
                        isSuggestingConcept={isSuggestingConcept}
                    />
                </div>
                <div className="lg:col-span-6">
                    <Workspace
                        posterUrl={currentPoster}
                        isLoading={isLoading}
                        loadingMessage={loadingMessage}
                        onEdit={handleEditPoster}
                        onAddToFinals={addFinalPoster}
                        currentEditPrompt={currentEditPrompt}
                        setCurrentEditPrompt={setCurrentEditPrompt}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                        canUndo={canUndo}
                        canRedo={canRedo}
                    />
                </div>
                <div className="lg:col-span-3">
                    <FinalsPanel finalPosters={finalPosters} />
                </div>
            </main>
        </div>
    );
};

export default App;