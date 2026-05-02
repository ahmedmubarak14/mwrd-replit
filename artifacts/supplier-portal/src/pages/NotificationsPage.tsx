import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListNotifications, useMarkNotificationRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { safeFromNow } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Bell01, Check } from "@untitledui/icons";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useListNotifications();
  const markReadMutation = useMarkNotificationRead();

  const handleMarkRead = (id: string) => {
    markReadMutation.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() }),
    });
  };

  const items = notifications ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Notifications</h1>
          <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Recent activity and platform alerts</p>
        </div>

        <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          {isLoading ? (
            <div className="p-5 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <Bell01 className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
              <p className="text-sm text-[rgb(152,162,179)]">You have no notifications.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[rgb(242,244,247)]">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={`flex items-start gap-3 px-5 py-4 hover:bg-[rgb(249,250,251)] transition-colors ${!n.read_at ? "bg-[rgb(255,250,247)]" : ""}`}
                  data-testid={`notification-${n.id}`}
                >
                  <div className="mt-0.5 h-7 w-7 rounded-full bg-[rgb(255,109,67)]/10 flex items-center justify-center shrink-0">
                    {!n.read_at ? (
                      <span className="h-2 w-2 rounded-full bg-[rgb(255,109,67)]" />
                    ) : (
                      <Check className="h-3.5 w-3.5 text-[rgb(152,162,179)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read_at ? "font-semibold text-[rgb(16,24,40)]" : "text-[rgb(52,64,84)]"}`}>
                      {n.title}
                    </p>
                    {n.body && <p className="text-xs text-[rgb(102,112,133)] mt-0.5">{n.body}</p>}
                    <p className="mt-1 text-xs text-[rgb(152,162,179)]">
                      {safeFromNow(n.created_at)}
                    </p>
                  </div>
                  {!n.read_at && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      disabled={markReadMutation.isPending}
                      className="text-xs font-medium text-[rgb(255,109,67)] hover:text-[rgb(205,56,22)] transition-colors disabled:opacity-50"
                      data-testid={`button-mark-read-${n.id}`}
                    >
                      Mark read
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
