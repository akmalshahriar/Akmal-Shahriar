import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const suggestConcept = async (images: { base64: string, mimeType: string }[]): Promise<string> => {
    try {
        const imageParts = images.map(image => ({
            inlineData: {
                data: image.base64,
                mimeType: image.mimeType,
            },
        }));

        const prompt = "Analyze the product(s) in the provided image(s). Based on the product's appearance, potential use, and style, generate a creative and detailed concept for a promotional poster. The concept should be a concise suggestion of around 100-150 characters, describing a theme, color palette, and mood.";

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [...imageParts, { text: prompt }] },
        });

        return response.text;
    } catch (error) {
        console.error("Gemini concept suggestion failed:", error);
        throw new Error("Failed to generate concept with Gemini API.");
    }
};

const getImageFromResponse = async (parts: any[]): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }

        throw new Error("API did not return an image. It might have refused the prompt.");
    } catch (error) {
        console.error("Gemini API call failed:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate image with Gemini API: ${error.message}`);
        }
        throw new Error("Failed to generate image with Gemini API. Please check the console for details.");
    }
};

export const generatePoster = async (
    images: { base64: string, mimeType: string }[],
    prompt: string
): Promise<string> => {
    const imageParts = images.map(image => ({
        inlineData: {
            data: image.base64,
            mimeType: image.mimeType,
        },
    }));
    const parts = [...imageParts, { text: prompt }];
    return getImageFromResponse(parts);
};

export const editPoster = async (
    base64Image: string,
    mimeType: string,
    prompt: string,
    maskBase64?: string
): Promise<string> => {
    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: mimeType,
        },
    };
    
    const parts: any[] = [imagePart];
    let editPrompt: string;

    if (maskBase64) {
        const maskPart = {
            inlineData: {
                data: maskBase64,
                mimeType: 'image/png',
            },
        };
        parts.push(maskPart);
        editPrompt = `Using the provided image and mask, apply the following edit ONLY to the white area indicated by the mask: "${prompt}". The rest of the image should remain unchanged. Maintain the overall style and aspect ratio.`;
    } else {
        editPrompt = `Based on the provided image, apply the following edit: "${prompt}". Maintain the overall style and aspect ratio unless instructed otherwise.`;
    }
    
    parts.push({ text: editPrompt });
    return getImageFromResponse(parts);
};
