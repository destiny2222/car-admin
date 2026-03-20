"use client";

import { Search, Bell, User, Menu } from "lucide-react";

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="fixed top-0 left-0 right-0 lg:left-64 h-20 glass-header z-40 px-4 sm:px-8 flex items-center justify-between shadow-sm shadow-slate-200/50">
      <div className="flex items-center gap-4 lg:gap-0">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-primary transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="w-48 sm:w-96 group hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search..."
              className="w-full bg-slate-100 border border-slate-200/50 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/30 transition-all font-medium"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <button className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">
          <Bell className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900">Alex Rivera</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Fleet Admin</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-secondary p-0.5">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
               <User className="text-slate-300 w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
