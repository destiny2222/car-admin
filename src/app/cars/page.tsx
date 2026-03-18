"use client";

import { DashboardShell } from "@/components/DashboardShell";
import { useRouter } from "next/navigation";
import { 
  Eye,
  Check,
  X,
  Activity,
  Users,
  AlertCircle,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { 
  MapPin, 
  Calendar, 
  Fuel, 
  ShieldCheck,
  CircleDollarSign
} from "lucide-react";

interface Listing {
  id: string;
  make: string;
  model: string;
  type: string;
  status: string;
  frontView: string;
  pickupArea: string;
  pickupLga: string;
  description?: string;
  year?: string;
  seat?: string;
  transmission?: string;
  gasType?: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
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

export default function CarsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalListings, setTotalListings] = useState(0);
  
  // Modal & Action State
  const [selectedCar, setSelectedCar] = useState<Listing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
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
      const response = await fetch(`/api/admin/listings?${queryParams.toString()}`, {
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
        throw new Error("Failed to fetch listings.");
      }

      const data = await response.json();
      // console.log("Car Listings", data);
      
      if (data.status && data.data) {
        const items = data.data.data || [];
        setListings(items);
        setTotalListings(data.data.pagination?.total || items.length);
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

  const handleStatusUpdate = async (id: string, newStatus: "approved" | "declined") => {
    let reason = "";
    if (newStatus === "declined") {
      reason = window.prompt("Please enter a reason for declining this listing:") || "";
      if (!reason) return; 
    }
    
    setUpdatingStatusId(`${id}-${newStatus}`);
    
    try {
      // Use local API route
      const response = await fetch(`/api/admin/listings/status?listingId=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus, ...(reason && { reason }) }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to ${newStatus} listing.`);
      }

      const data = await response.json();
      if (data.status || data.success) {
        setListings(prev => prev.map(listing => 
          (listing.id === id) ? { ...listing, status: newStatus.toUpperCase() } : listing
        ));
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred while updating status.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchListings();
    }, 500); 
    return () => clearTimeout(timer);
  }, [fetchListings]);

  return (
    <DashboardShell>
      <div className="space-y-8 pt-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">Fleet Management</h1>
            <p className="text-white/40 text-sm sm:text-base">Manage your car listings and document compliance.</p>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="glass-card p-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          <div className="flex-1">
            <input 
              type="text" 
              placeholder="Search listings..."
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
              className="w-full sm:w-auto glass px-6 py-3 rounded-xl text-sm text-white/60 focus:outline-none focus:text-white appearance-none cursor-pointer text-center sm:text-left [&>option]:bg-[#1a1c20] [&>option]:text-white"
            >
               <option value="all" className="bg-[#1a1c20] text-white">All Status</option>
               <option value="pending" className="bg-[#1a1c20] text-white">Pending</option>
               <option value="approved" className="bg-[#1a1c20] text-white">Approved</option>
               <option value="declined" className="bg-[#1a1c20] text-white">Declined</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
             <AlertCircle className="w-5 h-5" />
             <p>{error}</p>
          </div>
        )}

        {/* Cars Table */}
        <div className="glass-card overflow-hidden relative w-full">
           <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded w-full">
           {isLoading && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
               <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <table className="w-full border-collapse text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/1">
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold">Vehicle Details</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold">Owner</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold">Location</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold">Status</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {listings.map((car, index) => (
                <motion.tr 
                  key={car.id || index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group hover:bg-white/2 transition-all"
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden glass border border-white/10 p-1 group-hover:scale-105 transition-transform">
                        <Image 
                          src={car.frontView || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=200"} 
                          alt={`${car.make} ${car.model}`}
                          width={56} 
                          height={56} 
                          className="object-cover rounded-lg w-full h-full" 
                        />
                      </div>
                      <div>
                        <p className="font-bold text-white group-hover:text-primary transition-colors capitalize">
                          {car.make} {car.model}
                        </p>
                        <p className="text-[10px] text-white/20 uppercase tracking-widest mt-0.5">{car.type || "Luxury Fleet"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-white/80">
                       {car.user?.firstName || "Unknown"} {car.user?.lastName || ""}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                       <span className="text-sm text-white/60">{car.pickupArea}, {car.pickupLga}</span>
                    </div>
                  </td>
                   <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                         car.status === 'APPROVED' ? 'bg-emerald-400/10 text-emerald-400' : 
                         car.status === 'PENDING' ? 'bg-amber-400/10 text-amber-400' :
                         'bg-red-400/10 text-red-400'
                       }`}>
                         {car.status || 'Unknown'}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {car.status === 'PENDING' && (
                        <>
                          <button 
                            onClick={() => handleStatusUpdate(car.id || "", "approved")}
                            disabled={updatingStatusId === car.id}
                            className="p-2.5 rounded-xl cursor-pointer glass text-emerald-400 hover:bg-emerald-400/10 transition-all group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Approve"
                          >
                            {updatingStatusId === `${car.id}-approved` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(car.id || "", "declined")}
                            disabled={updatingStatusId === car.id}
                            className="p-2.5 rounded-xl cursor-pointer glass text-red-400 hover:bg-red-400/10 transition-all group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Decline"
                          >
                            {updatingStatusId === `${car.id}-declined` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => {
                          setSelectedCar(car);
                          setIsModalOpen(true);
                        }}
                        className="p-2.5 rounded-xl cursor-pointer glass hover:text-primary transition-all group/btn"
                      >
                        <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                      {/* <div className="relative" ref={activeActionId === car.id ? dropdownRef : null}>
                        <button 
                          onClick={() => setActiveActionId(activeActionId === car.id ? null : car.id)}
                          className={`p-2.5 rounded-xl cursor-pointer glass hover:text-white transition-all ${activeActionId === car.id ? 'bg-white/10 text-white' : ''}`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {activeActionId === car.id && (
                          <div className="absolute right-0 mt-2 w-48 glass-card border border-white/10 py-2 z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                             <button className="w-full px-4 py-2.5 text-left text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-all">
                               <Edit className="w-3.5 h-3.5 cursor-pointer" />
                               Edit Listing
                             </button>
                             <button className="w-full px-4 py-2.5 text-left text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-all">
                               <Clipboard className="w-3.5 h-3.5 cursor-pointer" />
                               View Documents
                             </button>
                             <div className="h-px bg-white/5 my-1" />
                             <button className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-400 hover:bg-red-400/10 flex items-center gap-3 transition-all">
                               <Trash2 className="w-3.5 h-3.5 cursor-pointer" />
                               Delete Listing
                             </button>
                          </div>
                        )}
                      </div> */}
                    </div>
                  </td>
                </motion.tr>
              ))}
              {listings.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-white/20">
                    No listings found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
           </div>
          
          <div className="p-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-white/40 text-sm">
            <p>Showing {listings.length} of {totalListings} vehicles</p>
            <div className="flex gap-2 w-full sm:w-auto">
               <button 
                 onClick={() => setPage(p => Math.max(1, p - 1))}
                 disabled={page === 1}
                 className="flex-1 sm:flex-initial px-4 py-2 rounded-lg cursor-pointer glass hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
               >
                 Previous
               </button>
               <button 
                 onClick={() => setPage(p => p + 1)}
                 className="flex-1 sm:flex-initial px-4 py-2 rounded-lg cursor-pointer bg-primary text-white font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
               >
                 Next
               </button>
            </div>
          </div>
        </div>

        {/* --- Car Details Modal --- */}
        <AnimatePresence>
          {isModalOpen && selectedCar && (
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
                {/* Header with Image */}
                <div className="h-56 sm:h-50 relative">
                  <Image 
                    src={selectedCar.frontView || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200"} 
                    alt={selectedCar.make}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-6 cursor-pointer right-6 p-2 rounded-full glass hover:bg-white/20 text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-6 left-8 right-8">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                           <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
                             {selectedCar.type || 'Luxury'}
                           </span>
                           <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                             selectedCar.status === 'APPROVED' ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/20' : 
                             selectedCar.status === 'PENDING' ? 'bg-amber-400/20 text-amber-400 border border-amber-400/20' :
                             'bg-red-400/20 text-red-400 border border-red-400/20'
                           }`}>
                             {selectedCar.status}
                           </span>
                        </div>
                        <h2 className="text-4xl font-bold text-white capitalize">{selectedCar.make} {selectedCar.model}</h2>
                        <div className="flex items-center gap-4 mt-2 text-white/60">
                           <div className="flex items-center gap-1.5 text-sm">
                             <MapPin className="w-4 h-4" />
                             {selectedCar.pickupArea}, {selectedCar.pickupLga}
                           </div>
                           <div className="flex items-center gap-1.5 text-sm">
                             <Calendar className="w-4 h-4" />
                             Year: {selectedCar.year || '2022'}
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  <div className="lg:col-span-2 space-y-8">
                    <div>
                      <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Vehicle Description</h4>
                      <p className="text-white/70 leading-relaxed text-lg italic">
                        &quot;{selectedCar.description || `Experience the ultimate driving thrill with this exquisite ${selectedCar.make} ${selectedCar.model}. Perfectly maintained and ready for your next adventure.`}&quot;
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                      <div className="glass p-4 rounded-2xl">
                        <Fuel className="w-5 h-5 text-primary mb-2" />
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Gas Type</p>
                        <p className="text-white font-bold">{selectedCar.gasType || 'Petrol'}</p>
                      </div>
                      <div className="glass p-4 rounded-2xl">
                        <Activity className="w-5 h-5 text-emerald-400 mb-2" />
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Transmission</p>
                        <p className="text-white font-bold">{selectedCar.transmission || 'Automatic'}</p>
                      </div>
                      <div className="glass p-4 rounded-2xl">
                        <Users className="w-5 h-5 text-amber-400 mb-2" />
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Seats</p>
                        <p className="text-white font-bold">{selectedCar.seat || '5'} Seater</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="glass-card p-6 border border-white/5">
                      <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-6">Owner Information</h4>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full border-2 border-primary/20 p-0.5">
                           <div className="w-full h-full rounded-full bg-primary flex items-center justify-center text-white font-bold italic">
                             {selectedCar.user?.firstName?.[0]}{selectedCar.user?.lastName?.[0]}
                           </div>
                        </div>
                        <div>
                          <p className="font-bold text-white">{selectedCar.user?.firstName} {selectedCar.user?.lastName}</p>
                          <p className="text-xs text-white/40">{selectedCar.user?.email}</p>
                        </div>
                      </div>
                      {/* <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all border border-white/5">
                        View Owner Profile
                      </button> */}
                    </div>

                    <div className="glass-card p-6 border border-emerald-400/10 bg-emerald-400/5">
                       <div className="flex items-center gap-2 text-emerald-400 mb-2">
                         <ShieldCheck className="w-4 h-4" />
                         <span className="text-[10px] font-bold uppercase tracking-widest">Verification Status</span>
                       </div>
                       <p className="text-xs text-white/60 leading-relaxed">
                         This vehicle has passed all system compliance checks.
                       </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                         <CircleDollarSign className="w-5 h-5 text-emerald-400" />
                         <div>
                            <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest leading-none">Price Rate</p>
                            <p className="text-white font-bold">₦45,000 / day</p>
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-6 py-3 rounded-xl glass cursor-pointer hover:bg-white/5 text-white/60 font-bold transition-all"
                      >
                        Cancel
                      </button>
                      {/* <button className="bg-primary hover:bg-primary-light text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
                        Edit Full Listing
                        <ChevronRight className="w-4 h-4" />
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
