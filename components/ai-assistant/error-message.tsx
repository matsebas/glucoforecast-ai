import React from "react";

export const ErrorMessage = React.memo(() => (
  <div className="rounded-lg px-3 py-2 bg-destructive text-destructive-foreground">
    Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.
  </div>
));

ErrorMessage.displayName = "ErrorMessage";