"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export default function ProfileLoading() {
  return (
    <div className="bg-background min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cover Skeleton */}
        <Skeleton className="w-full h-48 md:h-64 rounded-xl mb-8" />
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Skeleton */}
          <div className="w-full md:w-1/4 shrink-0 -mt-24 relative z-10">
            <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <Skeleton className="w-32 h-32 rounded-full mb-4 border-4 border-surface" />
                <Skeleton className="w-3/4 h-6 mb-2" />
                <Skeleton className="w-1/2 h-4 mb-4" />
                <div className="mt-4 flex flex-col gap-2 w-full">
                  <Skeleton className="w-full h-8 rounded-full" />
                  <Skeleton className="w-full h-8 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="w-full md:w-3/4 space-y-8">
            <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
              <Skeleton className="w-1/3 h-6 mb-6" />
              <div className="space-y-4">
                <Skeleton className="w-full h-12" />
                <Skeleton className="w-full h-24" />
                <Skeleton className="w-1/4 h-10 mt-4" />
              </div>
            </div>
            
            <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
              <Skeleton className="w-1/3 h-6 mb-6" />
              <div className="space-y-4">
                <Skeleton className="w-full h-24" />
                <Skeleton className="w-full h-24" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
