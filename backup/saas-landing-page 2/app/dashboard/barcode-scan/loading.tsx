import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Skeleton className="h-9 w-24 mr-4" />
        <Skeleton className="h-8 w-48" />
      </div>

      <div className="w-full mb-6">
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="flex items-end gap-4 mb-6">
        <div className="flex-1">
          <Skeleton className="h-5 w-16 mb-1" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-20" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
