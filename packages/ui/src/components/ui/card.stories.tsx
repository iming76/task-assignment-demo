import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

const meta = {
  title: "Primitives/Card",
  component: Card,
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Implement login</CardTitle>
        <CardDescription>Assigned to Priya Shah</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline">
            Edit
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Required skills: React, Auth</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Mark done</Button>
      </CardFooter>
    </Card>
  ),
};

export const Empty: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>No tasks yet</CardTitle>
        <CardDescription>
          Create your first task to get started.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button size="sm">Create task</Button>
      </CardFooter>
    </Card>
  ),
};
