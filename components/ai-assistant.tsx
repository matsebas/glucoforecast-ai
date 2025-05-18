"use client";

import { useChat } from "@ai-sdk/react";
import { ArrowUp } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AIAssistant() {
  const { data: session } = useSession();
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "welcome-message",
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "¿Cómo puedo ayudarte hoy?",
          },
        ],
        content: "",
      },
    ],
  });

  const { name } = session!.user!;
  const MemoizedMarkdown = React.memo(ReactMarkdown);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleCustomSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Obtener la hora local del cliente y su zona horaria en formato IANA
    const clientNow = new Date();
    const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const clientLocalTimestamp = clientNow.toLocaleString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "shortOffset",
      timeZone: clientTimeZone,
    });

    handleSubmit(e, {
      data: {
        clientReportedDateTime: clientLocalTimestamp,
        clientTimeZone: clientTimeZone,
      },
    });
  };

  const isProcessing = status === "submitted" || status === "streaming";

  return (
    <Card className="max-w-2xl h-[calc(100vh-120px)] flex flex-col">
      <CardHeader>
        <CardTitle>Hola, {name}.</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 mb-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`rounded-t-4xl rounded-bl-4xl rounded-br-md  px-3 py-2 max-w-full font-light leading-7 list-outside ${
                  message.role === "user"
                    ? "bg-foreground/10 text-foreground/90 border"
                    : "bg-transparent text-foreground/75"
                }`}
              >
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case "text":
                      return (
                        <MemoizedMarkdown
                          key={`text-${i}`}
                          components={{
                            p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                            ul: ({ children }) => (
                              <ul className="list-disc pl-4 mb-1.5">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-4 mb-1.5">{children}</ol>
                            ),
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline hover:text-primary/70 transition-colors"
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {message.parts
                            .filter((part) => part.type === "text")
                            .map((part) => part.text)
                            .join(" ")}
                        </MemoizedMarkdown>
                      );
                    case "source":
                      return (
                        <span key={`source-${part.source.id}`}>
                          [
                          <a href={part.source.url} target="_blank" rel="noopener noreferrer">
                            {part.source.title ?? new URL(part.source.url).hostname}
                          </a>
                          ]
                        </span>
                      );
                    case "reasoning":
                      return <div key={i}>{part.reasoning}</div>;
                    case "tool-invocation":
                      return <div key={i}>{part.toolInvocation.toolName}</div>;
                    case "file":
                      return (
                        <Image
                          key={i}
                          src={`data:${part.mimeType};base64,${part.data}`}
                          alt={"Imagen generada"}
                        />
                      );
                  }
                })}
              </div>
            </div>
          ))}
          {(status === "submitted" || status === "streaming") && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="size-2 animate-bounce rounded-full bg-muted-foreground"></div>
              <div
                className="size-2 animate-bounce rounded-full bg-muted-foreground"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="size-2 animate-bounce rounded-full bg-muted-foreground"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
          )}
          {status === "error" && (
            <div className="rounded-lg px-3 py-2 bg-destructive text-destructive-foreground">
              Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t p-4 pb-0">
        <form onSubmit={handleCustomSubmit} className="flex w-full items-center gap-2">
          <Input
            placeholder="¿Cómo puedo ayudarte?"
            value={input}
            onChange={handleInputChange}
            disabled={isProcessing}
            className="flex-1 h-14 font-light"
          />
          <Button type="submit" size="icon" disabled={isProcessing || !input.trim()}>
            <ArrowUp className="size-6" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
