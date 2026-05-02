import {
  useListNotifications,
  getListNotificationsQueryKey,
  useMarkNotificationRead,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell01, BellOff01, Check } from "@untitledui/icons";
import { useQueryClient } from "@tanstack/react-query";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useListNotifications();

  const markRead = useMarkNotificationRead();

  const handleMarkRead = (id: string) => {
    markRead.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      },
    });
  };

  const items = notifications ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Notifications</h1>
          <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Stay updated on your RFQs and orders</p>
        </div>
        <Bell01 className="h-5 w-5 text-[rgb(152,162,179)] mt-0.5" />
      </div>

      <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[rgb(228,231,236)]">
          <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Recent Activity</h2>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <BellOff01 className="h-8 w-8 text-[rgb(208,213,221)]" />
            <p className="text-sm text-[rgb(152,162,179)]">All caught up — no new notifications.</p>
          </div>
        ) : (
          <div className="divide-y divide-[rgb(242,244,247)]">
            {items.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors ${!n.read_at ? "bg-[rgb(255,249,247)]" : "hover:bg-[rgb(249,250,251)]"}`}
                data-testid={`notification-item-${n.id}`}
              >
                <div className="mt-1 shrink-0">
                  {!n.read_at ? (
                    <span className="block h-2 w-2 rounded-full bg-[rgb(255,109,67)]" />
                  ) : (
                    <Check className="h-3.5 w-3.5 text-[rgb(152,162,179)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read_at ? "font-semibold text-[rgb(16,24,40)]" : "text-[rgb(52,64,84)]"}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-xs text-[rgb(102,112,133)] mt-0.5">{n.body}</p>
                  )}
                  <p className="mt-0.5 text-xs text-[rgb(152,162,179)]">
                    {new Date(n.created_at).toLocaleString("en-SA", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                {!n.read_at && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    disabled={markRead.isPending}
                    className="shrink-0 text-xs font-medium text-[rgb(255,109,67)] hover:text-[rgb(205,56,22)] transition-colors disabled:opacity-50"
                    data-testid={`button-mark-read-${n.id}`}
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
