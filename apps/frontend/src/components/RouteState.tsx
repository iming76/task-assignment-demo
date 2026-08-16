import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";

interface RouteStateProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

function RouteState({ title, description, children }: RouteStateProps) {
  return (
    <Card className="mx-auto mt-12 w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      {children ? <CardContent>{children}</CardContent> : null}
    </Card>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return <RouteState title={label} />;
}

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <RouteState title={title} description={description}>
      {children}
    </RouteState>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return <RouteState title={title} description={description} />;
}

export function NotFoundState() {
  return (
    <RouteState
      title="Page not found"
      description="The page you're looking for doesn't exist."
    />
  );
}
