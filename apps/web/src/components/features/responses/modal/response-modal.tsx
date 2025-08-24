import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ResponseModalProps {
  responseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResponseModal({
  responseId,
  open,
  onOpenChange,
}: ResponseModalProps) {
  const { data: response } = useQuery(
    trpc.responses.byId.queryOptions({ id: responseId })
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{response?.prompts?.text}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <ScrollArea className="h-[500px]">
            <pre className="text-sm">{JSON.stringify(response, null, 2)}</pre>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
