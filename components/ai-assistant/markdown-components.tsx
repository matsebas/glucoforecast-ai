import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

import type { Components } from "react-markdown";

export const MarkdownComponents: Components = {
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
        <AccordionTrigger className="cursor-pointer">&gt; Información detallada</AccordionTrigger>
        <AccordionContent className="italic font-extralight">{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};