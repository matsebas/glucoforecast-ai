import type {
  FileUIPart,
  ReasoningUIPart,
  SourceUIPart,
  StepStartUIPart,
  TextUIPart,
  ToolInvocationUIPart,
} from "@ai-sdk/ui-utils";

export interface ToolResult {
  toolCallId: string;
  result: string;
}

export interface MessagePartProps {
  part:
    | TextUIPart
    | ReasoningUIPart
    | ToolInvocationUIPart
    | SourceUIPart
    | FileUIPart
    | StepStartUIPart;
  index: number;
  // eslint-disable-next-line no-unused-vars
  addToolResult: (toolResult: ToolResult) => void;
}
