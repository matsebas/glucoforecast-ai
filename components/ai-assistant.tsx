"use client";

import { useChat } from "@ai-sdk/react";
import { Bot, Send, User } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AIAssistant() {
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

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const isProcessing = status === "submitted" || status === "streaming";

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Asistente de Diabetes</CardTitle>
        <CardDescription>
          Pregunta sobre tus tendencias de glucosa, patrones o cualquier duda sobre tu diabetes
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[400px] p-4" ref={scrollAreaRef}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 mb-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot size={16} />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-lg px-3 py-2 max-w-[80%] ${
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {/*{message.content}*/}
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case "text":
                      return <ReactMarkdown key={i}>{part.text}</ReactMarkdown>;
                    case "source":
                      return (
                        <span key={`source-${part.source.id}`}>
                          [
                          <a href={part.source.url} target="_blank">
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
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-muted">
                    <User size={16} />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {(status === "submitted" || status === "streaming") && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
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
        <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
          <Input
            placeholder="Pregunta sobre tus tendencias de glucosa..."
            value={input}
            onChange={handleInputChange}
            disabled={isProcessing}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isProcessing || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
