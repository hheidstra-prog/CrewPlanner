import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Pin, Download, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { DeletePostButton } from "@/components/posts/delete-post-button";
import { POST_CATEGORIE_LABELS } from "@/lib/constants";
import { formatDatum } from "@/lib/utils";
import { getPostById } from "@/lib/queries/posts";
import { isAdmin } from "@/lib/auth";
import { resolveUser } from "@/lib/users";
import { CommentThread } from "@/components/comments/comment-thread";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, admin] = await Promise.all([getPostById(id), isAdmin()]);

  if (!post) notFound();

  const auteur = await resolveUser(post.auteurId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/informatie">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Terug
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge
              label={POST_CATEGORIE_LABELS[post.categorie]}
              className="bg-ocean-light text-ocean"
            />
            {post.gepind && <Pin className="h-4 w-4 text-twijfel" />}
          </div>
          <h1 className="text-2xl font-bold text-navy">{post.titel}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Door {auteur?.fullName ?? "Onbekend"} &middot;{" "}
            {formatDatum(post.createdAt)}
          </p>
        </div>
        {admin && (
          <div className="flex gap-2">
            <Link href={`/informatie/${post.id}/bewerken`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Bewerken
              </Button>
            </Link>
            <DeletePostButton postId={post.id} />
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-6 prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap">{post.inhoud}</div>
        </CardContent>
      </Card>

      {post.files.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-sm font-semibold text-muted-foreground mb-2 px-3">
              Bijlagen ({post.files.length})
            </p>
            {post.files.map((file) => (
              <a
                key={file.id}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ocean-light shrink-0">
                  <Paperclip className="h-5 w-5 text-ocean" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.fileSize < 1024 * 1024
                      ? `${(file.fileSize / 1024).toFixed(0)} KB`
                      : `${(file.fileSize / (1024 * 1024)).toFixed(1)} MB`}
                  </p>
                </div>
                <Download className="h-4 w-4 text-muted-foreground shrink-0" />
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      <CommentThread parentType="POST" parentId={post.id} />
    </div>
  );
}
