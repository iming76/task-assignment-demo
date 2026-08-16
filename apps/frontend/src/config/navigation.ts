export interface NavigationItem {
  label: string;
  path: string;
}

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", path: "/" },
  { label: "Developers", path: "/developer" },
  { label: "Skills", path: "/skill" },
  { label: "Tasks", path: "/task" },
  { label: "Agent Task", path: "/agent-task" },
];
