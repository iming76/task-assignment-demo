import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { Label } from "./label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

const meta = {
  title: "Primitives/Select",
  component: Select,
  tags: ["autodocs"],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

function SkillSelect({ disabled }: { disabled?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <Label id="skill-select-label" htmlFor="skill-select-trigger">
        Required skill
      </Label>
      <Select disabled={disabled}>
        <SelectTrigger
          id="skill-select-trigger"
          className="w-56"
          aria-labelledby="skill-select-label"
        >
          <SelectValue placeholder="Select a skill" />
        </SelectTrigger>
        <SelectContent aria-labelledby="skill-select-label">
          <SelectItem value="react">React</SelectItem>
          <SelectItem value="node">Node.js</SelectItem>
          <SelectItem value="postgres">PostgreSQL</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export const Default: Story = {
  render: () => <SkillSelect />,
};

export const Disabled: Story = {
  render: () => <SkillSelect disabled />,
};

export const SelectInteraction: Story = {
  render: () => <SkillSelect />,
  // Radix hides background content (including the trigger it owns) from
  // assistive tech while the listbox is open; axe's aria-hidden-focus rule
  // flags that expected, transient state, so this open-state story is
  // exempted while every closed-state story is still checked.
  parameters: {
    a11y: { test: "off" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "Required skill" });

    await userEvent.click(trigger);

    const option = await within(document.body).findByRole("option", {
      name: "Node.js",
    });
    await userEvent.click(option);

    await expect(trigger).toHaveTextContent("Node.js");
  },
};
