import { NextResponse } from 'next/server';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export async function POST(request) {
    try {
        const { templateUrl, studentData } = await request.json();

        if (!templateUrl || !studentData) {
            return NextResponse.json({ error: "Fayl yoki talaba ma'lumoti yetishmayapti" }, { status: 400 });
        }

        // 1. Firebase Storage'dagi qolipni (Template) yuklab olish
        const response = await fetch(templateUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. PizZip va Docxtemplater orqali Word faylni ochish
        const zip = new PizZip(buffer);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // 3. 🌟 ASOSIY SEHR: Qolipdagi so'zlarni almashtirish
        // Admin yuklagan DOCX fayli ichida {ism}, {familiya}, {id}, {guruh}, {fan}, {ustoz} yozilgan bo'lishi kerak.
        doc.render({
            ism: studentData.firstName || "",
            familiya: studentData.lastName || "",
            id: studentData.studentId || "",
            guruh: studentData.groupName || "",
            fan: studentData.subject || "",
            ustoz: studentData.teacherName || "Biriktirilgan Ustoz",
            sana: new Date().toLocaleDateString('uz-UZ')
        });

        // 4. Tayyor bo'lgan yangi faylni yig'ish
        const generatedBuffer = doc.getZip().generate({
            type: "nodebuffer",
            compression: "DEFLATE",
        });

        // 5. Tayyor faylni brauzerga (Foydalanuvchiga) qaytarish
        return new NextResponse(generatedBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="Cover_Page_${studentData.firstName}_${studentData.lastName}.docx"`,
            },
        });

    } catch (error) {
        console.error("Cover Page generatsiyasida xato:", error);
        return NextResponse.json({ error: "Faylni yaratishda xato yuz berdi" }, { status: 500 });
    }
}