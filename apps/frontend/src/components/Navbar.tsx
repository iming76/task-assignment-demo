import { NavLink } from "react-router-dom";

import { cn } from "@repo/ui";

import { navigationItems } from "../config/navigation";

export function Navbar() {
  return (
    <nav className="flex gap-4 border-b px-6 py-4 sticky top-0 left-0 bg-background z-50">
      {navigationItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === "/"}
          className={({ isActive }) =>
            cn(
              "text-sm font-medium transition-colors",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
