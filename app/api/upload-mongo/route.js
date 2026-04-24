import { NextResponse } from 'next/server';
import { MongoClient, GridFSBucket } from 'mongodb';

// .env faylingizdagi MONGODB_URI
const uri = process.env.MONGODB_URI; 

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: "Fayl topilmadi" }, { status: 400 });
        }

        // MongoDB ga ulanish
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db('aetheria_lms'); // O'zingizning DB nomingizni yozasiz
        
        // GridFS orqali fayllarni saqlash (5MB va undan kattalari uchun eng xavfsiz yo'l)
        const bucket = new GridFSBucket(db, { bucketName: 'teacher_files' });

        // Faylni xotiraga o'qib olish
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload Stream yaratish
        const uploadStream = bucket.openUploadStream(file.name, {
            contentType: file.type,
            metadata: {
                size: file.size,
                uploadedAt: new Date()
            }
        });

        uploadStream.end(buffer);

        // Oqim (Stream) tugashini kutish
        return new Promise((resolve, reject) => {
            uploadStream.on('finish', () => {
                client.close();
                resolve(NextResponse.json({ 
                    success: true, 
                    fileId: uploadStream.id.toString(),
                    fileName: file.name,
                    // Frontend uchun o'qish API linki
                    fileUrl: `/api/files-mongo/${uploadStream.id.toString()}` 
                }, { status: 200 }));
            });

            uploadStream.on('error', (err) => {
                client.close();
                console.error("MongoDB yuklash xatosi:", err);
                reject(NextResponse.json({ error: "Fayl yuklashda xatolik yuz berdi" }, { status: 500 }));
            });
        });

    } catch (error) {
        console.error("API xatosi:", error);
        return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
    }
}