import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BalanceSummary } from "../BalanceSummary";

const defaultProps = {
  grandTotal: 8,
  totalSavings: 1.5,
  netBalance: 6.5,
  benchmarkComparison: { status: "below_average", percentVsBenchmark: -30, percentVsTarget: 18 },
  userTargetKg: 5.5,
  streak: 0,
  onSetTarget: vi.fn(),
};

describe("BalanceSummary", () => {
  it("renders the net balance value", () => {
    render(<BalanceSummary {...defaultProps} />);
    expect(screen.getByText("6.50")).toBeInTheDocument();
  });

  it("shows the correct status label for below_average", () => {
    render(<BalanceSummary {...defaultProps} />);
    expect(screen.getByText(/below national average/i)).toBeInTheDocument();
  });

  it("shows within_target status correctly", () => {
    render(
      <BalanceSummary
        {...defaultProps}
        benchmarkComparison={{ status: "within_target", percentVsBenchmark: -60, percentVsTarget: -20 }}
        netBalance={4}
      />
    );
    expect(screen.getByText(/within your target/i)).toBeInTheDocument();
  });

  it("shows streak when greater than zero", () => {
    render(<BalanceSummary {...defaultProps} streak={3} />);
    expect(screen.getByText(/3 days under target/i)).toBeInTheDocument();
  });

  it("hides streak when zero", () => {
    render(<BalanceSummary {...defaultProps} streak={0} />);
    expect(screen.queryByText(/days under target/i)).not.toBeInTheDocument();
  });

  it("calls onSetTarget when target button is clicked", async () => {
    const onSetTarget = vi.fn();
    render(<BalanceSummary {...defaultProps} onSetTarget={onSetTarget} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /daily target/i }));
    expect(onSetTarget).toHaveBeenCalledOnce();
  });

  it("displays logged total and savings in breakdown", () => {
    render(<BalanceSummary {...defaultProps} />);
    expect(screen.getByText("8.00 kg")).toBeInTheDocument();
    expect(screen.getByText("−1.50 kg")).toBeInTheDocument();
  });
});
