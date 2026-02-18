import Link from "next/link";
import { Pin, Paperclip } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { POST_CATEGORIE_LABELS } from "@/lib/constants";
import { relatieveDatum } from "@/lib/utils";
import type { Post, PostFile } from "@/generated/prisma";

interface PostCardProps {
  post: Post & { files: PostFile[] };
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/informatie/${post.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge
                  label={POST_CATEGORIE_LABELS[post.categorie]}
                  className="bg-ocean-light text-ocean"
                />
                {post.gepind && (
                  <Pin className="h-3.5 w-3.5 text-twijfel" />
                )}
                {post.files.length > 0 && (
                  <span className="flex items-center gap-0.5 text-muted-foreground">
                    <Paperclip className="h-3.5 w-3.5" />
                    {post.files.length > 1 && (
                      <span className="text-xs">{post.files.length}</span>
                    )}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {relatieveDatum(post.createdAt)}
                </span>
              </div>
              <h3 className="font-semibold text-foreground truncate">
                {post.titel}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {post.inhoud.replace(/<[^>]*>/g, "").slice(0, 150)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
