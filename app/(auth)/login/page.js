"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase"; 
import { useUser } from "../../../lib/UserContext";
import Spinner from "../../../components/Spinner";
import { 
    Library, ShieldCheck, Mail, Lock, 
    ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle2 
} from "lucide-react";

// --- 🌟 INTERAKTIV FON KOMPONENTI (CANVAS PARTICLES) ---
const ParticleBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let particles = [];
        let animationFrameId;

        const mouse = { x: null, y: null, radius: 150 };

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.x;
            mouse.y = e.y;
        });
        window.addEventListener('mouseout', () => {
            mouse.x = null;
            mouse.y = null;
        });

        resizeCanvas();

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2.5 + 0.5;
                this.baseX = this.x;
                this.baseY = this.y;
                this.density = (Math.random() * 30) + 1;
                this.vx = (Math.random() - 0.5) * 1.5;
                this.vy = (Math.random() - 0.5) * 1.5;
            }

            draw() {
                ctx.fillStyle = 'rgba(99, 102, 241, 0.4)'; // Indigo color
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            }

            update() {
                // Avtomatik harakat
                this.x += this.vx;
                this.y += this.vy;

                // Devorga urilganda qaytish
                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

                // Kursor bilan interaktivlik (qochish effekti)
                if (mouse.x != null && mouse.y != null) {
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    let forceDirectionX = dx / distance;
                    let forceDirectionY = dy / distance;
                    let maxDistance = mouse.radius;
                    let force = (maxDistance - distance) / maxDistance;
                    let directionX = forceDirectionX * force * this.density;
                    let directionY = forceDirectionY * force * this.density;

                    if (distance < mouse.radius) {
                        this.x -= directionX;
                        this.y -= directionY;
                    }
                }
            }
        }

        const init = () => {
            particles = [];
            const numberOfParticles = (canvas.width * canvas.height) / 9000;
            for (let i = 0; i < numberOfParticles; i++) {
                particles.push(new Particle());
            }
        };

        const connect = () => {
            let opacityValue = 1;
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    let distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x))
                                 + ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));
                    if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                        opacityValue = 1 - (distance / 20000);
                        ctx.strokeStyle = `rgba(129, 140, 248, ${opacityValue * 0.3})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
            }
            connect();
            animationFrameId = requestAnimationFrame(animate);
        };

        init();
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', null);
            window.removeEventListener('mouseout', null);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />;
};


export default function LoginPage() {
    const router = useRouter();
    const { user, loading: contextLoading } = useUser();
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (!contextLoading && user) {
            router.replace(`/${user.role}`);
        }
    }, [user, contextLoading, router]);

    const showToast = (text, type = "error") => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setToast(null);
        
        if (password.length < 6) {
            showToast("Parol kamida 6 ta belgi bo'lishi shart.", "error");
            return;
        }

        setLoading(true);

        try {
            let currentUser;
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                currentUser = userCredential.user;
            } catch (signInErr) {
                if (signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/wrong-password') {
                    if (email === 'inetcode@gmail.com') {
                        try {
                            const newUserCred = await createUserWithEmailAndPassword(auth, email, password);
                            currentUser = newUserCred.user;
                            await setDoc(doc(db, 'users', currentUser.uid), {
                                name: "Asosiy Administrator",
                                email: currentUser.email,
                                role: "admin",
                                createdAt: serverTimestamp()
                            });
                            showToast("Asosiy Admin akkaunti yaratildi!", "success");
                        } catch (regErr) {
                            if (regErr.code === 'auth/email-already-in-use') {
                                showToast("Email yoki parol noto'g'ri kiritildi.", "error");
                                setLoading(false);
                                return;
                            }
                            throw regErr;
                        }
                    } else {
                        showToast("Email yoki parol noto'g'ri (yoki ruxsat yo'q).", "error");
                        setLoading(false);
                        return;
                    }
                } else {
                    throw signInErr;
                }
            }

            const userDocSnap = await getDoc(doc(db, 'users', currentUser.uid));
            let targetRole = 'student'; 

            if (userDocSnap.exists()) {
                targetRole = userDocSnap.data().role || 'student';
            } else if (email !== 'inetcode@gmail.com') {
                showToast("Sizning ma'lumotlaringiz topilmadi. Ma'muriyatga murojaat qiling.", "error");
                setLoading(false);
                return;
            } else {
                targetRole = 'admin';
            }

            showToast("Tizimga muvaffaqiyatli kirdingiz!", "success");
            router.replace(`/${targetRole}`);

        } catch (err) {
            console.error("Login xatosi:", err);
            if (err.code === 'auth/too-many-requests') {
                showToast("Ko'p urinishlar! Birozdan so'ng qayta urinib ko'ring.", "error");
            } else {
                showToast("Tarmoq xatosi yoki ulanishda muammo yuz berdi.", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    if (contextLoading) return null;

    return (
        <div className="flex h-[100dvh] w-full relative overflow-hidden font-sans bg-slate-950">
            
            {/* 🌟 ORQA FON ANIMATSIYASI (ZARRACHALAR) */}
            <ParticleBackground />
            
            {/* Yorug'lik effektlari (Glow orbs) */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-600/20 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Global Alert (Toast) */}
            {toast && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm flex items-center space-x-3 animate-in slide-in-from-top-4 fade-in duration-300 ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                    <span>{toast.text}</span>
                </div>
            )}

            {/* Chap tomon: Brending */}
            <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 xl:p-16 relative z-10 text-white">
                <div className="flex items-center space-x-3 text-2xl font-black tracking-tight">
                    <div className="bg-white/5 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.3)]">
                        <Library className="h-8 w-8 text-indigo-400" />
                    </div>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200">
                        Campus LMS
                    </span>
                </div>

                <div className="max-w-xl animate-in slide-in-from-left-8 duration-1000">
                    <div className="inline-flex items-center space-x-2 bg-indigo-500/10 backdrop-blur-md border border-indigo-400/20 px-4 py-2 rounded-full text-indigo-300 text-xs font-black uppercase tracking-widest mb-8">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Xavfsiz Yopiq Portal</span>
                    </div>
                    <h1 className="text-5xl xl:text-7xl font-black mb-8 leading-[1.1] tracking-tighter">
                        Tizimga kirish <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-200">
                            Boshqaruv markazi.
                        </span>
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed font-medium max-w-md pl-6 border-l-2 border-indigo-500/50">
                        Ushbu tizimga faqatgina ma'muriyat tomonidan ruxsat berilgan talaba va o'qituvchilar kira oladi.
                    </p>
                </div>

                <div className="text-xs font-bold text-slate-500 flex items-center space-x-8 uppercase tracking-widest">
                    <span className="hover:text-indigo-400 cursor-pointer transition-colors">© 2026 Tizim</span>
                    <span className="hover:text-indigo-400 cursor-pointer transition-colors">Maxfiylik</span>
                    <span className="hover:text-indigo-400 cursor-pointer transition-colors">Yordam</span>
                </div>
            </div>

            {/* O'ng tomon: Login Formasi */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
                <div className="w-full max-w-[440px] bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[32px] md:rounded-[40px] p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-700">
                    
                    <div className="mb-10 text-center">
                        <div className="lg:hidden bg-white/5 backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 shadow-2xl inline-flex mb-6">
                            <Library className="h-8 w-8 text-indigo-400" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight mb-2">Xush Kelibsiz</h2>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Login va parolingizni kiriting</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email manzil</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    placeholder="id@campus.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-14 pr-5 py-4 rounded-2xl bg-slate-950/50 border border-white/5 focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all font-bold text-white placeholder:text-slate-600 shadow-inner"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parol</label>
                                <button type="button" className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest">Unutdingizmi?</button>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-14 pr-12 py-4 rounded-2xl bg-slate-950/50 border border-white/5 focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all font-bold text-white placeholder:text-slate-600 shadow-inner tracking-widest"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)} 
                                        className="text-slate-500 hover:text-indigo-400 transition-colors p-2 rounded-xl hover:bg-white/5"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] text-[11px] py-5 rounded-2xl shadow-[0_0_30px_rgb(79,70,229,0.3)] hover:shadow-[0_0_40px_rgb(79,70,229,0.5)] transition-all duration-300 flex justify-center items-center group relative overflow-hidden mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Spinner className="w-5 h-5 text-inherit" />
                            ) : (
                                <div className="flex items-center space-x-3">
                                    <span>Tizimga kirish</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                                </div>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
