import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CommunityPage from "./CommunityPage";

const mockSetSearchParams = vi.fn();
const mockConfirm = vi.fn();
const mockShowError = vi.fn();
const mockShowSuccess = vi.fn();
const routeSearchParams = { current: new URLSearchParams() };

vi.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useSearchParams: () => [
    routeSearchParams.current,
    (nextParams) => {
      routeSearchParams.current = nextParams;
      mockSetSearchParams(nextParams);
    },
  ],
}));

vi.mock("../hooks/useModal", () => ({
  useModal: () => ({
    confirm: mockConfirm,
    showError: mockShowError,
    showSuccess: mockShowSuccess,
  }),
}));

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    user: { role: "SUPER_ADMIN", fullName: "Test Admin" },
    isAuthenticated: true,
  }),
}));

vi.mock("../hooks/useTheme", () => ({
  useTheme: () => ({ theme: "light" }),
}));

vi.mock("../components/AuthShowcase", () => ({
  default: () => <div>Auth Showcase</div>,
}));

vi.mock("../services/localStorageService", () => ({
  default: {
    getToken: () => "demo-token",
  },
}));

vi.mock("../services/communityApi", () => ({
  communityApi: {
    listPosts: vi.fn().mockResolvedValue({
      posts: [
        {
          id: "blog-1",
          title: "Test Editorial Blog",
          content: "This is a blog article about product engineering.",
          createdAt: "2025-01-15T12:00:00.000Z",
          type: "blog",
          likeCount: 12,
          upvoteCount: 6,
          commentCount: 2,
        },
      ],
    }),
    listComments: vi.fn().mockResolvedValue({ comments: [] }),
    listUsers: vi.fn(),
    listFriendRequests: vi.fn(),
    listFriendMessages: vi.fn(),
    sendFriendMessage: vi.fn(),
    respondToFriendRequest: vi.fn(),
    removePost: vi.fn(),
    toggleLike: vi.fn(),
    createComment: vi.fn(),
    sendFriendRequest: vi.fn(),
    createPost: vi.fn(),
    updatePost: vi.fn(),
  },
}));

describe("CommunityPage blog rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetSearchParams.mockReset();
    routeSearchParams.current = new URLSearchParams();
  });

  it("renders the blog-only view and automatically switches to the blog tab", async () => {
    render(<CommunityPage blogOnly />);

    expect(
      await screen.findByRole("heading", { name: /devportix blog/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/editorial journal/i)).toBeInTheDocument();
    expect(await screen.findByText(/test editorial blog/i)).toBeInTheDocument();
  });

  it("keeps the blog content visible when the initial tab is chat", async () => {
    render(<CommunityPage initialTab="chat" blogOnly />);

    expect(
      await screen.findByRole("heading", { name: /devportix blog/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        /this is a blog article about product engineering/i,
      ),
    ).toBeInTheDocument();
  });

  it("does not loop repeatedly when syncing the blog URL param", async () => {
    routeSearchParams.current = new URLSearchParams("post=blog-1");

    render(<CommunityPage blogOnly />);

    await screen.findByText(/test editorial blog/i);
    expect(mockSetSearchParams.mock.calls.length).toBeLessThanOrEqual(1);
  });
});
