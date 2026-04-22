"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase'; // Firebase konfiguratsiya faylingiz manzili
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    // Endi "role" ni alohida state qilish shart emas, u "user" obyektining ichida keladi
    const [user, setUser] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [loading, setLoading] = useState(true);

    // 1. FIREBASE AUTH LISTENER (Foydalanuvchini jonli kuzatish)
    useEffect(() => {
        // onAuthStateChanged - foydalanuvchi kirdi/chiqdi holatini avtomat sezadi
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Firebase Auth'dan faqat Email/UID keladi, 
                    // bizga uning Roli va Ismi ham kerak, shuning uchun Firestore'dan qidiramiz
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userDoc = await getDoc(userDocRef);
                    
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUser({ 
                            uid: firebaseUser.uid, 
                            email: firebaseUser.email,
                            ...userData // Baza ichidagi name, role, avatar lar shu yerga tushadi
                        });
                    } else {
                        // Agar bazada ma'lumoti topilmasa (Xavfsizlik uchun)
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            role: 'student' 
                        });
                    }
                } catch (error) {
                    console.error("Context Error:", error);
                    setUser(null);
                }
            } else {
                // Tizimdan chiqib ketganda
                setUser(null);
            }
            
            // Firebase o'z ishini tugatdi, loading'ni o'chiramiz
            setLoading(false); 
        });

        // Komponent yopilganda kuzatishni to'xtatish
        return () => unsubscribe();
    }, []);

    // 2. DARK MODE (Tungi rejim) NI KUZATISH
    useEffect(() => {
        const savedTheme = localStorage.getItem('campus_theme');
        if (savedTheme === 'dark') {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    // Tungi/Yorug' rejimni o'zgartirish funksiyasi
    const toggleDarkMode = () => {
        const nextMode = !isDarkMode;
        setIsDarkMode(nextMode);
        if (nextMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('campus_theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('campus_theme', 'light');
        }
    };

    // Logout holatini tozalash
    const logout = () => {
        setUser(null);
    };

    // E'tibor bering: "login" funksiyasi olib tashlandi, chunki endi login jarayonini 
    // LoginPage'ning o'zida signInWithEmailAndPassword orqali qilyapmiz. 
    // Context esa uni avtomat eshitib oladi!
    return (
        <UserContext.Provider value={{ user, logout, loading, isDarkMode, toggleDarkMode }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};