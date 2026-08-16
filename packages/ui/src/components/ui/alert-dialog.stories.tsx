import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  expect,
  fn,
  userEvent,
  waitForElementToBeRemoved,
  within,
} from "storybook/test";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { Button } from "./button";

function DeleteConfirmation({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete task</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this task?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the task and cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const meta = {
  title: "Primitives/AlertDialog",
  component: DeleteConfirmation,
  tags: ["autodocs"],
  args: {
    onConfirm: fn(),
  },
} satisfies Meta<typeof DeleteConfirmation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ConfirmInteraction: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Delete task" });

    await userEvent.click(trigger);

    const dialog = await within(document.body).findByRole("alertdialog");
    const confirm = within(dialog).getByRole("button", { name: "Delete" });

    await userEvent.click(confirm);

    await expect(args.onConfirm).toHaveBeenCalledOnce();
    // Radix keeps the content mounted until its exit animation finishes.
    await waitForElementToBeRemoved(dialog);
  },
};

export const CancelInteraction: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Delete task" });

    await userEvent.click(trigger);

    const dialog = await within(document.body).findByRole("alertdialog");
    const cancel = within(dialog).getByRole("button", { name: "Cancel" });

    await userEvent.click(cancel);

    await expect(args.onConfirm).not.toHaveBeenCalled();
    // Radix keeps the content mounted until its exit animation finishes.
    await waitForElementToBeRemoved(dialog);
  },
};
