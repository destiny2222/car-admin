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
  Loader2,
  Search,
  Filter,
  ChevronDown,
  RefreshCcw,
  MapPin, 
  Fuel, 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Listing {
  id: string;
  userId: string;
  make: string;
  model: string;
  type: string;
  year: string;
  status: string;
  description: string;
  pickupArea: string;
  pickupLga: string;
  seat: string;
  availability: boolean;
  availableDates: string[];
  unavailableDates: string[];
  transmission: string;
  gasType: string;
  frontView: string;
  backView: string;
  sideView: string;
  dashboardView: string;
  interiorView: string;
  exteriorFeature: string[];
  interiorFeature: string[];
  millage: string;
  insuranceDoc: string;
  registrationDoc: string;
  customDutyDoc: string;
  ownershipDoc: string;
  rent: number;
  cautionFee: number;
  threeDaysDiscount: number;
  monthDiscount: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
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
  const [activeImage, setActiveImage] = useState<string | null>(null);

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
  }, [page, statusFilter, searchTerm, router]);

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



  const filteredCars = listings.filter(car => {
    const matchesSearch = searchTerm === "" ||
                          car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          car.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || car.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardShell>
      <div className="space-y-8 pt-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Luxury Fleet</h1>
            <p className="text-slate-500 text-sm sm:text-base">Manage and monitor your high-end vehicle inventory.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-3 sm:px-4 py-2 border border-slate-200/80 bg-white rounded-xl flex items-center gap-2 shadow-sm">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-slate-400">Inventory Live</span>
             </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 sm:p-6 bg-white border border-slate-200/50 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search by car name, make, or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/30 transition-all font-medium"
              />
            </div>
            <div className="flex gap-4">
              <div className="relative min-w-[140px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/30 transition-all appearance-none cursor-pointer font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PENDING">Pending</option>
                  <option value="DECLINED">Declined</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <button
                onClick={fetchListings}
                className="p-2.5 bg-primary hover:bg-primary-light text-white rounded-xl transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
              >
                <RefreshCcw className={cn("w-5 h-5", isLoading && "animate-spin")} />
              </button>
            </div>
          </div>
        </div>

        {/* Car Table */}
        <div className="glass-card overflow-hidden bg-white border border-slate-200/50 shadow-sm">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vehicle</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model & Make</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price/Day</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(5)].map((_, j) => (
                        <td key={j} className="px-6 py-6">
                          <div className="h-4 bg-slate-100 rounded-lg w-full opacity-50" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredCars.length > 0 ? (
                  filteredCars.map((car) => (
                    <motion.tr
                      key={car.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200/50 group-hover:border-primary/20 transition-colors">
                            <Image
                              src={car.frontView || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=200"}
                              alt={`${car.make} ${car.model}`}
                              width={48}
                              height={48}
                              className="object-cover rounded-lg w-full h-full"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{car.make}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{car.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-600">{car.model}</p>
                        <p className="text-[10px] text-slate-400">{car.gasType} • {car.transmission}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">₦{car.rent?.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold tracking-wider",
                          car.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          car.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          'bg-red-50 text-red-600 border border-red-100'
                        )}>
                          {car.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedCar(car);
                            setIsModalOpen(true);
                          }}
                          className="px-4 py-2 bg-slate-100 hover:bg-primary hover:text-white text-slate-600 text-xs font-bold rounded-lg transition-all"
                        >
                          Details
                        </button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                      No vehicles found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
            <p>Showing {filteredCars.length} of {totalListings} vehicles</p>
            <div className="flex gap-2 w-full sm:w-auto">
               <button
                 onClick={() => setPage(p => Math.max(1, p - 1))}
                 disabled={page === 1}
                 className="flex-1 sm:flex-initial px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
               >
                 Previous
               </button>
               <button
                 onClick={() => setPage(p => p + 1)}
                 disabled={page * 10 >= totalListings}
                 className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-primary text-white font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
               >
                 Next
               </button>
            </div>
          </div>
        </div>

        {/* --- Car Details Modal --- */}
        <AnimatePresence>
          {isModalOpen && selectedCar && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            >
              <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl relative border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* Left Column: Image and Gallery */}
                  <div className="lg:col-span-7 space-y-8">
                    {/* Hero Image */}
                    <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 group">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeImage}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0"
                        >
                          <Image 
                            src={activeImage || selectedCar.frontView || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200"} 
                            alt={selectedCar.make}
                            fill
                            className="object-cover"
                          />
                        </motion.div>
                      </AnimatePresence>
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent pointer-events-none" />
                      <div className="absolute bottom-6 left-6">
                         <span className="px-3 py-1 rounded-full bg-white/20 border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
                           {activeImage === selectedCar.frontView ? 'Front View' : 
                            activeImage === selectedCar.backView ? 'Back View' :
                            activeImage === selectedCar.sideView ? 'Side View' :
                            activeImage === selectedCar.dashboardView ? 'Dashboard' : 'Interior'}
                         </span>
                      </div>
                    </div>

                    {/* Image Gallery Grid */}
                    <div className="grid grid-cols-5 gap-4">
                      {[selectedCar.frontView, selectedCar.backView, selectedCar.sideView, selectedCar.dashboardView, selectedCar.interiorView].map((view, i) => (
                        <div 
                          key={i} 
                          onClick={() => setActiveImage(view)}
                          className={`relative aspect-square rounded-xl overflow-hidden bg-slate-50 border transition-all cursor-pointer group ${
                            activeImage === view ? 'border-primary ring-2 ring-primary/10' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                           <Image 
                              src={view || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=400"} 
                              alt={`View ${i + 1}`}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                           />
                        </div>
                      ))}
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">About this Vehicle</h4>
                      <p className="text-slate-600 leading-relaxed text-lg">
                        {selectedCar.description || `Experience the ultimate driving thrill with this exquisite ${selectedCar.make} ${selectedCar.model}.`}
                      </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                           Exterior Features
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedCar.exteriorFeature?.length > 0 ? selectedCar.exteriorFeature.map((feat, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
                              {feat}
                            </span>
                          )) : <span className="text-slate-300 italic text-xs">No exterior features listed</span>}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                           Interior Features
                        </h4>
                        <div className="flex flex-wrap gap-2">
                         {selectedCar.interiorFeature?.length > 0 ? selectedCar.interiorFeature.map((feat, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
                              {feat}
                            </span>
                          )) : <span className="text-slate-300 italic text-xs">No interior features listed</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Info & Actions */}
                  <div className="lg:col-span-5 space-y-8">
                     <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-6">
                        <div className="flex justify-between items-start">
                           <div>
                              <h2 className="text-3xl font-extrabold text-slate-900">{selectedCar.make} {selectedCar.model}</h2>
                              <p className="text-slate-500 text-xs uppercase tracking-widest font-bold mt-1">
                                 {selectedCar.year} • {selectedCar.type}
                              </p>
                           </div>
                           <span className={cn(
                             "px-3 py-1 rounded-full text-[10px] font-bold tracking-wider",
                             selectedCar.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                             selectedCar.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                             'bg-red-50 text-red-600 border border-red-100'
                           )}>
                             {selectedCar.status}
                           </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                              <MapPin className="w-5 h-5 text-primary mb-2" />
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Location</p>
                              <p className="text-slate-900 text-sm font-bold">{selectedCar.pickupArea}</p>
                           </div>
                           <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                              <Activity className="w-5 h-5 text-emerald-500 mb-2" />
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Mileage</p>
                              <p className="text-slate-900 text-sm font-bold">{selectedCar.millage || '0 Km'}</p>
                           </div>
                           <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                              <Fuel className="w-5 h-5 text-amber-500 mb-2" />
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Fuel</p>
                              <p className="text-slate-900 text-sm font-bold">{selectedCar.gasType}</p>
                           </div>
                           <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                              <Users className="w-5 h-5 text-blue-500 mb-2" />
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Seats</p>
                              <p className="text-slate-900 text-sm font-bold">{selectedCar.seat}</p>
                           </div>
                        </div>

                        <div className="p-6 bg-slate-900 rounded-2xl text-white">
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Daily Rate</p>
                           <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-black italic">₦{selectedCar.rent?.toLocaleString()}</span>
                              <span className="text-slate-400 text-sm">/ day</span>
                           </div>
                        </div>
                     </div>

                     <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Owner Information</h4>
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                              {selectedCar.user?.firstName?.[0]}{selectedCar.user?.lastName?.[0]}
                           </div>
                           <div>
                              <p className="font-bold text-slate-900">{selectedCar.user?.firstName} {selectedCar.user?.lastName}</p>
                              <p className="text-xs text-slate-500">{selectedCar.user?.email}</p>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-end gap-4">
                   <button 
                     onClick={() => setIsModalOpen(false)}
                     className="px-8 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all"
                   >
                     Close
                   </button>
                   {selectedCar.status === 'PENDING' && (
                     <div className="flex gap-3">
                        <button 
                           onClick={() => {
                              handleStatusUpdate(selectedCar.id, "approved");
                              setIsModalOpen(false);
                           }}
                           className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-lg shadow-emerald-600/20"
                        >
                           Approve
                        </button>
                        <button 
                           onClick={() => {
                              handleStatusUpdate(selectedCar.id, "declined");
                              setIsModalOpen(false);
                           }}
                           className="px-8 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-lg shadow-red-600/20"
                        >
                           Reject
                        </button>
                     </div>
                   )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </DashboardShell>
);
}
