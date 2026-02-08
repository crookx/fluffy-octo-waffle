import { BuyerPage } from "@/components/buyer/buyer-page";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <BuyerPage
      title="My Dashboard"
      description="Loading your activity overview..."
    >
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2"/>
                    <Skeleton className="h-4 w-3/4"/>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-12 w-full"/>
                    <Skeleton className="h-12 w-full"/>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2"/>
                    <Skeleton className="h-4 w-3/4"/>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Skeleton className="h-16 w-full"/>
                     <Skeleton className="h-16 w-full"/>
                </CardContent>
            </Card>
        </div>
    </BuyerPage>
  );
}
