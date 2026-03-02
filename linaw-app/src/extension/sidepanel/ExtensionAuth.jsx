import React, { useState } from "react";
import { auth, db } from "../../services/firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { createNotebook } from "../../services/notebookService";
import { Loader2, Mail, Lock, User } from "lucide-react";

export default function ExtensionAuth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                const user = userCredential.user;

                await updateProfile(user, {
                    displayName: fullName
                });

                await setDoc(doc(db, "users", user.uid), {
                    name: fullName,
                    email: email,
                    createdAt: new Date()
                });

                await createNotebook(user.uid, "Getting Started");
            }
        } catch (err) {
            setError(err.message.replace("Firebase: ", ""));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col gap-6">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-[#3DBDB4]/10 rounded-xl flex items-center justify-center mb-2">
                        <span className="text-2xl">✨</span>
                    </div>
                    <h2 className="text-2xl font-black text-[#2D3748] tracking-tight">
                        Linaw <span className="text-[#3DBDB4]">{isLogin ? "Login" : "Register"}</span>
                    </h2>
                    <p className="text-sm text-gray-500 font-medium text-center">
                        {isLogin ? "Welcome back to your reading assistant" : "Create an account to start defining"}
                    </p>
                </div>

                {error && (
                    <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 text-[#FF6B6B] text-xs font-bold p-3 rounded-lg text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {!isLogin && (
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User size={16} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Full Name"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#3DBDB4]/20 focus:border-[#3DBDB4] outline-none transition-all placeholder:text-gray-400"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail size={16} className="text-gray-400" />
                        </div>
                        <input
                            type="email"
                            placeholder="Email Address"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#3DBDB4]/20 focus:border-[#3DBDB4] outline-none transition-all placeholder:text-gray-400"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock size={16} className="text-gray-400" />
                        </div>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#3DBDB4]/20 focus:border-[#3DBDB4] outline-none transition-all placeholder:text-gray-400"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-[#3DBDB4] hover:bg-[#35a99f] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 mt-2 shadow-sm"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : (isLogin ? "Login to Linaw" : "Create Account")}
                    </button>
                </form>

                <p className="text-center text-sm font-medium text-gray-500">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError("");
                        }}
                        className="ml-1 text-[#3DBDB4] font-bold hover:underline"
                        type="button"
                    >
                        {isLogin ? "Register" : "Login"}
                    </button>
                </p>
            </div>
        </div>
    );
}
