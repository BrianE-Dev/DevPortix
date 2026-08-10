import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Login from "./Login";

const mockLogin = vi.fn();
const mockSignup = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    login: mockLogin,
    signup: mockSignup,
  }),
}));

vi.mock("../hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "light",
  }),
}));

vi.mock("react-router-dom", () => ({
  Link: ({ children, to }) => (
    <a href={to}>{children}</a>
  ),

  useNavigate: () => mockNavigate,

  useSearchParams: () => [
    new URLSearchParams(),
  ],
}));

vi.mock("../components/AuthShowcase", () => ({
  default: () => <div>Auth Showcase</div>,
}));

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the login form", () => {
    render(<Login />);

    expect(
      screen.getByRole("heading", {
        name: /welcome back to devportix/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("you@example.com")
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Enter your password")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Sign in",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Try Demo Account",
      })
    ).toBeInTheDocument();
  });
});