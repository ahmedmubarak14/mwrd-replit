import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListNotifications, useMarkNotificationRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useListNotifications();
  const markReadMutation = useMarkNotificationRead();

  const handleMarkRead = (id: string) => {
    markReadMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        }
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Notifications</h1>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))
        ) : !notifications || notifications.length === 0 ? (
          <div className="text-center py-12 bg-card border border-card-border rounded-lg">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">You have no notifications.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={cn(
                "p-4 rounded-lg border flex items-start justify-between transition-colors",
                notification.read_at ? "bg-card border-card-border opacity-70" : "bg-primary/5 border-primary/20"
              )}
            >
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{notification.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{notification.body}</p>
                <p className="text-xs text-muted-foreground/60 mt-2">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>
              {!notification.read_at && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleMarkRead(notification.id)}
                  data-testid={`button-mark-read-${notification.id}`}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
