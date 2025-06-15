"use client";

import { useChat } from "@ai-sdk/react";
import { SendHorizontalIcon } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import type { Components } from "react-markdown";

const MarkdownComponents: Components = {
  p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5">{children}</ol>,
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
  hr: () => <Separator />,
  blockquote: ({ children }) => (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger className="cursor-pointer">Información detallada</AccordionTrigger>
        <AccordionContent className="italic font-extralight">{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

const LoadingIndicator = React.memo(() => (
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
));

LoadingIndicator.displayName = "LoadingIndicator";

const ErrorMessage = React.memo(() => (
  <div className="rounded-lg px-3 py-2 bg-destructive text-destructive-foreground">
    Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.
  </div>
));

ErrorMessage.displayName = "ErrorMessage";

interface MessagePartProps {
  part: {
    type: string;
    text?: string;
    source?: { id: string; url: string; title?: string };
    reasoning?: string;
    toolInvocation?: { toolName: string };
    mimeType?: string;
    data?: string;
  };
  index: number;
}

const MessagePart = React.memo<MessagePartProps>(({ part, index }) => {
  switch (part.type) {
    case "text":
      return (
        <ReactMarkdown key={`text-${index}`} components={MarkdownComponents}>
          {part.text}
        </ReactMarkdown>
      );
    case "source":
      return part.source ? (
        <span key={`source-${part.source.id}`}>
          [
          <a href={part.source.url} target="_blank" rel="noopener noreferrer">
            {part.source.title ?? new URL(part.source.url).hostname}
          </a>
          ]
        </span>
      ) : null;
    case "reasoning":
      return (
        <div key={`reasoning-${index}`} className="text-muted-foreground italic">
          Razonamiento: {part.reasoning}
        </div>
      );
    case "tool-invocation":
      return part.toolInvocation ? (
        <div key={`tool-${index}`} className="text-blue-600 font-medium">
          Ejecutando: {part.toolInvocation.toolName}
        </div>
      ) : null;
    case "file":
      return (
        <Image
          key={`file-${index}`}
          src={`data:${part.mimeType};base64,${part.data}`}
          alt="Imagen generada"
          width={300}
          height={200}
          className="rounded-lg"
        />
      );
    default:
      return null;
  }
});

MessagePart.displayName = "MessagePart";

export function AIAssistant() {
  const { data: session } = useSession();
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "welcome-message",
        role: "assistant",
        content: "¿Cómo puedo ayudarte hoy?",
      },
    ],
  });

  const userName = session?.user?.name ?? "Usuario";

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleCustomSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

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
    },
    [handleSubmit]
  );

  const isProcessing = useMemo(() => status === "submitted" || status === "streaming", [status]);

  const isInputDisabled = useMemo(() => isProcessing || !input.trim(), [isProcessing, input]);

  return (
    <Card className="max-w-2xl h-[calc(100vh-120px)] flex flex-col">
      <CardHeader>
        <CardTitle>Hola, {userName}.</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4">
          {messages.map((message) => {
            const messageContent = message.content || "";
            const messageParts = message.parts || [];

            return (
              <div
                key={message.id}
                className={`flex items-start gap-3 mb-4 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-t-4xl rounded-bl-4xl rounded-br-sm px-3 py-2 max-w-full font-light leading-7 list-outside ${
                    message.role === "user"
                      ? "bg-foreground/10 text-foreground/90 border"
                      : "bg-transparent text-foreground/75"
                  }`}
                >
                  {messageParts.length > 0 ? (
                    messageParts.map((part, index) => (
                      <MessagePart key={`part-${index}`} part={part} index={index} />
                    ))
                  ) : (
                    <ReactMarkdown components={MarkdownComponents}>{messageContent}</ReactMarkdown>
                  )}
                </div>
              </div>
            );
          })}
          {isProcessing && <LoadingIndicator />}
          {status === "error" && <ErrorMessage />}
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
          <Button
            className="h-14 cursor-pointer"
            type="submit"
            size="lg"
            disabled={isInputDisabled}
            variant="outline"
          >
            <SendHorizontalIcon className="size-6" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
