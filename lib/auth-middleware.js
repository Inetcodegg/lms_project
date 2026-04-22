import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from './firebase-admin';

/**
 * Higher-order function that wraps a Next.js route handler with role-based auth.
 *
 * Usage:
 *   export const GET = withAuth(['student', 'teacher'], async (req, ctx, { uid, role }) => { ... });
 *
 * @param {string[]} allowedRoles  - Roles that may access this route (e.g. ['student'])
 * @param {Function} handler       - The actual route handler (req, ctx, { uid, role }) => Response
 */
export function withAuth(allowedRoles, handler) {
    return async function (req, ctx) {
        try {
            const authHeader = req.headers.get('authorization');
            const token = authHeader?.split('Bearer ')[1];

            // ── No Firebase Admin (env vars missing) ────────────────────────────
            if (!adminAuth) {
                console.warn('[withAuth] DEV MODE — skipping token verification (no adminAuth)');
                return handler(req, ctx, { uid: 'dev-mock-uid', role: allowedRoles[0] });
            }

            // ── Development bypass ──────────────────────────────────────────────
            // Allow the app to function before Firebase Auth is fully wired up.
            if (process.env.NODE_ENV === 'development' && token === 'development-mock-token') {
                return handler(req, ctx, { uid: 'U-1283', role: allowedRoles[0] });
            }

            // ── Token verification ──────────────────────────────────────────────
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return NextResponse.json({ error: 'Unauthorized — no token' }, { status: 401 });
            }

            const decoded = await adminAuth.verifyIdToken(token);
            const uid = decoded.uid;

            // ── Role check ──────────────────────────────────────────────────────
            const userSnap = await adminDb.collection('users').doc(uid).get();
            if (!userSnap.exists) {
                return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
            }

            const { role } = userSnap.data();
            if (!allowedRoles.includes(role.toLowerCase())) {
                return NextResponse.json(
                    { error: `Access denied — requires role: ${allowedRoles.join(' or ')}` },
                    { status: 403 }
                );
            }

            return handler(req, ctx, { uid, role });
        } catch (err) {
            console.error('[withAuth] Error:', err.message);
            return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
        }
    };
}
