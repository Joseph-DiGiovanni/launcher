import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { arch, type } from "@tauri-apps/plugin-os";
import {
  isAVXRequirementMet,
  isDiskSpaceRequirementMet,
  isOpenGLRequirementMet,
} from "$lib/rpc/config";
import { requirementsStore } from "./requirements-store";

vi.mock("@tauri-apps/plugin-os");
vi.mock("$lib/rpc/config");
vi.mock("/src/state/SystemInfoState.svelte", () => ({
  systemInfoState: { isMinVCCRuntimeInstalled: true },
}));

describe("requirementsStore.refresh", () => {
  beforeEach(() => {
    vi.mocked(type).mockReturnValue("linux");
    vi.mocked(isOpenGLRequirementMet).mockResolvedValue(true);
    vi.mocked(isDiskSpaceRequirementMet).mockResolvedValue(true);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("requires AVX on x86_64 linux", async () => {
    vi.mocked(arch).mockReturnValue("x86_64");
    vi.mocked(isAVXRequirementMet).mockResolvedValue(false);
    const result = await requirementsStore.refresh("jak1");
    expect(result.isAVXRelevant).toBe(true);
    expect(result.requirementsMet).toBe(false);
  });

  it("does not require AVX on aarch64 linux", async () => {
    vi.mocked(arch).mockReturnValue("aarch64");
    const result = await requirementsStore.refresh("jak1");
    expect(isAVXRequirementMet).not.toHaveBeenCalled();
    expect(result.isUnsupportedARMPlatform).toBe(false);
    expect(result.requirementsMet).toBe(true);
  });

  it("still checks OpenGL on aarch64 linux", async () => {
    vi.mocked(arch).mockReturnValue("aarch64");
    vi.mocked(isOpenGLRequirementMet).mockResolvedValue(false);
    const result = await requirementsStore.refresh("jak1");
    expect(result.requirementsMet).toBe(false);
  });

  it("rejects aarch64 windows", async () => {
    vi.mocked(arch).mockReturnValue("aarch64");
    vi.mocked(type).mockReturnValue("windows");
    const result = await requirementsStore.refresh("jak1");
    expect(result.isUnsupportedARMPlatform).toBe(true);
    expect(result.requirementsMet).toBe(false);
  });
});
