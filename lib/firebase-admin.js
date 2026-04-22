import * as admin from 'firebase-admin';

/**
 * Firebase Admin SDK singleton initializer.
 * In development (no env vars set) both adminDb and adminAuth will be null.
 * All API routes already handle the null case with empty-data fallbacks.
 */

let adminDb = null;
let adminAuth = null;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (projectId && clientEmail && privateKey) {
    try {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
        }
        adminDb = admin.firestore();
        adminAuth = admin.auth();
    } catch (err) {
        console.error('[firebase-admin] Initialization error:', err.message);
    }
} else {
    console.warn('[firebase-admin] Missing env vars — running in DEV/MOCK mode. API routes will return empty data.');
}

export { adminDb, adminAuth };
