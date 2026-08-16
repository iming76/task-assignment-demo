import type {
  AgentTaskApplyRequest,
  AgentTaskApplyResponse,
  AgentTaskProposalRequest,
  AgentTaskProposalResponse,
  Category,
  CreateDeveloperInput,
  CreateSkillInput,
  CreateTaskInput,
  Developer,
  PatchDeveloperInput,
  PatchSkillInput,
  PatchTaskInput,
  Skill,
  Task,
} from "@repo/shared-types";
import { request } from "./http.js";

export const apiClient = {
  tasks: {
    list: () => request<Task[]>({ method: "GET", path: "/tasks" }),
    get: (id: string) => request<Task>({ method: "GET", path: `/tasks/${id}` }),
    create: (input: CreateTaskInput) =>
      request<Task>({ method: "POST", path: "/tasks", body: input }),
    patch: (id: string, input: PatchTaskInput) =>
      request<Task>({ method: "PATCH", path: `/tasks/${id}`, body: input }),
    delete: (id: string) =>
      request<void>({ method: "DELETE", path: `/tasks/${id}` }),
  },

  developers: {
    list: () => request<Developer[]>({ method: "GET", path: "/developers" }),
    get: (id: string) =>
      request<Developer>({ method: "GET", path: `/developers/${id}` }),
    create: (input: CreateDeveloperInput) =>
      request<Developer>({ method: "POST", path: "/developers", body: input }),
    patch: (id: string, input: PatchDeveloperInput) =>
      request<Developer>({
        method: "PATCH",
        path: `/developers/${id}`,
        body: input,
      }),
    delete: (id: string) =>
      request<void>({ method: "DELETE", path: `/developers/${id}` }),
  },

  skills: {
    list: () => request<Skill[]>({ method: "GET", path: "/skills" }),
    get: (id: string) =>
      request<Skill>({ method: "GET", path: `/skills/${id}` }),
    create: (input: CreateSkillInput) =>
      request<Skill>({ method: "POST", path: "/skills", body: input }),
    patch: (id: string, input: PatchSkillInput) =>
      request<Skill>({ method: "PATCH", path: `/skills/${id}`, body: input }),
    delete: (id: string) =>
      request<void>({ method: "DELETE", path: `/skills/${id}` }),
  },

  categories: {
    list: () => request<Category[]>({ method: "GET", path: "/categories" }),
    get: (id: string) =>
      request<Category>({ method: "GET", path: `/categories/${id}` }),
  },

  agentTask: {
    propose: (input: AgentTaskProposalRequest) =>
      request<AgentTaskProposalResponse>({
        method: "POST",
        path: "/agent-task/proposals",
        body: input,
      }),
    apply: (input: AgentTaskApplyRequest) =>
      request<AgentTaskApplyResponse>({
        method: "POST",
        path: "/agent-task/apply",
        body: input,
      }),
  },
};
