"use client";

import { DashboardShell } from "@/components/DashboardShell";
import { useRouter } from "next/navigation";
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  MapPin, 
  Download,
  Calendar,
  Activity,
  AlertCircle,
  Car,
  MoreHorizontal,
  ArrowUpRight
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";

interface DashboardData {
  listings: {
    total: number;
    pending: number;
    approved: number;
    declined: number;
    pending_change: number;
    approved_change: number;
    declined_change: number;
  };
  bookings: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    pending_change: number;
    in_progress_change: number;
    completed_change: number;
  };
  users: {
    total: number;
    monthly_change: number;
  };
}

// Helper function to get auth token from cookies
function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(c => 
    c.trim().startsWith('session=') || 
    c.trim().startsWith('token=') ||
    c.trim().startsWith('auth_token=') ||
    c.trim().startsWith('admin_token=')
  );
  if (authCookie) {
    return authCookie.split('=')[1] || authCookie.split('=')[1];
  }
  return null;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get auth token
      const token = getAuthToken();
      const authHeaders: HeadersInit = token ? { "Authorization": `Bearer ${token}` } : {};

      // Use local API route
      const response = await fetch(`/api/admin/dashboard`, {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/');
          return;
        }
        throw new Error("Failed to fetch analytics data.");
      }

      const result = await response.json();
      console.log("Analytics Data Fetched", result);
      
      if (result.status && result.data) {
        setData(result.data);
      }
    } catch (err: unknown) {
      // If unauthorized, redirect to login
      if (err instanceof Error && (err.message.includes('401') || err.message.includes('unauthorized'))) {
        router.push('/');
        return;
      }
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <DashboardShell>
       {isLoading && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex items-center justify-center pointer-events-none">
               <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg shadow-primary/20" />
            </div>
      )}

      <div className={`space-y-8 transition-opacity duration-500 ${isLoading ? 'opacity-30' : 'opacity-100'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-16">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">Deep Analytics</h1>
            <p className="text-white/40 text-sm sm:text-base">Comprehensive insights into your fleet performance.</p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
             {error && (
              <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>Error loading data</span>
              </div>
            )}
            <button className="glass px-6 py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 hover:bg-white/5 whitespace-nowrap">
              <Download className="w-5 h-5" />
              <span className="inline sm:inline">Export Data</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue by Region */}
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white">Revenue by Region</h3>
              <MapPin className="text-primary w-5 h-5" />
            </div>
            
            <div className="space-y-6">
              {[
                { label: "Middle East", value: "$450k", width: "w-[85%]", color: "bg-primary" },
                { label: "North America", value: "$320k", width: "w-[65%]", color: "bg-blue-400" },
                { label: "Europe", value: "$280k", width: "w-[55%]", color: "bg-emerald-400" },
                { label: "Asia Pacific", value: "$150k", width: "w-[35%]", color: "bg-amber-400" },
              ].map((region) => (
                <div key={region.label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60 font-medium">{region.label}</span>
                    <span className="text-white font-bold">{region.value}</span>
                  </div>
                  <div className="h-2 w-full bg-white/3 rounded-full overflow-hidden">
                    <motion.div 
                      key={region.label}
                      initial={{ width: 0 }}
                      animate={{ width: parseInt(region.width.match(/\d+/)?.[0] || "10") + '%' }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={`h-full ${region.color} shadow-[0_0_10px_rgba(13,89,242,0.5)]`} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fleet Composition */}
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white">Fleet Composition</h3>
              <PieChartIcon className="text-secondary w-5 h-5" />
            </div>
            
            <div className="flex items-center justify-center h-[200px] mb-8">
               <div className="w-48 h-48 rounded-full border-12 border-white/3 flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border-12 border-primary border-t-transparent border-r-transparent transform rotate-45" />
                  <div className="absolute inset-0 rounded-full border-12 border-secondary border-b-transparent border-l-transparent transform -rotate-12" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">
                      {data?.listings?.total || "0"}
                    </p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Total Cars</p>
                  </div>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm text-white/60">Approved ({Math.round(((data?.listings?.approved || 0) / (data?.listings?.total || 1)) * 100)}%)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-sm text-white/60">Pending ({Math.round(((data?.listings?.pending || 0) / (data?.listings?.total || 1)) * 100)}%)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <span className="text-sm text-white/60">Declined ({Math.round(((data?.listings?.declined || 0) / (data?.listings?.total || 1)) * 100)}%)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-white/5" />
                <span className="text-sm text-white/60">Others (0%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Performance Summary */}
        <div className="glass-card p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-white/3 text-primary glass">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Global Performance Summary</h3>
              <p className="text-white/40 text-sm">Real-time metrics from your current operations.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               { 
                 label: "Total Bookings", 
                 value: data?.bookings?.total?.toString() || "0", 
                 icon: TrendingUp, 
                 color: "text-emerald-400",
                 change: `${(data?.bookings?.pending_change ?? 0) > 0 ? '+' : ''}${data?.bookings?.pending_change ?? 0}%`
               },
               { 
                 label: "Growth Rate", 
                 value: `${data?.users?.monthly_change || 0}%`, 
                 icon: Activity, 
                 color: "text-blue-400",
                 change: "Monthly"
               },
               { 
                 label: "Active Users", 
                 value: data?.users?.total?.toString() || "0", 
                 icon: Calendar, 
                 color: "text-purple-400",
                 change: "Current"
               },
             ].map((m) => (
                <div key={m.label} className="p-6 rounded-2xl bg-white/2 border border-white/5 relative group overflow-hidden">
                   <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                   <div className="relative">
                      <p className="text-xs text-white/40 uppercase font-bold tracking-widest mb-1">{m.label}</p>
                      <div className="flex items-center justify-between">
                         <span className="text-2xl font-bold text-white">{m.value}</span>
                         <div className={`flex flex-col items-end`}>
                            <m.icon className={`w-5 h-5 ${m.color} mb-1`} />
                            {m.change && <span className="text-[10px] text-white/20 font-bold">{m.change}</span>}
                         </div>
                      </div>
                   </div>
                </div>
             ))}
          </div>
        </div>

        {/* Restore Performance Over Time Chart */}
        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white">Performance Trend</h3>
            <div className="flex gap-2">
              {['Day', 'Week', 'Month'].map((tag) => (
                <button key={tag} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${tag === 'Month' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 300">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d59f2" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0d59f2" stopOpacity="0" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <motion.path 
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                d="M 0 250 Q 150 200 250 150 T 500 100 T 750 180 T 1000 50" 
                fill="none" 
                stroke="#0d59f2" 
                strokeWidth="4"
                filter="url(#glow)"
              />
              <path 
                d="M 0 250 Q 150 200 250 150 T 500 100 T 750 180 T 1000 50 L 1000 300 L 0 300 Z" 
                fill="url(#chartGradient)"
              />
              <motion.circle 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                cx="500" cy="100" r="10" 
                fill="#0d59f2" 
                className="opacity-20"
              />
              <circle cx="500" cy="100" r="4" fill="#fff" />
            </svg>
          </div>
        </div>

        {/* Restore Recent Activity */}
        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white">System Insights</h3>
            <MoreHorizontal className="text-white/20 w-5 h-5 cursor-pointer hover:text-white transition-colors" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Fleet Utilization", value: "84%", action: "Optimized", time: "Stable", color: "text-emerald-400" },
              { name: "Avg. Response", value: "2.4m", action: "Improved", time: "-1.2s", color: "text-blue-400" },
              { name: "Compliance", value: "98%", action: "Verified", time: "Current", color: "text-primary" },
              { name: "Maintenance", value: "Low", action: "Scheduled", time: "Next: GT3", color: "text-orange-400" },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col gap-2 p-4 rounded-xl bg-white/2 border border-white/5 group hover:bg-white/5 transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{item.name}</p>
                  <ArrowUpRight className="w-4 h-4 text-white/10 group-hover:text-primary transition-colors" />
                </div>
                <h4 className="text-2xl font-bold text-white">{item.value}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold ${item.color}`}>{item.action}</span>
                  <span className="text-[10px] text-white/20 whitespace-nowrap">• {item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
