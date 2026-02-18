import { UserAvatar } from "@/components/shared/user-avatar";
import type { ResolvedUser } from "@/lib/users";

interface Column {
  key: string;
  label: string;
}

interface MemberStatsTableProps {
  columns: Column[];
  rows: {
    userId: string;
    values: Record<string, string | number>;
  }[];
  usersMap: Map<string, ResolvedUser>;
}

export function MemberStatsTable({ columns, rows, usersMap }: MemberStatsTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Nog geen data beschikbaar.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
              Lid
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-right py-2 px-3 font-medium text-muted-foreground"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const user = usersMap.get(row.userId);
            return (
              <tr key={row.userId} className="border-b last:border-0">
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      imageUrl={user?.imageUrl}
                      initials={user?.initials ?? "?"}
                      fullName={user?.fullName}
                      size="sm"
                    />
                    <span className="font-medium">
                      {user?.fullName ?? "Onbekend"}
                    </span>
                  </div>
                </td>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="text-right py-2 px-3 font-mono text-muted-foreground"
                  >
                    {row.values[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
