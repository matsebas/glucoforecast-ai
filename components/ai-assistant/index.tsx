"use client";

import { useChat } from "@ai-sdk/react";
import { SendHorizontalIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import { ErrorMessage } from "./error-message";
import { LoadingIndicator } from "./loading-indicator";
import { MarkdownComponents } from "./markdown-components";
import { MessagePart } from "./message-part";

export function AIAssistant() {
  const { data: session } = useSession();
  const { messages, input, handleInputChange, handleSubmit, status, addToolResult } = useChat({
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
                className={`flex gap-3 mb-4 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`font-light leading-7 ${
                    message.role === "user"
                      ? "max-w-3/4 py-3 px-4 rounded-l-3xl rounded-br-3xl rounded-tr-[0.25rem] bg-foreground/10 text-foreground/90"
                      : "max-w-full"
                  }`}
                >
                  {messageParts.length > 0 ? (
                    messageParts.map((part, index) => (
                      <MessagePart
                        key={`part-${index}`}
                        part={part}
                        index={index}
                        addToolResult={addToolResult}
                      />
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
