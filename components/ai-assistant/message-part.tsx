import React from "react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { MarkdownComponents } from "./markdown-components";

import type { MessagePartProps } from "./types";

export const MessagePart = React.memo<MessagePartProps>(({ part, index, addToolResult }) => {
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
        <div
          key={`reasoning-${index}`}
          className="border-l-4 border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-600 p-3 my-2 rounded-r-lg"
        >
          <div className="text-blue-700 dark:text-blue-300 text-sm font-medium mb-1">
            💭 Razonamiento
          </div>
          <ReactMarkdown components={MarkdownComponents}>{part.reasoning}</ReactMarkdown>
        </div>
      );
    case "tool-invocation": {
      const callId = part.toolInvocation.toolCallId;

      switch (part.toolInvocation.toolName) {
        case "askForConfirmation": {
          switch (part.toolInvocation.state) {
            case "call":
              return (
                <div key={callId} className="space-y-2 flex justify-end">
                  <p className="text-sm font-medium">{part.toolInvocation.args.message}</p>
                  <div className="flex gap-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        addToolResult({
                          toolCallId: callId,
                          result: "Si, confirmado.",
                        })
                      }
                    >
                      Sí
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        addToolResult({
                          toolCallId: callId,
                          result: "No, denegado.",
                        })
                      }
                    >
                      No
                    </Button>
                  </div>
                </div>
              );
            case "result":
              return (
                <div key={callId} className="flex justify-end mb-4">
                  <Card className="max-w-xs py-2">
                    <CardContent className="text-muted-foreground py-0 my-0">
                      <p className="text-xs italic">{part.toolInvocation.result}</p>
                    </CardContent>
                  </Card>
                </div>
              );
          }
          break;
        }
        default:
          console.warn("DEFAULT", part.type);
          return;
      }
    }
  }
});

MessagePart.displayName = "MessagePart";
