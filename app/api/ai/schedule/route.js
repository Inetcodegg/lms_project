import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export async function POST(req) {
    try {
        const { prompt, teachers, currentSchedules } = await req.json();

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // AI ga kontekst beramiz: tizim qanday ishlashi va mavjud ma'lumotlar
        const systemInstruction = `
        Siz dars jadvali yordamchisiz. Foydalanuvchi matnidan dars ma'lumotlarini ajratib oling va JSON formatida qaytaring.
        
        Mavjud o'qituvchilar: ${JSON.stringify(teachers)}
        
        Qoidalari:
        1. Faqat JSON qaytaring. Format: {"group": "...", "day": "...", "pair": number, "room": "...", "teacherId": "...", "teacherName": "...", "subject": "..."}
        2. Kunlar faqat: Dushanba, Seshanba, Chorshanba, Payshanba, Juma, Shanba bo'lsin.
        3. Agar o'qituvchi ismi matnda bo'lsa, uni bazadagi ID bilan bog'lang.
        4. Agar ma'lumot yetishmasa, JSON ichida "error" maydonini qaytaring.
        `;

        const result = await model.generateContent([systemInstruction, prompt]);
        const response = await result.response;
        const text = response.text();
        
        // AI ba'zan darsni tushuntirib yuboradi, bizga faqat JSON kerak
        const jsonMatch = text.match(/\{.*\}/s);
        const scheduleData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

        return NextResponse.json(scheduleData);
    } catch (error) {
        return NextResponse.json({ error: "AI bilan bog'lanishda xato" }, { status: 500 });
    }
}