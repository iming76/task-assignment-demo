import { Route, Routes } from "react-router-dom";

import { Navbar } from "./components/Navbar";
import { AgentTaskPage } from "./pages/AgentTaskPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DevelopersPage } from "./pages/DevelopersPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { SkillsPage } from "./pages/SkillsPage";
import { TasksPage } from "./pages/TasksPage";

export function App() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navbar />
      <main className="px-6 py-8">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/developer" element={<DevelopersPage />} />
          <Route path="/skill" element={<SkillsPage />} />
          <Route path="/task" element={<TasksPage />} />
          <Route path="/agent-task" element={<AgentTaskPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}
