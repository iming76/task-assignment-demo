import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui";
import { AgentTaskFlow } from "./AgentTaskFlow";

export function AgentTaskModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add a task using agent</DialogTitle>
        </DialogHeader>
        <AgentTaskFlow onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
