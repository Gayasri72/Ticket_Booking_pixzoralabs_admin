import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Event {
  id: string;
  name: string;
  tickets: number;
  revenue: string;
  status: "active" | "upcoming" | "ended";
}

const events: Event[] = [
  {
    id: "1",
    name: "Summer Music Festival 2025",
    tickets: 3450,
    revenue: "$172,500",
    status: "active",
  },
  {
    id: "2",
    name: "Tech Conference 2025",
    tickets: 1230,
    revenue: "$123,000",
    status: "upcoming",
  },
  {
    id: "3",
    name: "Cinema Night Series",
    tickets: 2100,
    revenue: "$52,500",
    status: "active",
  },
  {
    id: "4",
    name: "Sports Championship",
    tickets: 5670,
    revenue: "$283,500",
    status: "active",
  },
];

function getStatusVariant(status: string) {
  switch (status) {
    case "active":
      return "default";
    case "upcoming":
      return "secondary";
    case "ended":
      return "outline";
    default:
      return "secondary";
  }
}

export function TopEvents() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Events</CardTitle>
        <CardDescription>Highest performing events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800 last:border-0"
            >
              <div className="flex-1">
                <p className="font-medium text-slate-950 dark:text-slate-50">
                  {event.name}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {event.tickets} tickets sold
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold text-slate-950 dark:text-slate-50">
                    {event.revenue}
                  </p>
                  <Badge variant={getStatusVariant(event.status)}>
                    {event.status.charAt(0).toUpperCase() +
                      event.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
