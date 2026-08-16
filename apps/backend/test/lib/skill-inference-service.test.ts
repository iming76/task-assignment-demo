import { describe, it, expect, vi, afterEach } from "vitest";
import { DefaultSkillInferenceService } from "../../src/lib/skill-inference/skill-inference-service.js";
import { SkillInferenceProviderError } from "../../src/lib/skill-inference/skill-inference-provider.js";
import { FakeSkillInferenceProvider } from "./fake-skill-inference-provider.js";
import { FakeSkillRepository } from "./fake-skill-repository.js";

const skills = [
  { id: "skill-react", name: "React", description: "UI", categoryId: "c1" },
  {
    id: "skill-node",
    name: "Node.js",
    description: "Backend",
    categoryId: "c2",
  },
];

function buildService(onInfer: (request: unknown) => Promise<string[]>) {
  const provider = new FakeSkillInferenceProvider(onInfer);
  const repository = new FakeSkillRepository(skills);
  return {
    provider,
    service: new DefaultSkillInferenceService(provider, repository),
  };
}

describe("DefaultSkillInferenceService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves canonical ids and deduplicates the provider's output", async () => {
    const { service } = buildService(async () => [
      "skill-react",
      "skill-react",
    ]);

    const result = await service.inferSkillIds({
      title: "Build UI",
      description: "React work.",
    });

    expect(result).toEqual(["skill-react"]);
  });

  it("passes the current categorized skill catalog as context", async () => {
    let seenAvailableSkills: unknown;
    const { service } = buildService(async (request) => {
      seenAvailableSkills = (request as { availableSkills: unknown })
        .availableSkills;
      return [];
    });

    await service.inferSkillIds({ title: "T", description: "D" });

    expect(seenAvailableSkills).toEqual(skills);
  });

  it("falls back to an empty list when the provider is not configured or fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { service } = buildService(async () => {
      throw new SkillInferenceProviderError("provider unavailable");
    });

    const result = await service.inferSkillIds({
      title: "T",
      description: "D",
    });

    expect(result).toEqual([]);
  });

  it("falls back to an empty list on any unexpected provider error, including timeouts", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { service } = buildService(async () => {
      throw new Error("timed out");
    });

    const result = await service.inferSkillIds({
      title: "T",
      description: "D",
    });

    expect(result).toEqual([]);
  });

  it("falls back to an empty list when the provider returns an unknown skill id, rejecting the whole result", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { service } = buildService(async () => [
      "skill-react",
      "skill-unknown",
    ]);

    const result = await service.inferSkillIds({
      title: "T",
      description: "D",
    });

    expect(result).toEqual([]);
  });

  it("returns an empty list for a genuinely empty provider result", async () => {
    const { service } = buildService(async () => []);

    const result = await service.inferSkillIds({
      title: "T",
      description: "D",
    });

    expect(result).toEqual([]);
  });

  it("logs a sanitized reason without leaking title or description on fallback", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { service } = buildService(async () => {
      throw new SkillInferenceProviderError("provider unavailable");
    });

    await service.inferSkillIds({
      title: "secret project title",
      description: "secret project description",
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const loggedMessage = warnSpy.mock.calls[0]?.[0] as string;
    expect(loggedMessage).not.toContain("secret project title");
    expect(loggedMessage).not.toContain("secret project description");
  });

  it("issues independent inference requests for separate calls", async () => {
    const { service, provider } = buildService(async (request) =>
      (request as { title: string }).title === "Root" ? ["skill-node"] : [],
    );

    const rootResult = await service.inferSkillIds({
      title: "Root",
      description: "D",
    });
    const childResult = await service.inferSkillIds({
      title: "Child",
      description: "D",
    });

    expect(rootResult).toEqual(["skill-node"]);
    expect(childResult).toEqual([]);
    expect(provider.callCount).toBe(2);
  });
});
