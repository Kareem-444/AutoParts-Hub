"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Skeleton */}
      <Skeleton className="w-64 h-5 mb-8" />

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Left Side: Images */}
        <div className="w-full md:w-1/2 shrink-0">
          <Skeleton className="w-full aspect-[4/3] rounded-2xl mb-4" />
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="w-20 h-20 rounded-lg shrink-0" />
            ))}
          </div>
        </div>

        {/* Right Side: Info Core */}
        <div className="w-full md:w-1/2 flex flex-col">
          <div className="mb-6">
             <Skeleton className="w-24 h-6 rounded-full mb-3" />
             <Skeleton className="w-full h-10 mb-2" />
             <Skeleton className="w-3/4 h-10 mb-4" />
             <div className="flex items-center gap-4 mt-4">
               <Skeleton className="w-32 h-5" />
               <Skeleton className="w-16 h-5" />
             </div>
          </div>

          <div className="mb-8">
            <Skeleton className="w-32 h-10 mb-2" />
            <Skeleton className="w-24 h-4" />
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="w-32 h-5" />
                <Skeleton className="w-48 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="w-24 h-5" />
                <Skeleton className="w-32 h-4" />
              </div>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-14 w-full sm:w-32 rounded-xl" />
              <Skeleton className="h-14 flex-1 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs / Review Skeleton */}
      <div className="mt-16 border-t border-border pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <Skeleton className="w-48 h-8 mb-6" />
            <div className="space-y-4">
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-5/6 h-4" />
            </div>
          </div>
          <div>
            <Skeleton className="w-48 h-8 mb-6" />
            <Skeleton className="w-full h-40 rounded-xl mb-6" />
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="border-b border-border pb-4">
                  <div className="flex justify-between mb-2">
                    <Skeleton className="w-32 h-5" />
                    <Skeleton className="w-16 h-4" />
                  </div>
                  <Skeleton className="w-24 h-4 mb-2" />
                  <Skeleton className="w-full h-4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
