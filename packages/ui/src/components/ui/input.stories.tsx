import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { Field, FieldDescription, FieldError, FieldLabel } from "./field";
import { Input } from "./input";

const meta = {
  title: "Primitives/Input",
  component: Input,
  tags: ["autodocs"],
  args: {
    placeholder: "you@example.com",
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

export const WithLabelAndDescription: Story = {
  render: (args) => (
    <Field>
      <FieldLabel htmlFor="story-input-description">Email</FieldLabel>
      <Input id="story-input-description" {...args} />
      <FieldDescription>We only use this to send receipts.</FieldDescription>
    </Field>
  ),
};

export const Invalid: Story = {
  render: (args) => (
    <Field>
      <FieldLabel htmlFor="story-input-invalid">Email</FieldLabel>
      <Input id="story-input-invalid" aria-invalid {...args} />
      <FieldError>Enter a valid email address.</FieldError>
    </Field>
  ),
};

export const TypeInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("you@example.com");

    await userEvent.type(input, "demo@example.com");

    await expect(input).toHaveValue("demo@example.com");
  },
};
