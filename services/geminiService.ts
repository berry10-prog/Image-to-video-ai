import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

const loadingMessages = [
    "Warming up the animation engine...",
    "Sketching the first frame...",
    "Consulting the motion muses...",
    "Adding a touch of magic...",
    "Stitching pixels into motion...",
    "Rendering the final scene...",
    "Almost there, polishing the details...",
];

export async function generateVideoFromImage(
    apiKey: string,
    image: { base64: string; mimeType: string },
    prompt: string,
    aspectRatio: string,
    onProgress: (message: string) => void
): Promise<string> {
    if (!apiKey) {
        throw new Error("API Key is missing. Please add it in the settings.");
    }
    
    let messageIndex = 0;
    const progressInterval = setInterval(() => {
        onProgress(loadingMessages[messageIndex % loadingMessages.length]);
        messageIndex++;
    }, 4000);

    try {
        onProgress(loadingMessages[0]);
        const ai = new GoogleGenAI({ apiKey });

        const safetySettings = [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
        ];

        let operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: prompt,
            image: {
                imageBytes: image.base64,
                mimeType: image.mimeType,
            },
            config: {
                numberOfVideos: 1,
                aspectRatio: aspectRatio,
            },
            safetySettings: safetySettings,
        });

        onProgress("Video generation started. This can take several minutes.");

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        clearInterval(progressInterval);
        onProgress("Finalizing video...");

        if (operation.error) {
            // Log the full error object for debugging
            console.error("Gemini API Operation Error:", JSON.stringify(operation.error, null, 2));

            let userMessage = `Video generation failed: ${operation.error.message}`;
            
            // Check for specific safety filter messages to provide better user feedback
            if (operation.error.message && operation.error.message.includes('person/face generation')) {
                userMessage = "Animation failed: The AI has safety features that restrict generating videos with real people or faces. Please try an image that does not contain a human face.";
            }

            throw new Error(userMessage);
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            console.error("Gemini API did not return a video link. Full response:", operation.response);
            throw new Error("Video generation completed, but no video was returned. This can happen if the content is blocked by safety filters.");
        }

        const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
        if (!videoResponse.ok) {
            throw new Error(`Failed to download video: ${videoResponse.statusText}`);
        }

        const videoBlob = await videoResponse.blob();
        return URL.createObjectURL(videoBlob);

    } catch (error) {
        clearInterval(progressInterval);
        console.error("Gemini Service Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during video generation.";
        throw new Error(errorMessage);
    }
}