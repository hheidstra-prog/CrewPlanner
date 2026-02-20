"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { MessageCircle, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SUGGESTIONS = [
  "Welke evenementen staan er binnenkort gepland?",
  "Waar moet ik nog op reageren?",
  "Welke taken staan er open?",
  "Wat heb ik gemist?",
];

export function ChatOverlay() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    onError: (err) => {
      if (err.message?.includes("429")) {
        toast.error("Je hebt het limiet van 20 berichten per uur bereikt.");
      }
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus input when sheet opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSend = (text: string) => {
    if (!text.trim() || isLoading) return;
    setInput("");
    sendMessage({ text });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  // Extract text content from message parts
  const getMessageText = (message: (typeof messages)[number]) => {
    if (!message.parts) return "";
    return message.parts
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join("");
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ocean text-white shadow-lg transition-transform hover:scale-105 active:scale-95",
          "bottom-20 md:bottom-6"
        )}
        aria-label="Open chat assistent"
      >
        <MessageCircle className="size-6" />
      </button>

      {/* Chat sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="flex w-full flex-col p-0 sm:max-w-md"
        >
          {/* Header */}
          <SheetHeader className="flex-row items-center justify-between border-b px-4 py-3">
            <div>
              <SheetTitle className="text-base">
                CrewPlanner Assistent
              </SheetTitle>
              <SheetDescription className="text-xs">
                Stel een vraag of voer een actie uit
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </SheetHeader>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4"
          >
            {messages.length === 0 && !isLoading ? (
              <div className="flex flex-col gap-2">
                <p className="text-muted-foreground mb-2 text-sm">
                  Hoi! Ik ben je CrewPlanner Assistent. Probeer een van deze
                  suggesties:
                </p>
                {SUGGESTIONS.map((text) => (
                  <button
                    key={text}
                    onClick={() => handleSend(text)}
                    className="rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                  >
                    {text}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((message) => {
                  const text = getMessageText(message);

                  // Skip assistant messages with no text (tool-only)
                  if (message.role === "assistant" && !text) return null;

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                        message.role === "user"
                          ? "ml-auto bg-ocean text-white whitespace-pre-wrap"
                          : "mr-auto bg-muted max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-1 [&_li]:my-0.5 [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_a]:text-ocean [&_a]:underline"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <ReactMarkdown>{text}</ReactMarkdown>
                      ) : (
                        text
                      )}
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="mr-auto flex gap-1 rounded-2xl bg-muted px-4 py-3">
                    <span className="animate-bounce text-muted-foreground text-sm [animation-delay:0ms]">
                      .
                    </span>
                    <span className="animate-bounce text-muted-foreground text-sm [animation-delay:150ms]">
                      .
                    </span>
                    <span className="animate-bounce text-muted-foreground text-sm [animation-delay:300ms]">
                      .
                    </span>
                  </div>
                )}
              </div>
            )}
            {error && (
              <div className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Er ging iets mis. Probeer het opnieuw.
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t px-4 py-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Stel een vraag..."
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ocean/50"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="h-9 w-9 shrink-0 rounded-lg bg-ocean hover:bg-ocean/90"
            >
              <ArrowUp className="size-4" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
