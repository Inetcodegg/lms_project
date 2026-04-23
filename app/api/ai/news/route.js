import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export async function POST(req) {
    try {
        const { prompt } = await req.json();
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemInstruction = `
        Siz universitet matbuot kotibisiz. Foydalanuvchi buyrug'i asosida rasmiy va chiroyli universitet yangiligi yaratishingiz kerak.
        FAQAT JSON qaytaring. 
        Format: {"title": "Sarlavha", "content": "Yangilikning to'liq matni (kamida 3-4 gap)", "category": "Kategoriya (Tadbir, E'lon, yoki Muhim)", "targetAudience": "all/students/teachers"}
        `;

        const result = await model.generateContent([systemInstruction, prompt]);
        const response = await result.response;
        const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        
        return NextResponse.json(JSON.parse(text));
    } catch (error) {
        return NextResponse.json({ error: true }, { status: 500 });
    }
}