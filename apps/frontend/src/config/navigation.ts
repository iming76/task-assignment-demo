export interface NavigationItem {
  label: string;
  path: string;
}

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", path: "/" },
  { label: "Tasks", path: "/task" },
  { label: "Agent Task", path: "/agent-task" },
  { label: "Developers", path: "/developer" },
  { label: "Skills", path: "/skill" },
];
