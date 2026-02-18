import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/shared/user-avatar";
import { CommentForm } from "./comment-form";
import { DeleteCommentButton } from "./delete-comment-button";
import { getComments } from "@/lib/queries/comments";
import { resolveUsers } from "@/lib/users";
import { getCurrentUserId, isAdmin } from "@/lib/auth";
import { relatieveDatum } from "@/lib/utils";
import type { CommentParentType } from "@/generated/prisma";

interface CommentThreadProps {
  parentType: CommentParentType;
  parentId: string;
}

export async function CommentThread({ parentType, parentId }: CommentThreadProps) {
  const [comments, userId, admin] = await Promise.all([
    getComments(parentType, parentId),
    getCurrentUserId(),
    isAdmin(),
  ]);

  const userIds = comments.map((c) => c.auteurId);
  const usersMap = await resolveUsers(userIds);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Reacties
          <span className="font-mono text-sm font-normal text-muted-foreground">
            ({comments.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {comments.length > 0 && (
          <div className="space-y-3">
            {comments.map((comment) => {
              const user = usersMap.get(comment.auteurId);
              const canDelete = comment.auteurId === userId || admin;

              return (
                <div key={comment.id} className="flex gap-3">
                  <UserAvatar
                    imageUrl={user?.imageUrl}
                    initials={user?.initials ?? "?"}
                    fullName={user?.fullName}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {user?.fullName ?? "Onbekend"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {relatieveDatum(comment.createdAt)}
                      </span>
                      {canDelete && (
                        <DeleteCommentButton commentId={comment.id} />
                      )}
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap mt-0.5">
                      {comment.inhoud}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Separator />
        <CommentForm parentType={parentType} parentId={parentId} />
      </CardContent>
    </Card>
  );
}
