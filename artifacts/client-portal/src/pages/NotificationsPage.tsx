import { 
  useListNotifications, 
  getListNotificationsQueryKey,
  useMarkNotificationRead 
} from "@workspace/api-client-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, BellOff, Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useListNotifications({}, {
    query: {
      queryKey: getListNotificationsQueryKey({}),
    }
  });

  const markRead = useMarkNotificationRead();

  const handleMarkRead = (id: string) => {
    markRead.mutate({ notificationId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({}) });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on your RFQs and Orders.</p>
        </div>
        <Bell className="h-6 w-6 text-muted-foreground" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="divide-y">
              {notifications?.notifications?.map((n) => (
                <div 
                  key={n.id} 
                  className={cn(
                    "p-4 flex items-start gap-4 transition-colors",
                    !n.read_at && "bg-primary/5"
                  )}
                  data-testid={`notification-item-${n.id}`}
                >
                  <div className="mt-1">
                    {!n.read_at ? (
                      <Circle className="h-3 w-3 fill-primary text-primary" />
                    ) : (
                      <Check className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={cn("text-sm", !n.read_at && "font-semibold")}>
                      {n.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!n.read_at && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleMarkRead(n.id)}
                      data-testid={`button-mark-read-${n.id}`}
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              ))}
              {(!notifications?.notifications || notifications.notifications.length === 0) && (
                <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <BellOff className="h-8 w-8 opacity-20" />
                  <p>All caught up! No new notifications.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
