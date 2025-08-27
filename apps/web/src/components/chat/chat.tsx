"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { Response } from "@/components/ai-elements/response";
import {
  GlobeIcon,
  Sparkles,
  Send,
  Mic,
  Paperclip,
  Image,
  FileText,
  Code,
  Hash,
  Zap,
  Brain,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/source";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Loader } from "@/components/ai-elements/loader";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

// Suggested prompts for quick actions
const suggestedPrompts = [
  {
    icon: <Brain className="h-3 w-3" />,
    text: "Analyze recent patterns",
    category: "analysis",
  },
  {
    icon: <Zap className="h-3 w-3" />,
    text: "Generate insights report",
    category: "report",
  },
  {
    icon: <Hash className="h-3 w-3" />,
    text: "Show key metrics",
    category: "metrics",
  },
  {
    icon: <AlertCircle className="h-3 w-3" />,
    text: "Identify anomalies",
    category: "alert",
  },
];

export const Chat = () => {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `${import.meta.env.VITE_SERVER_URL}/api/chat`,
    }),
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input }, {});
      setInput("");
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };

  // Welcome message when no messages
  const showWelcome = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/5">
      {/* Chat Messages Area */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-4">
          {showWelcome ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <div className="p-3 rounded-2xl bg-primary/10 mb-4">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Assistant Ready</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                I can help you analyze data, generate insights, and answer
                questions about your dashboard.
              </p>

              {/* Suggested Prompts */}
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {suggestedPrompts.map((prompt, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2 text-xs h-auto py-2 px-3 hover:bg-primary/10 transition-colors"
                    onClick={() => handleSuggestedPrompt(prompt.text)}
                  >
                    {prompt.icon}
                    <span className="text-left">{prompt.text}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Brain className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[80%] space-y-2",
                      message.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    {/* Sources if available */}
                    {message.role === "assistant" &&
                      message.parts.some(
                        (part) => part.type === "source-url"
                      ) && (
                        <Sources>
                          <SourcesTrigger
                            count={
                              message.parts.filter(
                                (part) => part.type === "source-url"
                              ).length
                            }
                          />
                          {message.parts
                            .filter((part) => part.type === "source-url")
                            .map((part, i) => (
                              <SourcesContent key={`${message.id}-${i}`}>
                                <Source
                                  key={`${message.id}-${i}`}
                                  href={part.url}
                                  title={part.url}
                                />
                              </SourcesContent>
                            ))}
                        </Sources>
                      )}

                    {/* Message Content */}
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 shadow-sm",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border"
                      )}
                    >
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case "text":
                            return (
                              <div
                                key={`${message.id}-${i}`}
                                className={cn(
                                  "text-sm",
                                  message.role === "user"
                                    ? "text-primary-foreground"
                                    : ""
                                )}
                              >
                                {part.text}
                              </div>
                            );
                          case "reasoning":
                            return (
                              <Reasoning
                                key={`${message.id}-${i}`}
                                className="w-full mt-2"
                                isStreaming={status === "streaming"}
                              >
                                <ReasoningTrigger />
                                <ReasoningContent>{part.text}</ReasoningContent>
                              </Reasoning>
                            );
                          default:
                            return null;
                        }
                      })}
                    </div>

                    {/* Timestamp */}
                    <span className="text-xs text-muted-foreground px-1">
                      {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {message.role === "user" && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                        U
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {status === "submitted" && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-card border">
                    <Loader />
                    <span className="text-sm text-muted-foreground">
                      Thinking...
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-card/50 backdrop-blur-sm p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach file (Coming soon)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled
                >
                  <Image className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add image (Coming soon)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled
                >
                  <Code className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Code mode (Coming soon)</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-4" />

            <span className="text-xs text-muted-foreground">
              {input.length > 0 && `${input.length} chars`}
            </span>
          </div>

          {/* Input Field */}
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setIsTyping(e.target.value.length > 0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask anything about your data..."
              className={cn(
                "w-full min-h-[80px] max-h-[200px] px-4 py-3 pr-12",
                "bg-background border rounded-xl resize-none",
                "text-sm placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/20",
                "transition-all duration-200"
              )}
              disabled={status === "submitted" || status === "streaming"}
            />

            {/* Send Button */}
            <Button
              type="submit"
              size="icon"
              disabled={
                !input.trim() ||
                status === "submitted" ||
                status === "streaming"
              }
              className={cn(
                "absolute bottom-2 right-2 h-8 w-8",
                "transition-all duration-200",
                input.trim() ? "opacity-100" : "opacity-50"
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {status === "streaming"
                ? "AI is responding..."
                : status === "submitted"
                ? "Processing..."
                : "Press Enter to send, Shift+Enter for new line"}
            </span>
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  status === "ready"
                    ? "bg-green-500"
                    : "bg-yellow-500 animate-pulse"
                )}
              />
              <span>Connected</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
