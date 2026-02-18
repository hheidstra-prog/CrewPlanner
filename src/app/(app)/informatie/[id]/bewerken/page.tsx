import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getPostById } from "@/lib/queries/posts";
import { PostForm } from "@/components/posts/post-form";

export default async function BewerkenBerichtPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [admin, post] = await Promise.all([isAdmin(), getPostById(id)]);

  if (!admin) redirect("/informatie");
  if (!post) notFound();

  return (
    <div className="max-w-2xl">
      <PostForm post={post} />
    </div>
  );
}
