import '../styles/globals.css';
import { Inter } from 'next/font/google';

// Sizdagi kontekstlar (Manzillar loyihangizga qarab farq qilishi mumkin)
import { UserProvider } from '../lib/UserContext'; 
import { LanguageProvider } from '../lib/LanguageContext';

// 🌟 ThemeProvider ni shu yerda chaqiramiz!
import { ThemeProvider } from '../components/ThemeProvider'; 

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Campus Management System',
  description: 'University Dashboard',
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning <html> da bo'lishi MAJBURIY
    <html lang="uz" suppressHydrationWarning> 
      <body className={inter.className}>
        
        {/* 🌟 ThemeProvider eng tashqarida, Server tomonda o'rab turadi */}
        <ThemeProvider>
            <UserProvider>
              <LanguageProvider>
                 {children}
              </LanguageProvider>
            </UserProvider>
        </ThemeProvider>

      </body>
    </html>
  );
}