import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { PostForm } from "@/components/posts/post-form";

export default async function NieuwBerichtPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/informatie");

  return (
    <div className="max-w-2xl">
      <PostForm />
    </div>
  );
}
