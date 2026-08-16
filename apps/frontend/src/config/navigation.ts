export interface NavigationItem {
  label: string;
  path: string;
}

export const navigationItems: NavigationItem[] = [
  { label: "Tasks", path: "/task" },
  { label: "Developers", path: "/developer" },
  { label: "Skills", path: "/skill" },
];
