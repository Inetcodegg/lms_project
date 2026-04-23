import "../styles/globals.css";
import { UserProvider } from "../lib/UserContext";
import { LanguageProvider } from "../lib/LanguageContext";

export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
        { media: "(prefers-color-scheme: dark)", color: "#020617" },
    ],
};

export const metadata = {
    title: {
        template: "%s | Campus LMS",
        default: "Campus LMS - Zamonaviy Ta'lim Tizimi",
    },
    description: "Universitet talabalari, o'qituvchilari va ma'muriyati uchun yagona portal.",
};

export default function RootLayout({ children }) {
    return (
        <html lang="uz" suppressHydrationWarning>
            <body className="antialiased text-slate-900 dark:text-slate-50 bg-slate-50 dark:bg-slate-950 overflow-x-hidden min-h-[100dvh]">
                
                {/* AMBIENT BACKGROUNDS (Faqat orqa fon uchun) */}
                <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-[100px] mix-blend-multiply dark:mix-blend-screen"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-emerald-500/10 dark:bg-emerald-600/10 blur-[100px] mix-blend-multiply dark:mix-blend-screen"></div>
                </div>

                <UserProvider>
                    <LanguageProvider>
                        {/* SAHIFALAR SHU YERDA OCHILADI (Login ham, Dashboard ham) */}
                        <div className="relative z-10 w-full h-[100dvh]">
                            {children}
                        </div>
                    </LanguageProvider>
                </UserProvider>

            </body>
        </html>
    );
}