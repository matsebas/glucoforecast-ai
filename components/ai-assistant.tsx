"use client";

import { useChat } from "@ai-sdk/react";
import { Bot, Send, User } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
            text: "Hola, soy tu asistente de GlucoForecast AI. Puedo ayudarte a entender tus tendencias de glucosa y responder preguntas sobre tu diabetes. ¿En qué puedo ayudarte hoy?",
          },
        ],
        content: "",
      },
    ],
  });

  const { name } = session!.user!;
  const MemoizedMarkdown = React.memo(ReactMarkdown);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
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
        <CardTitle>Buenas tardes, {name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 mb-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot size={16} />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-2xl px-3 py-2 max-w-[80%] text-sm ${
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {/*{message.content}*/}
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
              {message.role === "user" && (
                <Avatar className="size-8">
                  <AvatarFallback className="bg-muted">
                    <User size={16} />
                  </AvatarFallback>
                </Avatar>
              )}
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
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t p-4">
        <form onSubmit={handleCustomSubmit} className="flex w-full items-center gap-2">
          <Input
            placeholder="Pregunta sobre tus tendencias de glucosa..."
            value={input}
            onChange={handleInputChange}
            disabled={isProcessing}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isProcessing || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
