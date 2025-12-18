
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini (will only work if key is present)
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: NextRequest) {
    try {
        const { text, targetLang = 'es' } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        // Mock Translation / Fallback if no API Key
        if (!apiKey || !genAI) {
            console.warn("No GEMINI_API_KEY found. Returning pseudo-translation.");
            // Simple mock: Append [ES] to text nodes or similar. 
            // Since we receive HTML, simplistic replacement is risky.
            // Let's just return a placeholder message or simple substitution.
            return NextResponse.json({
                translatedText: `<div style="padding: 20px; background: #fee; border: 1px solid red; margin-bottom: 20px;">
                    <strong>Dev Note:</strong> GEMINI_API_KEY is missing in .env.local.<br/>
                    Please add your API key to enable real AI translation.<br/>
                    <br/>
                    Showing original content below:
                </div>` + text
            });
        }

        // Real Translation with Gemini
        // We ask Gemini to translate the *text content* but preserve the HTML structure.
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
        You are a professional translator for educational content. 
        Translate the following HTML content into Spanish (${targetLang}).
        
        CRITICAL RULES:
        1. Preserve ALL HTML tags, classes, and IDs exactly as they are.
        2. Only translate the human-readable text content inside the tags.
        3. Do not add any conversational filler. Return ONLY the translated HTML.
        4. Maintain the "Warmly Academic" tone appropriate for middle/high schoolers.
        
        HTML Content:
        ${text}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const translatedText = response.text();

        // Cleanup: Sometimes models wrap output in markdown code blocks like ```html ... ```
        const cleanText = translatedText.replace(/```html/g, '').replace(/```/g, '').trim();

        return NextResponse.json({ translatedText: cleanText });

    } catch (error: any) {
        console.error('Translation error:', error);
        return NextResponse.json({ error: error.message || 'Translation failed' }, { status: 500 });
    }
}
