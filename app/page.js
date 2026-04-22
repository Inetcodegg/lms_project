"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GraduationCap, ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";

export default function Login() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");

    const handleLogin = (e) => {
        e.preventDefault();
        setLoading(true);
        // Navigate immediately for better performance
        router.push("/home");
    };

    return (
        <div className="flex h-screen bg-slate-50 inset-0 absolute z-[100] overflow-hidden font-sans">
            {/* Left side: branding/photo - Minimalist & Serious */}
            <div className="hidden lg:flex w-5/12 bg-[#1e293b] text-white flex-col justify-between p-16 relative overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 to-slate-900 z-0"></div>

                {/* Abstract geometric shapes for a serious look */}
                <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] border border-white/20 rounded-full"></div>
                    <div className="absolute top-[10%] right-[10%] w-[60%] h-[60%] border border-white/10 rounded-full"></div>
                </div>

                <div className="relative z-10 flex items-center space-x-3 text-2xl font-bold tracking-tight">
                    <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg ring-4 ring-indigo-500/20">
                        <GraduationCap className="h-7 w-7 text-white" />
                    </div>
                    <span>Campus LMS</span>
                </div>

                <div className="relative z-10 max-w-md">
                    <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-400/20 px-3 py-1 rounded-full text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>University Secure Access</span>
                    </div>
                    <h1 className="text-5xl font-extrabold mb-6 leading-[1.1] tracking-tight text-white">
                        Your Academic <br />
                        <span className="text-indigo-400">Journey Starts Here.</span>
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed font-medium">
                        Securely access your study materials, track academic results, and manage your campus life in one professional platform.
                    </p>
                </div>

                <div className="relative z-10 text-[13px] font-semibold text-slate-500 flex items-center space-x-6">
                    <span>© 2026 Campus University</span>
                    <span>Privacy Policy</span>
                    <span>Support</span>
                </div>
            </div>

            {/* Right side: Login form */}
            <div className="w-full lg:w-7/12 flex items-center justify-center p-8 sm:p-12 relative z-10 h-full bg-white">
                <div className="w-full max-w-[420px]">

                    <div className="mb-10">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Sign In</h2>
                        <p className="text-slate-500 font-medium">Enter your university email to continue.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">University Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    placeholder="student@university.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-sm font-bold text-slate-700">Password</label>
                                <a href="#" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">Forgot?</a>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center p-1 uppercase tracking-widest text-[10px] font-black text-slate-400">
                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <div className="relative h-5 w-5 flex items-center justify-center">
                                    <input type="checkbox" className="peer appearance-none h-5 w-5 border-2 border-slate-200 rounded-md checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer" />
                                    <svg className="absolute h-3.5 w-3.5 text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                        <path d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="group-hover:text-slate-600 transition-colors">Remember this device</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#1e293b] hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-4.5 rounded-2xl shadow-xl shadow-slate-200 hover:shadow-2xl hover:shadow-slate-300 transition-all flex justify-center items-center group relative overflow-hidden"
                        >
                            <span className={loading ? "opacity-0" : "flex items-center"}>
                                Sign In to Campus
                                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                </div>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-10 border-t border-slate-100 flex flex-col items-center">
                        <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-6">New to University?</p>
                        <button className="w-full py-4 px-6 rounded-2xl border-2 border-slate-100 text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-200 transition-all">
                            Register with Academic ID
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

