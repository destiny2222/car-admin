"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardShell } from "@/components/DashboardShell";

import { 
  TrendingUp, 
  Users, 
  Activity, 
  Car, 
  Plus, 
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  GripHorizontal,
  Clock,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DragEndEvent } from "@dnd-kit/core";

interface StatItem {
  name: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ElementType;
  color: string;
  glow: string;
}

interface RecentActivity {
  id: string;
  name: string;
  action: string;
  time: string;
  color: string;
  status: string;
}

// --- Sortable Item Component ---
function SortableStatCard({ stat }: { stat: StatItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stat.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass-card p-6 group ${isDragging ? 'opacity-50 ring-2 ring-primary border-primary animate-pulse' : 'hover:translate-y-[-4px]'} transition-all duration-300`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl bg-white/3 ${stat.color} shadow-lg ${stat.glow}`}>
          <stat.icon className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 text-sm font-bold ${stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
              {stat.change}
              {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            </div>
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-white/10 hover:text-white/40 transition-colors">
               <GripHorizontal className="w-4 h-4" />
            </div>
        </div>
      </div>
      <p className="text-white/40 text-sm font-medium">{stat.name}</p>
      <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
    </div>
  );
}




// --- Main Page Component ---
export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("Month");
  const [items, setItems] = useState<Array<StatItem>>([
    { 
      name: "Listings", 
      value: "0", 
      change: "0%", 
      trend: "up", 
      icon: TrendingUp,
      color: "text-blue-400",
      glow: "shadow-blue-500/20"
    },
    { 
      name: "Bookings", 
      value: "0", 
      change: "0%", 
      trend: "up", 
      icon: Activity,
      color: "text-emerald-400",
      glow: "shadow-emerald-500/20"
    },
    { 
      name: "Total Users", 
      value: "0", 
      change: "0%", 
      trend: "up", 
      icon: Users,
      color: "text-amber-400",
      glow: "shadow-amber-500/20"
    },
  ]);

  const [detailedStats, setDetailedStats] = useState<{
    listings: { pending: number; approved: number; declined: number; pendingChange: number; approvedChange: number; declinedChange: number };
    bookings: { pending: number; in_progress: number; completed: number; pendingChange: number; inProgressChange: number; completedChange: number };
    users: { total: number; monthlyChange: number };
  }>({
    listings: { pending: 0, approved: 0, declined: 0, pendingChange: 0, approvedChange: 0, declinedChange: 0 },
    bookings: { pending: 0, in_progress: 0, completed: 0, pendingChange: 0, inProgressChange: 0, completedChange: 0 },
    users: { total: 0, monthlyChange: 0 }
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const periodMap: Record<string, string> = {
        "Day": "today",
        "Week": "this_week",
        "Month": "this_month"
      };

      const queryParams = new URLSearchParams({
        period: periodMap[selectedPeriod] || "this_month"
      });

      // Fetch Stats
      const statsRes = await fetch(`/api/admin/dashboard?${queryParams.toString()}`, { credentials: 'include' });
      const statsData = await statsRes.json();

      if (!statsRes.ok) {
        if (statsRes.status === 401 || statsRes.status === 403) {
          window.location.href = '/';
          return;
        }
        throw new Error(statsData.message || 'Failed to fetch dashboard stats');
      }

      // Fetch Recent Bookings for Activity
      const activityRes = await fetch(`/api/admin/bookings?limit=5`, { credentials: 'include' });
      const activityData = await activityRes.json();

      if (!activityRes.ok) {
        if (activityRes.status === 401 || activityRes.status === 403) {
          window.location.href = '/';
          return;
        }
      }

      if (statsData.status && statsData.data) {
        const { listings, bookings, users } = statsData.data;

        //   "data": {
        // "users": {
        //     "total": 59,
        //     "monthly_change": 250
        // }
        
        // Update Detailed Stats
        setDetailedStats({
          listings: {
            pending: listings?.pending || 0,
            approved: listings?.approved || 0,
            declined: listings?.declined || 0,
            pendingChange: listings?.pending_change || 0,
            approvedChange: listings?.approved_change || 0,
            declinedChange: listings?.declined_change || 0
          },
          bookings: {
            pending: bookings?.pending || 0,
            in_progress: bookings?.in_progress || 0,
            completed: bookings?.completed || 0,
            pendingChange: bookings?.pending_change || 0,
            inProgressChange: bookings?.in_progress_change || 0,
            completedChange: bookings?.completed_change || 0
          },
          users: {
            total: users?.total || 0,
            monthlyChange: users?.monthly_change || 0
          }
        });

        setItems(prev => prev.map(item => {
          if (item.name === "Listings" && listings) {
            return {
              ...item,
              value: listings.total?.toString() || "0",
              change: `${listings.approved_change >= 0 ? '+' : ''}${listings.approved_change || 0}%`,
              trend: (listings.approved_change || 0) >= 0 ? "up" : "down"
            };
          }
          if (item.name === "Bookings" && bookings) {
            return {
              ...item,
              value: bookings.total?.toString() || "0",
              change: `${bookings.pending_change >= 0 ? '+' : ''}${bookings.pending_change || 0}%`,
              trend: (bookings.pending_change || 0) >= 0 ? "up" : "down"
            };
          }
          if (item.name === "Total Users" && users) {
            return {
              ...item,
              value: users.total?.toString() || "0",
              change: `${users.monthly_change >= 0 ? '+' : ''}${users.monthly_change || 0}%`,
              trend: (users.monthly_change || 0) >= 0 ? "up" : "down"
            };
          }
          return item;
        }));
      }

      if (activityData.status && activityData.data) {
        interface RawActivity {
          id: string;
          reference?: string;
          status?: string;
          createdAt?: string;
          listing?: {
            make?: string;
            model?: string;
          };
        }
        const rawActivities: RawActivity[] = Array.isArray(activityData.data) ? activityData.data : (activityData.data.data || []);
        const mappedActivities = rawActivities.map((b) => {
          const ref = b.reference || b.id || "0000";
          return {
            id: b.id,
            name: b.listing ? `${b.listing.make || ''} ${b.listing.model || ''}`.trim() : `Booking #${ref.slice(-4)}`,
            action: (b.status || 'PENDING').replace("_", " "),
            time: b.createdAt ? new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--",
            status: b.status || 'PENDING',
            color: b.status === 'PAID' ? 'text-emerald-400' : 
                   b.status === 'PENDING' ? 'text-amber-400' : 
                   b.status === 'COMPLETED' ? 'text-blue-400' : 'text-white/40'
          };
        });
        setActivities(mappedActivities);
      }

    } catch (err: unknown) {
      if (err instanceof Error && (err.message.includes("401") || err.message.includes("403") || err.message.toLowerCase().includes("unauthorized"))) {
        window.location.href = '/';
        return;
      }
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
    
    const interval = setInterval(() => {
        setItems(prev => prev.map(item => {
            if (item.name === "Revenue") {
                const currentVal = parseInt(item.value.replace(/[$,]/g, ''));
                const newVal = currentVal + Math.floor(Math.random() * 50);
                return { ...item, value: `$${newVal.toLocaleString()}` };
            }
            return item;
        }));
    }, 8000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(item => item.name === active.id);
        const newIndex = items.findIndex(item => item.name === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  if (!mounted) return null;

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">Fleet Overview</h1>
            <p className="text-white/40 text-sm sm:text-base">Real-time snapshots of your global operations.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-3 sm:px-4 py-2 glass rounded-lg flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-white/60">Live Updates</span>
             </div>
             {/* <button className="bg-primary hover:bg-primary-light text-white px-4 sm:px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 whitespace-nowrap">
               <Plus className="w-5 h-5" />
               <span className="inline">Add Widget</span>
             </button> */}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in slide-in-from-top-2 flex items-center gap-3">
             <AlertCircle className="w-5 h-5" />
             <p>{error}</p>
          </div>
        )}

        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={items.map(i => i.name)}
            strategy={rectSortingStrategy}
          >
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-500 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {items.map((stat) => (
                <SortableStatCard key={stat.name} stat={stat} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Detailed Breakdown Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-400" />
                Listings Breakdown
              </h3>
              <span className="text-[10px] uppercase tracking-widest text-white/20 font-bold">Status Overview</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Approved</p>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold text-white uppercase">{detailedStats?.listings?.approved || 0}</span>
                  <span className="text-[10px] text-emerald-400 font-bold mb-1">+{detailedStats?.listings?.approvedChange || 0}%</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Pending</p>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold text-white uppercase">{detailedStats?.listings?.pending || 0}</span>
                  <span className={`text-[10px] font-bold mb-1 ${(detailedStats?.listings?.pendingChange || 0) >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                    {detailedStats?.listings?.pendingChange || 0}%
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Declined</p>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold text-white uppercase">{detailedStats?.listings?.declined || 0}</span>
                  <span className="text-[10px] text-white/20 font-bold mb-1">{detailedStats?.listings?.declinedChange || 0}%</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-white/40 uppercase tracking-widest font-bold">Health Score</span>
                <span className="text-blue-400 font-bold">98% Verified</span>
              </div>
              <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '98%' }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]"
                />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Bookings Analysis
              </h3>
              <span className="text-[10px] uppercase tracking-widest text-white/20 font-bold">Volume Trends</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">In Progress</p>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold text-white uppercase">{detailedStats?.bookings?.in_progress || 0}</span>
                  <span className="text-[10px] text-emerald-400 font-bold mb-1">+{detailedStats?.bookings?.inProgressChange || 0}%</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Pending</p>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold text-white uppercase">{detailedStats?.bookings?.pending || 0}</span>
                  <span className="text-[10px] text-amber-400 font-bold mb-1">{detailedStats?.bookings?.pendingChange || 0}%</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Completed</p>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold text-white uppercase">{detailedStats?.bookings?.completed || 0}</span>
                  <span className="text-[10px] text-blue-400 font-bold mb-1">+{detailedStats?.bookings?.completedChange || 0}%</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-white/40 uppercase tracking-widest font-bold">Fulfillment Rate</span>
                <span className="text-emerald-400 font-bold">100% Success</span>
              </div>
              <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                User Growth Stats
              </h3>
              <span className="text-[10px] uppercase tracking-widest text-white/20 font-bold">Registration Data</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Total Users</p>
                <div className="flex items-end gap-2 text-white">
                  <span className="text-xl font-bold uppercase">{detailedStats?.users?.total || 0}</span>
                  <span className="text-[10px] text-emerald-400 font-bold mb-1">Active</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Gain</p>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold text-white uppercase">+{detailedStats?.users?.monthlyChange || 0}</span>
                  <TrendingUp className="text-emerald-400 w-3 h-3 mb-1.5" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-white/40 uppercase tracking-widest font-bold">Growth Velocity</span>
                <span className="text-amber-400 font-bold">High Expansion</span>
              </div>
              <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Dynamic Performance Chart */}
          <div className="lg:col-span-2 glass-card p-8 group overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white">Performance Over Time</h3>
              <div className="flex gap-2">
                {['Day', 'Week', 'Month'].map((tag) => (
                  <button 
                    key={tag} 
                    onClick={() => setSelectedPeriod(tag)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedPeriod === tag ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-[300px] w-full relative">
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
                
                {/* Simplified dynamic path based on item values */}
                <motion.path 
                  key={`${items[0].value}-${selectedPeriod}`} // Force re-animation when listings or period change
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  d={`M 0 250 Q 150 ${200 - (parseInt(items[1].value) * 0.5)} 250 150 T 500 ${100 - (parseInt(items[0].value) * 0.2)} T 750 180 T 1000 50`} 
                  fill="none" 
                  stroke="#0d59f2" 
                  strokeWidth="4"
                  filter="url(#glow)"
                />
                
                <path 
                  d={`M 0 250 Q 150 ${200 - (parseInt(items[1].value) * 0.5)} 250 150 T 500 ${100 - (parseInt(items[0].value) * 0.2)} T 750 180 T 1000 50 L 1000 300 L 0 300 Z`} 
                  fill="url(#chartGradient)"
                />

                <motion.circle 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  cx="500" cy={100 - (parseInt(items[0].value) * 0.2)} r="10" 
                  fill="#0d59f2" 
                  className="opacity-20"
                />
                <circle cx="500" cy={100 - (parseInt(items[0].value) * 0.2)} r="4" fill="#fff" />
              </svg>

              {/* Tooltip Simulation */}
              <div className="absolute top-10 left-[48%] glass p-2 rounded-lg border border-primary/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                 <p className="text-[10px] font-bold text-white/40 uppercase">Peak Potential</p>
                 <p className="text-sm font-bold text-white">Listings: {items[0].value}</p>
              </div>
            </div>
          </div>

          {/* Dynamic Recent Activity */}
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white">Recent Activity</h3>
              <MoreHorizontal className="text-white/20 w-5 h-5 cursor-pointer hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {activities.length > 0 ? (
                  activities.map((item, idx) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-4 group/item"
                    >
                      <div className={`w-10 h-10 rounded-xl glass border border-white/10 flex items-center justify-center shrink-0 group-hover/item:border-primary/40 transition-colors`}>
                        <Car className="w-5 h-5 text-white/40 group-hover/item:text-white transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
                           <span className={item.color}>{item.action}</span> • {item.time}
                        </p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-white/10 group-hover/item:text-primary transition-all group-hover/item:translate-x-1 group-hover/item:-translate-y-1" />
                    </motion.div>
                  ))
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center text-white/10 italic text-sm">
                    <Clock className="w-8 h-8 mb-2 opacity-10" />
                    No recent activities
                  </div>
                )}
              </AnimatePresence>
            </div>
            
            <button 
              onClick={() => window.location.href = '/booking'}
              className="w-full mt-8 py-3 rounded-xl border border-white/5 text-white/40 text-sm font-bold hover:bg-white/5 hover:text-white transition-all hover:border-white/10"
            >
              View All History
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}