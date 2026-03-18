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
  CreditCard,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface Booking {
  id: string;
  reference: string;
  transactionRef: string;
  status: string;
  totalAmount: string;
  paidAmount?: string;
  balanceAmount?: string;
  serviceCharge?: string;
  cautionFee?: string;
  pickupDate: string;
  returnDate: string;
  pickupTime: string;
  returnTime: string;
  pickupArea: string;
  dropoffArea: string;
  duration: string;
  createdAt: string;
  user?: {
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
    //   console.log("Bookings Data", data);
      
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
  }, [page, statusFilter, searchTerm]);

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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Booking Management</h1>
            <p className="text-white/40">Track and manage active rentals and transaction history.</p>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="glass-card p-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          <div className="flex-1">
            <input 
              type="text" 
              placeholder="Search by reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/3 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
             <select 
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto glass px-6 py-3 rounded-xl text-sm text-white/60 focus:outline-none 
              focus:text-white appearance-none cursor-pointer text-center sm:text-left [&>option]:bg-[#1a1c20] [&>option]:text-white"
            >
               <option value="all" className="bg-[#1a1c20] text-white">All Status</option>
               <option value="pending" className="bg-[#1a1c20] text-white">Pending</option>
               <option value="in_progress" className="bg-[#1a1c20] text-white">In Progress</option>
               <option value="completed" className="bg-[#1a1c20] text-white">Completed</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
             <AlertCircle className="w-5 h-5" />
             <p>{error}</p>
          </div>
        )}

        {/* Bookings Table */}
        <div className="glass-card overflow-hidden relative w-full">
           <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded w-full">
           {isLoading && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
               <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <table className="w-full border-collapse text-left min-w-[1000px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/1">
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold">Booking ID</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold">Location</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold">Duration</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold">Period</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold">Status</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold text-right">Total Amount</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bookings.map((booking, index) => (
                <motion.tr 
                  key={booking.id || index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group hover:bg-white/2 transition-all"
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/5 group-hover:bg-primary/20 transition-colors">
                        <Hash className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-[10px] uppercase tracking-wider line-clamp-1 w-24">{booking.id}</p>
                        <p className="text-[9px] text-white/20 mt-0.5">Created: {formatDate(booking.createdAt)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-white/80">
                      {booking.pickupArea}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-white/60">
                      {booking.duration.split(" day(s)")[0]} Days
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[10px] text-white/40 whitespace-nowrap">
                       <Calendar className="w-3.5 h-3.5" />
                       <span>{formatDate(booking.pickupDate)} - {formatDate(booking.returnDate)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      (booking.status === 'COMPLETED' || booking.status === 'PAID') ? 'bg-emerald-400/10 text-emerald-400' : 
                      (booking.status === 'PENDING' || booking.status === 'RETURN_REQUESTED') ? 'bg-amber-400/10 text-amber-400' :
                      booking.status === 'UNPAID' ? 'bg-red-400/10 text-red-400' :
                      'bg-white/5 text-white/40'
                    }`}>
                      {booking.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-bold text-white">
                      ₦{parseFloat(booking.totalAmount).toLocaleString()}
                    </p>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <button 
                      onClick={() => {
                        setSelectedBooking(booking);
                        setIsModalOpen(true);
                      }}
                      className="p-2.5 rounded-xl cursor-pointer glass hover:text-primary transition-all group/btn"
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
          
          <div className="p-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-white/40 text-sm">
            <p>Showing {bookings.length} of {totalBookings} records</p>
            <div className="flex gap-2 w-full sm:w-auto">
               <button 
                 onClick={() => setPage(p => Math.max(1, p - 1))}
                 disabled={page === 1}
                 className="flex-1 sm:flex-initial px-4 py-2 rounded-lg glass hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
               >
                 Previous
               </button>
               <button 
                 onClick={() => setPage(p => p + 1)}
                 disabled={bookings.length < 10}
                 className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-primary text-white font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
               >
                 Next
               </button>
            </div>
          </div>
        </div>
        {/* --- Booking Details Modal --- */}
        <AnimatePresence>
          {isModalOpen && selectedBooking && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl glass-card overflow-hidden shadow-2xl border border-white/10"
              >
                {/* Header with Car Info */}
                <div className="h-48 sm:h-56 relative bg-white/5">
                  {selectedBooking.listing?.frontView ? (
                    <Image 
                      src={selectedBooking.listing.frontView} 
                      alt={selectedBooking.listing.make}
                      fill
                      className="object-cover opacity-40"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Car className="w-20 h-20 text-white/5" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-6 right-6 p-2 rounded-full glass hover:bg-white/20 text-white transition-all z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-6 left-8 right-8">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                             (selectedBooking.status === 'COMPLETED' || selectedBooking.status === 'PAID') ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/20' : 
                             (selectedBooking.status === 'PENDING' || selectedBooking.status === 'RETURN_REQUESTED') ? 'bg-amber-400/20 text-amber-400 border border-amber-400/20' :
                             'bg-red-400/20 text-red-400 border border-red-400/20'
                           }`}>
                             {selectedBooking.status.replace("_", " ")}
                           </span>
                           <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
                             Ref: {selectedBooking.reference || selectedBooking.id.slice(0, 8)}
                           </span>
                        </div>
                        <h2 className="text-3xl font-bold text-white uppercase italic tracking-tight">
                          {selectedBooking.listing?.make} {selectedBooking.listing?.model}
                        </h2>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Total Amount</p>
                         <p className="text-3xl font-black text-primary italic">₦{parseFloat(selectedBooking.totalAmount).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  <div className="lg:col-span-2 space-y-8">
                    {/* Rental Period */}
                    <div className="grid grid-cols-2 gap-4">
                       <div className="glass p-5 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3 mb-4">
                             <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <Calendar className="w-5 h-5" />
                             </div>
                             <p className="text-xs font-bold text-white uppercase tracking-widest">Pick-up</p>
                          </div>
                          <p className="text-xl font-bold text-white mb-1">{formatDate(selectedBooking.pickupDate)}</p>
                          <div className="flex items-center gap-2 text-white/40 text-sm">
                             <Clock className="w-4 h-4" />
                             {selectedBooking.pickupTime}
                          </div>
                          <div className="mt-4 flex items-center gap-2 text-white/60 text-sm">
                             <MapPin className="w-4 h-4 text-primary" />
                             {selectedBooking.pickupArea}
                          </div>
                       </div>
                       <div className="glass p-5 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3 mb-4">
                             <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <Calendar className="w-5 h-5" />
                             </div>
                             <p className="text-xs font-bold text-white uppercase tracking-widest">Drop-off</p>
                          </div>
                          <p className="text-xl font-bold text-white mb-1">{formatDate(selectedBooking.returnDate)}</p>
                          <div className="flex items-center gap-2 text-white/40 text-sm">
                             <Clock className="w-4 h-4" />
                             {selectedBooking.returnTime}
                          </div>
                          <div className="mt-4 flex items-center gap-2 text-white/60 text-sm">
                             <MapPin className="w-4 h-4 text-primary" />
                             {selectedBooking.dropoffArea}
                          </div>
                       </div>
                    </div>

                    {/* Financial Breakdown */}
                    <div>
                      <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5" />
                        Financial Summary
                      </h4>
                      <div className="glass-card divide-y divide-white/5 border border-white/5">
                         <div className="p-4 flex justify-between items-center">
                            <span className="text-white/60 text-sm">Service Charge</span>
                            <span className="text-white font-bold">₦{parseFloat(selectedBooking.serviceCharge || "0").toLocaleString()}</span>
                         </div>
                         <div className="p-4 flex justify-between items-center">
                            <span className="text-white/60 text-sm">Caution Fee (Refundable)</span>
                            <span className="text-white font-bold">₦{parseFloat(selectedBooking.cautionFee || "0").toLocaleString()}</span>
                         </div>
                         <div className="p-4 flex justify-between items-center bg-white/2">
                            <span className="text-primary font-bold text-sm">Total Paid</span>
                            <span className="text-emerald-400 font-bold text-lg">₦{parseFloat(selectedBooking.paidAmount || "0").toLocaleString()}</span>
                         </div>
                         <div className="p-4 flex justify-between items-center">
                            <span className="text-white/40 text-sm">Outstanding Balance</span>
                            <span className="text-red-400 font-bold">₦{parseFloat(selectedBooking.balanceAmount || "0").toLocaleString()}</span>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* User Info */}
                    {/* <div className="glass-card p-6 border border-white/5">
                      <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        Customer Details
                      </h4>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full border-2 border-primary/20 p-0.5">
                           <div className="w-full h-full rounded-full bg-primary flex items-center justify-center text-white font-bold italic">
                             {selectedBooking.user?.firstName?.[0]}{selectedBooking.user?.lastName?.[0]}
                           </div>
                        </div>
                        <div>
                          <p className="font-bold text-white">{selectedBooking.user?.firstName} {selectedBooking.user?.lastName}</p>
                          <p className="text-[10px] text-white/40 line-clamp-1">{selectedBooking.user?.email}</p>
                        </div>
                      </div>
                      <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest transition-all border border-white/5">
                        Contact Customer
                      </button>
                    </div> */}

                    {/* Verification & Compliance */}
                    <div className="glass-card p-6 border border-emerald-400/10 bg-emerald-400/5">
                       <div className="flex items-center gap-2 text-emerald-400 mb-3">
                         <ShieldCheck className="w-4 h-4" />
                         <span className="text-[10px] font-bold uppercase tracking-widest">Payment Verified</span>
                       </div>
                       <div className="flex items-center gap-2 text-white/60 text-xs mb-4">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Transaction: {selectedBooking.transactionRef || 'N/A'}
                       </div>
                       <p className="text-[10px] text-white/40 leading-relaxed italic">
                         &quot;The caution fee is held in escrow until the vehicle is safely returned and inspected.&quot;
                       </p>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Transaction secured</span>
                   </div>
                   <div className="flex gap-4">
                      <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-8 py-3 rounded-xl glass hover:bg-white/5 text-white/60 text-xs font-bold uppercase tracking-widest transition-all"
                      >
                        Close
                      </button>
                      {/* <button className="bg-primary hover:bg-primary-light text-white px-10 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-primary/20">
                        Manage Booking
                      </button> */}
                   </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
}
