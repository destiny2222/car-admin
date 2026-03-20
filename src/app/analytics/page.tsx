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
  }, [router]);

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

      <div className={`space-y-8 pt-10 transition-opacity duration-500 ${isLoading ? 'opacity-30' : 'opacity-100'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Deep Analytics</h1>
            <p className="text-slate-500 text-sm sm:text-base">Comprehensive insights into your fleet performance.</p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
             {error && (
              <div className="px-4 py-2 rounded-lg bg-red-50 text-red-600 border border-red-100 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>Error loading data</span>
              </div>
            )}
            <button className="bg-white border border-slate-200 px-6 py-3 rounded-xl font-bold text-slate-700 transition-all flex items-center justify-center gap-2 hover:bg-slate-50 shadow-sm whitespace-nowrap">
              <Download className="w-5 h-5" />
              <span className="inline">Export Data</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue by Region */}
          <div className="glass-card p-8 bg-white border border-slate-200/50 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-900">Revenue by Region</h3>
              <MapPin className="text-primary w-5 h-5" />
            </div>
            
            <div className="space-y-6">
              {[
                { label: "Middle East", value: "$450k", width: "w-[85%]", color: "bg-blue-600" },
                { label: "North America", value: "$320k", width: "w-[65%]", color: "bg-blue-400" },
                { label: "Europe", value: "$280k", width: "w-[55%]", color: "bg-emerald-500" },
                { label: "Asia Pacific", value: "$150k", width: "w-[35%]", color: "bg-amber-500" },
              ].map((region) => (
                <div key={region.label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">{region.label}</span>
                    <span className="text-slate-900 font-bold">{region.value}</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      key={region.label}
                      initial={{ width: 0 }}
                      animate={{ width: parseInt(region.width.match(/\d+/)?.[0] || "10") + '%' }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={`h-full ${region.color} shadow-[0_0_10px_rgba(37,99,235,0.2)]`} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fleet Composition */}
          <div className="glass-card p-8 bg-white border border-slate-200/50 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-900">Fleet Composition</h3>
              <PieChartIcon className="text-blue-500 w-5 h-5" />
            </div>
            
             <div className="flex items-center justify-center h-[200px] mb-8">
               <div className="w-48 h-48 rounded-full border-12 border-slate-50 flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border-12 border-blue-600 border-t-transparent border-r-transparent transform rotate-45 shadow-[0_0_15px_rgba(37,99,235,0.1)]" />
                  <div className="absolute inset-0 rounded-full border-12 border-emerald-500 border-b-transparent border-l-transparent transform -rotate-12 shadow-[0_0_15px_rgba(16,185,129,0.1)]" />
                  <div className="text-center">
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">
                      {data?.listings?.total || "0"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Fleet</p>
                  </div>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                <span className="text-sm text-slate-600 font-medium">Approved ({Math.round(((data?.listings?.approved || 0) / (data?.listings?.total || 1)) * 100)}%)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-slate-600 font-medium">Pending ({Math.round(((data?.listings?.pending || 0) / (data?.listings?.total || 1)) * 100)}%)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-slate-600 font-medium">Declined ({Math.round(((data?.listings?.declined || 0) / (data?.listings?.total || 1)) * 100)}%)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                <span className="text-sm text-slate-600 font-medium">Under Service (0%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Performance Summary */}
        <div className="glass-card p-8 bg-white border border-slate-200/50 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Global Performance Summary</h3>
              <p className="text-slate-500 text-sm font-medium">Real-time metrics from your current operations.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               { 
                 label: "Total Bookings", 
                 value: data?.bookings?.total?.toString() || "0", 
                 icon: TrendingUp, 
                 color: "text-emerald-600",
                 bgColor: "bg-emerald-50",
                 change: `${(data?.bookings?.pending_change ?? 0) > 0 ? '+' : ''}${data?.bookings?.pending_change ?? 0}%`
               },
               { 
                 label: "Growth Rate", 
                 value: `${data?.users?.monthly_change || 0}%`, 
                 icon: Activity, 
                 color: "text-blue-600",
                 bgColor: "bg-blue-50",
                 change: "Monthly"
               },
               { 
                 label: "Active Users", 
                 value: data?.users?.total?.toString() || "0", 
                 icon: Calendar, 
                 color: "text-purple-600",
                 bgColor: "bg-purple-50",
                 change: "Current"
               },
             ].map((m) => (
                <div key={m.label} className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 relative group overflow-hidden transition-all hover:bg-white hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
                   <div className="relative">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">{m.label}</p>
                      <div className="flex items-center justify-between">
                         <span className="text-3xl font-black text-slate-900">{m.value}</span>
                         <div className="flex flex-col items-end">
                            <div className={`p-2 rounded-xl ${m.bgColor} ${m.color} mb-1`}>
                               <m.icon className="w-5 h-5" />
                            </div>
                            {m.change && <span className="text-[10px] text-slate-500 font-bold">{m.change}</span>}
                         </div>
                      </div>
                   </div>
                </div>
             ))}
          </div>
        </div>

        {/* Restore Performance Over Time Chart */}
        <div className="glass-card p-8 bg-white border border-slate-200/50 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">Performance Trend</h3>
            <div className="flex gap-2">
              {['Day', 'Week', 'Month'].map((tag) => (
                <button key={tag} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${tag === 'Month' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
          
            <div className="h-[300px] w-full relative group">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 300">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <motion.path 
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  d="M 0 250 Q 150 200 250 150 T 500 100 T 750 180 T 1000 50" 
                  fill="none" 
                  stroke="#2563eb" 
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path 
                  d="M 0 250 Q 150 200 250 150 T 500 100 T 750 180 T 1000 50 L 1000 300 L 0 300 Z" 
                  fill="url(#chartGradient)"
                />
                <motion.circle 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  cx="500" cy="100" r="12" 
                  fill="#2563eb" 
                />
                <circle cx="500" cy="100" r="4" fill="#2563eb" />
                <circle cx="500" cy="100" r="2" fill="#fff" />
              </svg>

              {/* Tooltip Simulation */}
              <div className="absolute top-10 left-[48%] bg-white/90 backdrop-blur-md p-3 rounded-xl border border-slate-200 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl shadow-slate-200/50">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Performance Peak</p>
                 <p className="text-sm font-black text-slate-900">Value: 92%</p>
              </div>
            </div>
        </div>

        {/* Restore Recent Activity */}
        <div className="glass-card p-8 bg-white border border-slate-200/50 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">System Insights</h3>
            <MoreHorizontal className="text-slate-300 w-5 h-5 cursor-pointer hover:text-slate-900 transition-colors" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Fleet Utilization", value: "84%", action: "Optimized", time: "Stable", color: "text-emerald-600", bgColor: "bg-emerald-50" },
              { name: "Avg. Response", value: "2.4m", action: "Improved", time: "-1.2s", color: "text-blue-600", bgColor: "bg-blue-50" },
              { name: "Compliance", value: "98%", action: "Verified", time: "Current", color: "text-primary", bgColor: "bg-blue-50" },
              { name: "Maintenance", value: "Low", action: "Scheduled", time: "Next: GT3", color: "text-amber-600", bgColor: "bg-amber-50" },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col gap-2 p-5 rounded-2xl bg-white border border-slate-100 group hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{item.name}</p>
                  <ArrowUpRight className="w-4 h-4 text-slate-200 group-hover:text-primary transition-colors" />
                </div>
                <h4 className="text-2xl font-black text-slate-900">{item.value}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${item.bgColor} ${item.color}`}>{item.action}</span>
                  <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">• {item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
