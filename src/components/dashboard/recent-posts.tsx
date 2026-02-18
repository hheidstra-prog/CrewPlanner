import Link from "next/link";
import { Newspaper, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { POST_CATEGORIE_LABELS } from "@/lib/constants";
import { relatieveDatum } from "@/lib/utils";
import type { Post } from "@/generated/prisma";

interface RecentPostsProps {
  posts: Post[];
}

export function RecentPosts({ posts }: RecentPostsProps) {
  if (posts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Newspaper className="h-4 w-4 text-ocean" />
            Recente berichten
          </CardTitle>
          <Link
            href="/informatie"
            className="text-xs text-ocean hover:underline"
          >
            Alles bekijken
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/informatie/${post.id}`}
            className="flex items-center justify-between rounded-lg p-2 hover:bg-muted transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <StatusBadge
                  label={POST_CATEGORIE_LABELS[post.categorie]}
                  className="bg-ocean-light text-ocean text-[10px] px-1.5 py-0"
                />
                <span className="text-[10px] text-muted-foreground">
                  {relatieveDatum(post.createdAt)}
                </span>
              </div>
              <p className="text-sm font-medium truncate">{post.titel}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
