"use client";

import { DashboardShell } from "@/components/DashboardShell";
import { useRouter } from "next/navigation";
import { 
  User,
  Car,
  AlertCircle,
  Hash,
  Calendar,
  Eye,
  X,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Search,
  Filter,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Booking {
  id: string;
  listingId: string;
  rentalUserId: string;
  listingUserId: string;
  pickupDate: string;
  returnDate: string;
  pickupTime: string;
  returnTime: string;
  status: string;
  pickupArea: string;
  dropoffArea: string;
  duration: string;
  reason: string | null;
  serviceCharge: string;
  cautionFee: string;
  totalAmount: string;
  paidAmount: string;
  balanceAmount: string;
  additionalInfo: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  reference?: string;
  transactionRef?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  listing?: {
    make: string;
    model: string;
    frontView?: string;
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

export default function BookingPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);

  // Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      // Get auth token
      const token = getAuthToken();
      const authHeaders: HeadersInit = token ? { "Authorization": `Bearer ${token}` } : {};

      // Use local API route
      const response = await fetch(`/api/admin/bookings?${queryParams.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/');
          return;
        }
        throw new Error("Failed to fetch bookings.");
      }

      const data = await response.json();
      console.log("Bookings Data", data);
      
      if (data.status && data.data) {
        const items = data.data.data || [];
        setBookings(items);
        setTotalBookings(data.data.pagination?.total || items.length);
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
  }, [page, statusFilter, searchTerm, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBookings();
    }, 500); 
    return () => clearTimeout(timer);
  }, [fetchBookings]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <DashboardShell>
      <div className="space-y-8 pt-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Booking Management</h1>
            <p className="text-slate-500 font-medium">Track and manage active rentals and transaction history.</p>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600/20 transition-all font-medium"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
             <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select 
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full sm:w-auto bg-white border border-slate-200 px-10 py-3 rounded-xl text-sm text-slate-600 font-bold focus:outline-none 
                  focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600/20 appearance-none cursor-pointer"
                >
                   <option value="all">All Status</option>
                   <option value="pending">Pending</option>
                   <option value="in_progress">In Progress</option>
                   <option value="completed">Completed</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
             </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-3">
             <AlertCircle className="w-5 h-5" />
             <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Bookings Table */}
        <div className="bg-white rounded-3xl border border-slate-200/50 shadow-sm overflow-hidden relative w-full">
           <div className="overflow-x-auto w-full">
           {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
               <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <table className="w-full border-collapse text-left min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-slate-400 font-black">Booking ID</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest text-slate-400 font-black">Location</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest text-slate-400 font-black">Duration</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest text-slate-400 font-black">Period</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest text-slate-400 font-black">Status</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest text-slate-400 font-black text-right">Total</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-slate-400 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((booking, index) => (
                <motion.tr 
                  key={booking.id || index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group hover:bg-slate-50 transition-all"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-blue-600 transition-colors">
                        <Hash className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 text-[10px] uppercase tracking-wider line-clamp-1 w-24">{booking.id}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">{formatDate(booking.createdAt)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-slate-700">
                      {booking.pickupArea}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-slate-600">
                      {booking.duration.split(" day(s)")[0]} Days
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold whitespace-nowrap">
                       <Calendar className="w-3.5 h-3.5 text-blue-500" />
                       <span>{formatDate(booking.pickupDate)} - {formatDate(booking.returnDate)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border",
                      (booking.status === 'COMPLETED' || booking.status === 'PAID') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      (booking.status === 'PENDING' || booking.status === 'RETURN_REQUESTED') ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      booking.status === 'UNPAID' ? 'bg-red-50 text-red-600 border-red-100' :
                      'bg-slate-50 text-slate-500 border-slate-100'
                    )}>
                      {booking.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <p className="text-sm font-black text-slate-900 italic">
                      ₦{parseFloat(booking.totalAmount).toLocaleString()}
                    </p>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => {
                        setSelectedBooking(booking);
                        setIsModalOpen(true);
                      }}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all group/btn"
                    >
                      <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </td>
                </motion.tr>
              ))}
              {bookings.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center text-white/20">
                    No bookings found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
           </div>
          
          <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-sm font-medium">
            <p>Showing <span className="text-slate-900 font-bold">{bookings.length}</span> of <span className="text-slate-900 font-bold">{totalBookings}</span> records</p>
            <div className="flex gap-2 w-full sm:w-auto">
               <button 
                 onClick={() => setPage(p => Math.max(1, p - 1))}
                 disabled={page === 1}
                 className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
               >
                 Previous
               </button>
               <button 
                 onClick={() => setPage(p => p + 1)}
                 disabled={bookings.length < 10}
                 className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-blue-600 text-white font-black transition-all hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-blue-600/10"
               >
                 Next
               </button>
            </div>
          </div>
        </div>
        {/* --- Booking Details Modal --- */}
        <AnimatePresence>
          {isModalOpen && selectedBooking && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-5xl h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col"
              >
                {/* Close Button */}
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all z-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Main Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                       {/* Left Column: Car Info and Timeline */}
                    <div className="lg:col-span-7 space-y-8">
                      {/* Car Hero Section */}
                      <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 group">
                        {selectedBooking.listing?.frontView ? (
                          <Image 
                            src={selectedBooking.listing.frontView} 
                            alt={selectedBooking.listing.make}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                            <Car className="w-20 h-20 text-slate-200" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 to-transparent" />
                        <div className="absolute bottom-8 left-8">
                           <div className="flex items-center gap-3 mb-2">
                             <span className={cn(
                               "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                               (selectedBooking.status === 'COMPLETED' || selectedBooking.status === 'PAID') ? 'bg-emerald-500 text-white' : 
                               (selectedBooking.status === 'PENDING' || selectedBooking.status === 'RETURN_REQUESTED') ? 'bg-amber-500 text-white' :
                               selectedBooking.status === 'UNPAID' ? 'bg-red-500 text-white' :
                               'bg-slate-500 text-white'
                             )}>
                               {selectedBooking.status.replace("_", " ")}
                             </span>
                           </div>
                           <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                             {selectedBooking.listing?.make} {selectedBooking.listing?.model}
                           </h2>
                        </div>
                      </div>

                      {/* Rental Journey */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4 shadow-xs">
                           <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-600">
                                 <Calendar className="w-5 h-5" />
                              </div>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Collection</h4>
                           </div>
                           <div className="space-y-1">
                              <p className="text-2xl font-black text-slate-900 tracking-tighter">{formatDate(selectedBooking.pickupDate)}</p>
                              <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                                <Clock className="w-4 h-4 text-blue-500" />
                                {selectedBooking.pickupTime}
                              </div>
                           </div>
                           <div className="pt-4 border-t border-slate-200 flex items-start gap-3">
                              <MapPin className="w-4 h-4 text-blue-600 mt-0.5" />
                              <div>
                                 <p className="text-sm font-black text-slate-800 tracking-tight">{selectedBooking.pickupArea}</p>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Base Location</p>
                              </div>
                           </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4 shadow-xs">
                           <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-600">
                                 <Calendar className="w-5 h-5" />
                              </div>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Return</h4>
                           </div>
                           <div className="space-y-1">
                              <p className="text-2xl font-black text-slate-900 tracking-tighter">{formatDate(selectedBooking.returnDate)}</p>
                              <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                                <Clock className="w-4 h-4 text-emerald-600" />
                                {selectedBooking.returnTime}
                              </div>
                           </div>
                           <div className="pt-4 border-t border-slate-200 flex items-start gap-3">
                              <MapPin className="w-4 h-4 text-emerald-600 mt-0.5" />
                              <div>
                                 <p className="text-sm font-black text-slate-800 tracking-tight">{selectedBooking.dropoffArea}</p>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Drop-off Zone</p>
                              </div>
                           </div>
                        </div>
                      </div>

                      {/* Rental Content & Additional Info */}
                      {(selectedBooking.reason || selectedBooking.additionalInfo) && (
                        <div className="space-y-6">
                           {selectedBooking.reason && (
                             <div className="space-y-3">
                               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Purpose of Rental</h4>
                               <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 italic">
                                 <p className="text-slate-600 leading-relaxed font-medium">&quot;{selectedBooking.reason}&quot;</p>
                               </div>
                             </div>
                           )}
                        </div>
                      )}

                      {/* Booking Metadata */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                         <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center shadow-xs">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                            <p className="text-slate-900 font-black">{selectedBooking.duration.split(" day(s)")[0]} Days</p>
                         </div>
                         <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center shadow-xs">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Created</p>
                            <p className="text-slate-900 font-bold text-xs">{formatDate(selectedBooking.createdAt)}</p>
                         </div>
                         <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center shadow-xs">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Update</p>
                            <p className="text-slate-900 font-bold text-xs">{formatDate(selectedBooking.updatedAt)}</p>
                         </div>
                         <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center shadow-xs">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Hash</p>
                            <p className="text-slate-900 font-black text-[10px] uppercase tracking-wider">{selectedBooking.id.slice(0, 8)}</p>
                         </div>
                      </div>
                    </div>

                    {/* Right Column: Financials & Customer */}
                    <div className="lg:col-span-5 space-y-8">
                       {/* Price Card */}
                       <div className="bg-slate-900 p-8 rounded-4xl text-white shadow-2xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[80px] group-hover:bg-primary/30 transition-all" />
                          <div className="relative space-y-8">
                             <div className="flex justify-between items-center pb-6 border-b border-white/10">
                                <div>
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Fee</p>
                                   <p className="text-4xl font-black italic tracking-tighter">₦{parseFloat(selectedBooking.totalAmount).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                   <span className={cn(
                                     "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap",
                                     selectedBooking.balanceAmount === "0.00" ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                                   )}>
                                      {selectedBooking.balanceAmount === "0.00" ? 'Fully Paid' : 'Payment Due'}
                                   </span>
                                </div>
                             </div>

                             <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                   <span className="text-slate-400 font-bold">Daily Rate</span>
                                   <span className="text-white font-black italic">₦{(parseFloat(selectedBooking.totalAmount) / parseInt(selectedBooking.duration)).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                   <span className="text-slate-400 font-bold">Service Charge</span>
                                   <span className="text-white font-black italic">₦{parseFloat(selectedBooking.serviceCharge).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                   <span className="text-slate-400 font-bold">Caution Fee</span>
                                   <span className="text-white font-black italic">₦{parseFloat(selectedBooking.cautionFee).toLocaleString()}</span>
                                </div>
                                
                                <div className="pt-6 mt-4 border-t border-white/10 space-y-4">
                                   <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                         <span className="text-slate-300 text-sm font-bold">Paid</span>
                                      </div>
                                      <span className="text-emerald-400 font-black italic">₦{parseFloat(selectedBooking.paidAmount).toLocaleString()}</span>
                                   </div>
                                   <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                         <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                         <span className="text-slate-300 text-sm font-bold">Remaining</span>
                                      </div>
                                      <span className="text-red-400 font-black italic">₦{parseFloat(selectedBooking.balanceAmount).toLocaleString()}</span>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>

                       {/* Verification Status */}
                       <div className="bg-emerald-50 p-8 rounded-4xl border border-emerald-100 space-y-6">
                           <div className="flex items-center gap-3 text-emerald-600 mb-2">
                             <div className="p-3 rounded-2xl bg-white shadow-sm">
                                <ShieldCheck className="w-6 h-6" />
                             </div>
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Secure Protocol</p>
                                <p className="text-sm font-black text-emerald-900 tracking-tight">Verified Transaction</p>
                             </div>
                           </div>
                           
                           <div className="space-y-4">
                              <div className="flex items-center gap-3 text-emerald-700/60 text-[10px] font-bold">
                                 <CheckCircle2 className="w-4 h-4" />
                                 <span className="tracking-tight line-clamp-1">REF: {selectedBooking.transactionRef || selectedBooking.id}</span>
                              </div>
                              <p className="text-[10px] text-emerald-600/60 leading-relaxed font-bold italic">
                                &quot;Transaction protected by luxury escrow system. Deposits are eligible for automatic release post-inspection.&quot;
                              </p>
                           </div>
                       </div>

                       {/* Customer Card */}
                       <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-black italic text-base">
                                {selectedBooking.user?.firstName?.[0]}{selectedBooking.user?.lastName?.[0]}
                             </div>
                             <div>
                                <p className="font-black text-slate-900 text-sm tracking-tight">{selectedBooking.user?.firstName} {selectedBooking.user?.lastName}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{selectedBooking.user?.email}</p>
                             </div>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xl">
                             <User className="w-5 h-5 text-slate-400" />
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
                 <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-4 mt-auto">
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="px-8 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm"
                    >
                      Close Window
                    </button>
                 </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
}
