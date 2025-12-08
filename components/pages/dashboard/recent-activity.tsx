import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ActivityItem {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  status: "success" | "pending" | "failed";
}

const activities: ActivityItem[] = [
  {
    id: "1",
    action: "New booking created",
    user: "John Doe",
    timestamp: "2 hours ago",
    status: "success",
  },
  {
    id: "2",
    action: "Payment processed",
    user: "Jane Smith",
    timestamp: "4 hours ago",
    status: "success",
  },
  {
    id: "3",
    action: "Refund requested",
    user: "Mike Johnson",
    timestamp: "6 hours ago",
    status: "pending",
  },
  {
    id: "4",
    action: "Ticket cancellation",
    user: "Sarah Williams",
    timestamp: "8 hours ago",
    status: "success",
  },
  {
    id: "5",
    action: "Support ticket opened",
    user: "Alex Brown",
    timestamp: "10 hours ago",
    status: "pending",
  },
];

function getStatusColor(status: string) {
  switch (status) {
    case "success":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200";
  }
}

export function RecentActivity() {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest transactions and events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800 last:border-0"
            >
              <div className="flex-1">
                <p className="font-medium text-slate-950 dark:text-slate-50">
                  {activity.action}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {activity.user}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={getStatusColor(activity.status)}>
                  {activity.status.charAt(0).toUpperCase() +
                    activity.status.slice(1)}
                </Badge>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {activity.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
