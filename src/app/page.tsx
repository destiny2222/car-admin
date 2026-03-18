"use client";

import { useState } from "react";
import { Car, Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { BackgroundMesh } from "@/components/BackgroundMesh";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Use local API route to ensure cookies are properly set
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(data.message || "Invalid credentials. Please check your email and password.");
        } else if (response.status === 401) {
          throw new Error(data.message || "Invalid credentials. Please check your email and password.");
        } else if (response.status === 403) {
          throw new Error(data.message || "Account temporarily unavailable. Please try again later.");
        } else {
          throw new Error(data.message || "An unexpected error occurred. Please try again.");
        }
      }

      // Check if login was successful by verifying the response
      if (data.status || data.success || data.token) {
        // Small delay to ensure cookie is set before redirect
        setTimeout(() => {
          router.push("/dashboard");
        }, 100);
      } else {
        throw new Error(data.message || "Login failed. Please try again.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-12 text-white overflow-hidden">
      <BackgroundMesh />
      
      {/* Decorative Silhouette */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none hidden sm:block">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] 
        bg-[url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=2560')] 
        bg-no-repeat bg-center bg-contain mix-blend-overlay grayscale animate-pulse duration-[10s]" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-700">
        <div className="glass-card p-6 sm:p-10 space-y-6 sm:space-y-8 relative overflow-hidden">
          {/* Accent Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[100px] rounded-full" />
          
          <div className="text-center space-y-2">
            <div className="inline-flex w-14 h-14 bg-primary rounded-2xl items-center justify-center shadow-2xl shadow-primary/40 mb-4 animate-bounce duration-[3s]">
              <Car className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Welcome Back</h1>
            <p className="text-white/40 text-sm">Monitor your luxury fleet in real-time</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/3 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all font-medium"
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/3 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="w-4 h-4 rounded border border-white/20 group-hover:border-primary/50 transition-colors bg-white/2" />
                <span className="text-white/40 group-hover:text-white transition-colors">Remember me</span>
              </label>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-xl shadow-primary/20 hover:shadow-primary/40 group active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
