"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, X, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { POST_CATEGORIE_LABELS } from "@/lib/constants";
import { createPost, updatePost } from "@/lib/actions/posts";
import type { Post, PostCategorie, PostFile } from "@/generated/prisma";
import { toast } from "sonner";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileItem {
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

interface PostFormProps {
  post?: Post & { files: PostFile[] };
}

export function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const isEditing = !!post;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<FileItem[]>(
    post?.files?.map((f) => ({
      url: f.url,
      fileName: f.fileName,
      fileSize: f.fileSize,
      fileType: f.fileType,
    })) ?? []
  );
  const [uploading, setUploading] = useState(false);

  const action = async (_prev: unknown, formData: FormData) => {
    // Upload new files
    const uploaded: FileItem[] = [...existingFiles];
    if (pendingFiles.length > 0) {
      setUploading(true);
      for (const file of pendingFiles) {
        try {
          const uploadData = new FormData();
          uploadData.append("file", file);
          const res = await fetch("/api/upload", { method: "POST", body: uploadData });
          if (!res.ok) {
            const err = await res.json();
            toast.error(`Upload mislukt: ${file.name} — ${err.error}`);
            setUploading(false);
            return { success: false, error: "Upload mislukt" };
          }
          const blob = await res.json();
          uploaded.push({
            url: blob.url,
            fileName: blob.fileName,
            fileSize: blob.fileSize,
            fileType: blob.fileType,
          });
        } catch {
          toast.error(`Upload mislukt: ${file.name}`);
          setUploading(false);
          return { success: false, error: "Upload mislukt" };
        }
      }
      setUploading(false);
    }

    formData.set("files", JSON.stringify(uploaded));

    const result = isEditing
      ? await updatePost(post.id, formData)
      : await createPost(formData);

    if (result.success) {
      toast.success(isEditing ? "Bericht bijgewerkt" : "Bericht gepubliceerd");
      router.push("/informatie");
    } else {
      toast.error(result.error ?? "Er ging iets mis");
    }
    return result;
  };

  const [, formAction, isPending] = useActionState(action, null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const tooBig = selected.filter((f) => f.size > 10 * 1024 * 1024);
    if (tooBig.length > 0) {
      toast.error(`${tooBig.length} bestand(en) te groot (max 10MB)`);
    }
    const valid = selected.filter((f) => f.size <= 10 * 1024 * 1024);
    setPendingFiles((prev) => [...prev, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (index: number) => {
    setExistingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const totalFiles = existingFiles.length + pendingFiles.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? "Bericht bewerken" : "Nieuw bericht"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categorie">Categorie</Label>
            <Select name="categorie" defaultValue={post?.categorie ?? "ALGEMEEN"}>
              <SelectTrigger>
                <SelectValue placeholder="Kies categorie" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(POST_CATEGORIE_LABELS) as PostCategorie[]).map(
                  (key) => (
                    <SelectItem key={key} value={key}>
                      {POST_CATEGORIE_LABELS[key]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titel">Titel</Label>
            <Input
              id="titel"
              name="titel"
              defaultValue={post?.titel ?? ""}
              placeholder="Titel van het bericht"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inhoud">Inhoud</Label>
            <Textarea
              id="inhoud"
              name="inhoud"
              defaultValue={post?.inhoud ?? ""}
              placeholder="Schrijf je bericht..."
              rows={10}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Bijlagen {totalFiles > 0 && `(${totalFiles})`}</Label>

            {/* Existing files */}
            {existingFiles.map((file, i) => (
              <div
                key={file.url}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3"
              >
                <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.fileSize)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeExistingFile(i)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {/* Pending (new) files */}
            {pendingFiles.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center gap-3 rounded-lg border border-dashed border-ocean/50 bg-ocean-light/30 p-3"
              >
                <Paperclip className="h-4 w-4 text-ocean shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)} — wordt geüpload bij opslaan
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removePendingFile(i)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <div
              className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 cursor-pointer hover:border-ocean/50 hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Klik om bestanden toe te voegen (max 10MB per bestand)
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="gepind"
              name="gepind"
              value="true"
              defaultChecked={post?.gepind ?? false}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="gepind" className="font-normal">
              Bericht vastzetten (bovenaan tonen)
            </Label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isPending || uploading}>
              {uploading
                ? "Uploaden..."
                : isPending
                  ? "Opslaan..."
                  : isEditing
                    ? "Bijwerken"
                    : "Publiceren"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Annuleren
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
