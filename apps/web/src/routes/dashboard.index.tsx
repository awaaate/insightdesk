import { LetiDashboard } from "@/components/dashboard/leti/leti-dashboard";
import { Chat } from "@/components/chat/chat";
import { createFileRoute } from "@tanstack/react-router";
import {
  MessageSquare,
  X,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  Brain,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dashboard/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatSize, setChatSize] = useState(30);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  // Persist chat state in localStorage
  useEffect(() => {
    const savedChatState = localStorage.getItem("chatPanelState");
    if (savedChatState) {
      const { open, size } = JSON.parse(savedChatState);
      setIsChatOpen(open);
      setChatSize(size);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "chatPanelState",
      JSON.stringify({ open: isChatOpen, size: chatSize })
    );
  }, [isChatOpen, chatSize]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-background via-background to-muted/20">
      {isChatOpen ? (
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full"
          onLayout={(sizes) => {
            // Detect if chat panel is collapsed
            setIsCollapsed(sizes[1] < 5);
            if (sizes[1] > 5) {
              setChatSize(sizes[1]);
            }
          }}
        >
          {/* Main Content Panel */}
          <ResizablePanel
            defaultSize={100 - chatSize}
            minSize={50}
            className="relative"
          >
            <div className="relative h-full">
              {/* Content Header */}
              <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-xl font-semibold">
                        Intelligence Dashboard
                      </h1>
                      <p className="text-sm text-muted-foreground">
                        Understanding your data, from comments to insights.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Sparkles className="h-3 w-3" />
                      Generado mediante sistemas de IA Multi-Agente y tecnología
                      NLP
                    </Badge>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleFullscreen}
                          className="h-8 w-8"
                        >
                          {isFullscreen ? (
                            <Minimize2 className="h-4 w-4" />
                          ) : (
                            <Maximize2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                      </TooltipContent>
                    </Tooltip>

                    {isCollapsed && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsChatOpen(false)}
                            className="h-8 w-8"
                          >
                            <PanelRightClose className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Close chat panel</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Dashboard Content */}
              <ScrollArea className="h-[calc(100%-73px)]">
                <div className="p-6">
                  <LetiDashboard />
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>

          {/* Resizable Handle */}
          <ResizableHandle
            withHandle
            className="w-1 bg-border/50 hover:bg-border transition-colors data-[panel-group-direction=vertical]:h-1"
          />

          {/* Chat Panel */}
          <ResizablePanel
            defaultSize={chatSize}
            minSize={20}
            maxSize={50}
            collapsible
            className="relative"
          >
            <div className="flex h-full flex-col bg-gradient-to-b from-card to-card/95 border-l">
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b bg-card/50 backdrop-blur-sm px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    {hasNewMessages && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">
                      InsightDesk Chatroom.
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Ask the AI agents
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsChatOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Close chat</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Chat Component */}
              <div className="flex-1 overflow-hidden">
                <Chat />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        /* Full Width Dashboard View */
        <div className="relative h-full">
          {/* Content Header */}
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">
                    Insight Intelligent Dashboard
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Análisis avanzado de comentarios, insights y NPS.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="gap-1 text-xs text-brand/70  bg-background border-brand/20"
                >
                  <Sparkles className="h-3 w-3" />
                  Generado mediante sistemas de IA Multi-Agente y tecnología NLP
                </Badge>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleFullscreen}
                      className="h-8 w-8"
                    >
                      {isFullscreen ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[calc(100%-73px)]">
            <div className="p-6">
              <LetiDashboard />
            </div>
          </ScrollArea>

          {/* Floating Chat Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                className={cn(
                  "fixed bottom-6 right-6 z-50 shadow-2xl",
                  "bg-primary hover:bg-primary/90",
                  "transition-all duration-300 hover:scale-105",
                  "group"
                )}
                onClick={() => setIsChatOpen(true)}
              >
                <div className="relative">
                  <MessageSquare className="mr-2 h-5 w-5 transition-transform group-hover:rotate-12" />
                  {hasNewMessages && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  )}
                </div>
                <span className="font-medium">Open AI Chat</span>
                <Sparkles className="ml-2 h-4 w-4 transition-transform group-hover:rotate-180" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p>Chat with your AI assistant for insights and analysis</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
