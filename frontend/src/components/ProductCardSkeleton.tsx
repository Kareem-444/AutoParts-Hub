export default function ProductCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden animate-pulse flex flex-col h-full shadow-sm">
      <div className="aspect-[4/3] bg-background-alt w-full"></div>
      <div className="p-4 flex flex-col flex-1">
        <div className="h-5 bg-background-alt rounded-md w-3/4 mb-2"></div>
        <div className="h-4 bg-background-alt rounded-md w-1/2 mb-4"></div>
        <div className="mt-auto flex justify-between items-center">
          <div className="h-6 bg-background-alt rounded-md w-1/4"></div>
          <div className="h-8 w-8 bg-background-alt rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
