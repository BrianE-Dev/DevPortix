import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Pricing from "./Pricing";

const mockNavigate = vi.fn();
const mockSetAuthenticatedUser = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams()],
}));

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    loading: false,
    user: undefined,
    setAuthenticatedUser: mockSetAuthenticatedUser,
  }),
}));

vi.mock("../hooks/useTheme", () => ({
  useTheme: () => ({ theme: "light" }),
}));

describe("Pricing component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the pricing page header and plans", () => {
    render(<Pricing />);

    expect(
      screen.getByRole("heading", { name: /simple, transparent pricing/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /monthly/i }),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /annual/i })).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /^basic$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^standard$/i }),
    ).toBeInTheDocument();
  });

  it("switches billing mode when annual is selected", () => {
    render(<Pricing />);

    fireEvent.click(screen.getByRole("button", { name: /annual/i }));

    expect(screen.getByRole("button", { name: /annual/i })).toHaveClass(
      "bg-slate-900",
    );
  });
});
