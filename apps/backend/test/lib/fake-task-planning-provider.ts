import type {
  TaskPlanningContext,
  TaskPlanningProvider,
} from "../../src/lib/task-planning/task-planning-provider.js";

export class FakeTaskPlanningProvider implements TaskPlanningProvider {
  constructor(
    private readonly onGenerate: (
      context: TaskPlanningContext,
    ) => Promise<unknown>,
  ) {}

  generate(context: TaskPlanningContext): Promise<unknown> {
    return this.onGenerate(context);
  }
}
