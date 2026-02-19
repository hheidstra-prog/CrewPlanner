import Link from "next/link";
import { Plus, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PostCard } from "@/components/posts/post-card";
import { SearchInput } from "@/components/shared/search-input";
import { getPosts } from "@/lib/queries/posts";
import { isAdmin } from "@/lib/auth";
import { POST_CATEGORIE_LABELS } from "@/lib/constants";
import type { PostCategorie } from "@/generated/prisma";

export default async function InformatiePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [posts, admin] = await Promise.all([
    getPosts(undefined, q),
    isAdmin(),
  ]);

  const categories = Object.keys(POST_CATEGORIE_LABELS) as PostCategorie[];

  return (
    <div>
      <PageHeader
        title="Informatie"
        description="Mededelingen en documentatie"
        action={
          admin ? (
            <Link href="/informatie/nieuw">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nieuw bericht
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="mb-4">
        <SearchInput placeholder="Zoek in berichten..." defaultValue={q} />
      </div>

      <Tabs defaultValue="alle">
        <TabsList>
          <TabsTrigger value="alle">Alle</TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {POST_CATEGORIE_LABELS[cat]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="alle" className="mt-6 flex flex-col gap-6">
          {posts.length === 0 ? (
            <EmptyState
              icon={Newspaper}
              title={q ? "Geen resultaten" : "Geen berichten"}
              description={
                q
                  ? `Geen berichten gevonden voor "${q}".`
                  : "Er zijn nog geen berichten gepubliceerd."
              }
            />
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </TabsContent>

        {categories.map((cat) => {
          const filtered = posts.filter((p) => p.categorie === cat);
          return (
            <TabsContent key={cat} value={cat} className="mt-6 flex flex-col gap-6">
              {filtered.length === 0 ? (
                <EmptyState
                  icon={Newspaper}
                  title={`Geen ${POST_CATEGORIE_LABELS[cat].toLowerCase()}`}
                  description={`Er zijn nog geen berichten in deze categorie.`}
                />
              ) : (
                filtered.map((post) => <PostCard key={post.id} post={post} />)
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
