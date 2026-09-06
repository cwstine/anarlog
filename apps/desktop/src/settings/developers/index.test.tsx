import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkEmbeddedCli: vi.fn(),
  installEmbeddedCli: vi.fn(),
  listSkillAgents: vi.fn(),
  installAgentSkill: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  toastWarning: vi.fn(),
}));

vi.mock("~/types/tauri.gen", () => ({
  commands: {
    checkEmbeddedCli: mocks.checkEmbeddedCli,
    installEmbeddedCli: mocks.installEmbeddedCli,
    listSkillAgents: mocks.listSkillAgents,
    installAgentSkill: mocks.installAgentSkill,
  },
}));

vi.mock("@anlg/ui/components/ui/dropdown-menu", () => ({
  appFloatingMenuPanelClassName: "overflow-hidden p-1.5",
  AppFloatingPanel: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@anlg/plugin-local-api", () => ({
  commands: {
    listWebhooks: vi.fn().mockResolvedValue({ status: "ok", data: [] }),
  },
}));

vi.mock("@anlg/ui/components/ui/toast", () => ({
  sonnerToast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
    warning: mocks.toastWarning,
  },
}));

import {
  SettingsDevelopers,
  buildMcpConfiguration,
  getCliInstallNotification,
} from "./index";

describe("buildMcpConfiguration", () => {
  it("uses the exact installed CLI path", () => {
    const configuration = JSON.parse(
      buildMcpConfiguration("/Users/test/.local/bin/corola"),
    );

    expect(configuration).toEqual({
      mcpServers: {
        corola: {
          command: "/Users/test/.local/bin/corola",
          args: ["mcp"],
        },
      },
    });
  });
});

describe("getCliInstallNotification", () => {
  it("reports installed as success", () => {
    expect(
      getCliInstallNotification({
        supported: true,
        commandName: "corola",
        installPath: "/Users/test/.local/bin/corola",
        state: "installed",
        details: "Installed.",
      }),
    ).toEqual({ type: "success", message: "corola is ready to use" });
  });

  it.each(["resource_missing", "unsupported"] as const)(
    "reports %s as an install error",
    (state) => {
      expect(
        getCliInstallNotification({
          supported: false,
          commandName: "corola",
          installPath: "/Users/test/.local/bin/corola",
          state,
          details: "The CLI is unavailable in this build.",
        }),
      ).toEqual({
        type: "error",
        message: "The CLI is unavailable in this build.",
      });
    },
  );
});

