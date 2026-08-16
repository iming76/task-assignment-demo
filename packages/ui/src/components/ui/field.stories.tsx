import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "./field";
import { Input } from "./input";

const meta = {
  title: "Primitives/Field",
  component: Field,
  tags: ["autodocs"],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Description: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="field-story-description">Task title</FieldLabel>
      <Input id="field-story-description" placeholder="Implement login" />
      <FieldDescription>Shown to every assigned developer.</FieldDescription>
    </Field>
  ),
};

export const Error: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="field-story-error">Task title</FieldLabel>
      <Input id="field-story-error" aria-invalid defaultValue="" />
      <FieldError>Title is required.</FieldError>
    </Field>
  ),
};

export const GroupOfFields: Story = {
  render: () => (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="field-story-group-title">Task title</FieldLabel>
        <Input id="field-story-group-title" placeholder="Implement login" />
      </Field>
      <Field>
        <FieldLabel htmlFor="field-story-group-notes">Notes</FieldLabel>
        <Input id="field-story-group-notes" placeholder="Optional" />
        <FieldDescription>Visible only to the assignee.</FieldDescription>
      </Field>
    </FieldGroup>
  ),
};
