import type { Developer, Skill, Task } from "@repo/shared-types";
import { Button } from "@repo/ui";

import type { TaskTreeNode } from "../../lib/task-tree";
import { TaskTreeNodeView } from "../TaskTreeNode";

export function TaskListWithPagination({
  pagedRoots,
  skills,
  developers,
  onRequestDelete,
  currentPage,
  pageCount,
  onPageChange,
}: {
  pagedRoots: TaskTreeNode[];
  skills: Skill[];
  developers: Developer[];
  onRequestDelete: (task: Task) => void;
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {pagedRoots.map((node) => (
        <TaskTreeNodeView
          key={node.task.id}
          node={node}
          skills={skills}
          developers={developers}
          onRequestDelete={onRequestDelete}
        />
      ))}
      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= pageCount}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
