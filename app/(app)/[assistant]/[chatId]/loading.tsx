import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-4">
        <Skeleton className="ml-auto h-11 w-2/5 rounded-lg" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/5" />
        </div>
        <Skeleton className="ml-auto h-11 w-1/3 rounded-lg" />
      </div>
      <div className="mx-auto w-full max-w-3xl p-4 pt-0">
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    </div>
  );
}
