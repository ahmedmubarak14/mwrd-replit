import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  useListNotifications,
  getListNotificationsQueryKey,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Bell01,
  BellOff01,
  Check,
  File06,
  Truck01,
  ShieldTick,
  Inbox01,
  Tag01,
  CheckCircle,
} from "@untitledui/icons";
import { useQueryClient } from "@tanstack/react-query";

type Filter = "all" | "unread";

function notifMeta(type?: string): { Icon: React.ComponentType<any>; tone: string } {
  if (!type) return { Icon: Bell01, tone: "bg-[rgb(242,244,247)] text-[rgb(102,112,133)]" };
  if (type.startsWith("quote_")) return { Icon: File06, tone: "bg-[rgb(255,247,237)] text-[rgb(194,84,28)]" };
  if (type.startsWith("order_")) return { Icon: Truck01, tone: "bg-[rgb(239,248,255)] text-[rgb(21,112,239)]" };
  if (type.startsWith("kyc_")) return { Icon: ShieldTick, tone: "bg-[rgb(236,253,243)] text-[rgb(7,148,85)]" };
  if (type === "new_rfq") return { Icon: Inbox01, tone: "bg-[rgb(245,243,255)] text-[rgb(105,65,198)]" };
  if (type.startsWith("par_")) return { Icon: Tag01, tone: "bg-[rgb(255,247,237)] text-[rgb(194,84,28)]" };
  if (type === "activation") return { Icon: CheckCircle, tone: "bg-[rgb(236,253,243)] text-[rgb(7,148,85)]" };
  return { Icon: Bell01, tone: "bg-[rgb(242,244,247)] text-[rgb(102,112,133)]" };
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");

  const { data: notifications, isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = notifications ?? [];
  const unread = useMemo(() => items.filter((n) => !n.read_at), [items]);
  const visible = filter === "unread" ? unread : items;

  const handleMarkRead = (id: string) => {
    markRead.mutate(
      { id },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() }) },
    );
  };

  const handleMarkAll = () => {
    markAll.mutate(undefined, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() }),
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Notifications</h1>
          <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">
            {unread.length > 0 ? `${unread.length} unread` : "All caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-[rgb(249,250,251)] rounded-lg p-1 border border-[rgb(228,231,236)]">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                data-testid={`filter-${f}`}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                  filter === f
                    ? "bg-white text-[rgb(16,24,40)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                    : "text-[rgb(102,112,133)] hover:text-[rgb(52,64,84)]"
                }`}
              >
                {f}
                {f === "unread" && unread.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[rgb(255,109,67)] text-white text-[10px]">
                    {unread.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          {unread.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAll}
              disabled={markAll.isPending}
              data-testid="button-mark-all-read"
            >
              <Check className="mr-1.5 h-3.5 w-3.5" /> Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <BellOff01 className="h-8 w-8 text-[rgb(208,213,221)]" />
            <p className="text-sm text-[rgb(152,162,179)]">
              {filter === "unread" ? "No unread notifications." : "All caught up — no new notifications."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[rgb(242,244,247)]">
            {visible.map((n) => {
              const { Icon, tone } = notifMeta(n.type);
              const body = (
                <div className="flex items-start gap-3 px-5 py-4 group">
                  <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${!n.read_at ? "font-semibold text-[rgb(16,24,40)]" : "text-[rgb(52,64,84)]"}`}>
                        {n.title}
                      </p>
                      {!n.read_at && <span className="h-1.5 w-1.5 rounded-full bg-[rgb(255,109,67)] shrink-0" />}
                    </div>
                    {n.body && <p className="text-xs text-[rgb(102,112,133)] mt-0.5">{n.body}</p>}
                    <p className="mt-1 text-xs text-[rgb(152,162,179)]">
                      {new Date(n.created_at).toLocaleString("en-SA", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  {!n.read_at && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMarkRead(n.id);
                      }}
                      disabled={markRead.isPending}
                      className="shrink-0 text-xs font-medium text-[rgb(255,109,67)] hover:text-[rgb(205,56,22)] transition-colors disabled:opacity-50"
                      data-testid={`button-mark-read-${n.id}`}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              );
              return (
                <li
                  key={n.id}
                  className={!n.read_at ? "bg-[rgb(255,249,247)]" : "hover:bg-[rgb(249,250,251)]"}
                  data-testid={`notification-item-${n.id}`}
                >
                  {n.link ? (
                    <Link
                      href={n.link}
                      onClick={() => !n.read_at && handleMarkRead(n.id)}
                      className="block"
                      data-testid={`notification-link-${n.id}`}
                    >
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
