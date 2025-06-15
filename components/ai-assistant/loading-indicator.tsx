import React from "react";

export const LoadingIndicator = React.memo(() => (
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