describe("SettingsDevelopers", () => {
  beforeEach(() => {
    mocks.checkEmbeddedCli.mockReset();
    mocks.installEmbeddedCli.mockReset();
    mocks.listSkillAgents.mockReset();
    mocks.listSkillAgents.mockResolvedValue({ status: "ok", data: [] });
    mocks.installAgentSkill.mockReset();
    mocks.toastError.mockReset();
    mocks.toastSuccess.mockReset();
    mocks.toastWarning.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("does not link to product-hosted documentation", () => {
    mocks.checkEmbeddedCli.mockResolvedValue({
      status: "ok",
      data: {
        supported: true,
        commandName: "corola",
        installPath: "/Users/test/.local/bin/corola",
        state: "installed",
        details: "Installed.",
      },
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <SettingsDevelopers />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("heading", { name: "Developers" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Guide" })).toBeNull();
  });

  it("uses the installed CLI path when copying the MCP configuration", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    mocks.checkEmbeddedCli.mockResolvedValue({
      status: "ok",
      data: {
        supported: true,
        commandName: "corola",
        installPath: "/Users/test/.local/bin/corola",
        state: "installed",
        details:
          "Installed at /Users/test/.local/bin/corola and managed by Corola.",
      },
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <SettingsDevelopers />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Reinstall")).toBeTruthy();
    expect(screen.getByLabelText("Installed")).toBeTruthy();
    expect(screen.queryByText("Installed")).toBeNull();
    expect(
      screen.queryByText(/\/Users\/test\/\.local\/bin\/corola/),
    ).toBeNull();
    expect(screen.queryByText("corola --json meetings list")).toBeNull();
    expect(screen.queryByText("corola mcp")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Copy config" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    expect(JSON.parse(writeText.mock.calls[0][0])).toEqual({
      mcpServers: {
        corola: {
          command: "/Users/test/.local/bin/corola",
          args: ["mcp"],
        },
      },
    });
  });

  it("does not expose a nonexistent MCP path when the CLI is unsupported", async () => {
    mocks.checkEmbeddedCli.mockResolvedValue({
      status: "ok",
      data: {
        supported: false,
        commandName: "corola-dev",
        installPath: "/Users/test/.local/bin/corola-dev",
        state: "unsupported",
        details: "Bundled CLI installation is currently available on macOS.",
      },
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <SettingsDevelopers />
      </QueryClientProvider>,
    );

    const copyButton = await screen.findByRole("button", {
      name: "Copy config",
    });
    expect(copyButton.hasAttribute("disabled")).toBe(true);
    expect(
      screen.queryByText(/\/Users\/test\/\.local\/bin\/corola-dev/),
    ).toBeNull();
  });

  it("installs the skill into every detected agent from one action", async () => {
    mocks.checkEmbeddedCli.mockResolvedValue({
      status: "ok",
      data: {
        supported: false,
        commandName: "corola",
        installPath: "/Users/test/.local/bin/corola",
        state: "unsupported",
        details: "Unavailable.",
      },
    });
    mocks.listSkillAgents.mockResolvedValue({
      status: "ok",
      data: [
        {
          agent: "claude_code",
          displayName: "Claude Code",
          detected: true,
          installed: true,
          skillPath: "/Users/test/.claude/skills/corola",
        },
        {
          agent: "codex",
          displayName: "Codex",
          detected: true,
          installed: false,
          skillPath: "/Users/test/.codex/skills/corola",
        },
        {
          agent: "cursor",
          displayName: "Cursor",
          detected: false,
          installed: false,
          skillPath: "/Users/test/.cursor/skills/corola",
        },
        {
          agent: "opencode",
          displayName: "OpenCode",
          detected: true,
          installed: false,
          skillPath: "/Users/test/.config/opencode/skills/corola",
        },
      ],
    });
    mocks.installAgentSkill.mockImplementation((agent: string) =>
      Promise.resolve({
        status: "ok",
        data: {
          agent,
          displayName: agent,
          detected: true,
          installed: true,
          skillPath: `/Users/test/${agent}`,
        },
      }),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <SettingsDevelopers />
      </QueryClientProvider>,
    );

    const cursorItem = await screen.findByRole("button", { name: "Cursor" });
    expect(cursorItem.hasAttribute("disabled")).toBe(true);
    expect(
      screen.getByRole("button", { name: /Claude Code/ }).querySelector("svg"),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Codex" }).querySelector("svg"),
    ).toBeTruthy();
    expect(cursorItem.querySelector("svg")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "OpenCode" }).querySelector("svg"),
    ).toBeTruthy();
    const installedIcon = screen.getByLabelText("Skill installed");
    expect(installedIcon.closest("button")?.textContent).toContain(
      "Claude Code",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Install to all agents" }),
    );

    await waitFor(() =>
      expect(mocks.installAgentSkill).toHaveBeenCalledTimes(3),
    );
    expect(mocks.installAgentSkill).toHaveBeenCalledWith("claude_code");
    expect(mocks.installAgentSkill).toHaveBeenCalledWith("codex");
    expect(mocks.installAgentSkill).toHaveBeenCalledWith("opencode");
    expect(mocks.installAgentSkill).not.toHaveBeenCalledWith("cursor");
    await waitFor(() =>
      expect(mocks.toastSuccess).toHaveBeenCalledWith(
        "Corola skill added to 3 agents",
      ),
    );
  });

  it("reports a single-agent skill install by agent name", async () => {
    mocks.checkEmbeddedCli.mockResolvedValue({
      status: "ok",
      data: {
        supported: false,
        commandName: "corola",
        installPath: "/Users/test/.local/bin/corola",
        state: "unsupported",
        details: "Unavailable.",
      },
    });
    mocks.listSkillAgents.mockResolvedValue({
      status: "ok",
      data: [
        {
          agent: "codex",
          displayName: "Codex",
          detected: true,
          installed: false,
          skillPath: "/Users/test/.codex/skills/corola",
        },
      ],
    });
    mocks.installAgentSkill.mockResolvedValue({
      status: "ok",
      data: {
        agent: "codex",
        displayName: "Codex",
        detected: true,
        installed: true,
        skillPath: "/Users/test/.codex/skills/corola",
      },
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <SettingsDevelopers />
      </QueryClientProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Codex" }));

    await waitFor(() =>
      expect(mocks.installAgentSkill).toHaveBeenCalledWith("codex"),
    );
    await waitFor(() =>
      expect(mocks.toastSuccess).toHaveBeenCalledWith(
        "Corola skill added to Codex",
      ),
    );
  });
});
