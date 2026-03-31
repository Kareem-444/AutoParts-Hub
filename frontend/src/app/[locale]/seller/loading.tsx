"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export default function SellerLoading() {
  return (
    <div className="bg-background min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <Skeleton className="w-48 h-10 mb-2" />
            <Skeleton className="w-32 h-5" />
          </div>
          <Skeleton className="w-36 h-10 rounded-lg" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <Skeleton className="w-24 h-4 mb-2" />
                <Skeleton className="w-16 h-8" />
              </div>
              <Skeleton className="w-14 h-14 rounded-full shrink-0" />
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-border mb-6 flex gap-8">
          <Skeleton className="w-24 h-6 mb-4" />
          <Skeleton className="w-24 h-6 mb-4" />
        </div>

        {/* Products Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
              <Skeleton className="w-full aspect-[4/3]" />
              <div className="p-4 space-y-3">
                <Skeleton className="w-3/4 h-6" />
                <Skeleton className="w-1/2 h-4" />
                <div className="flex justify-between items-center py-2">
                  <Skeleton className="w-16 h-6" />
                  <Skeleton className="w-20 h-6 rounded-full" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="w-full h-8 rounded-lg" />
                  <Skeleton className="w-full h-8 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
