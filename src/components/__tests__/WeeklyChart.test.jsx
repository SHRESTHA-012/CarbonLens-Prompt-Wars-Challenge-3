import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WeeklyChart } from "../WeeklyChart";

function makeDays(values) {
  return values.map((total, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (values.length - 1 - i));
    return { date: d.toISOString().slice(0, 10), total };
  });
}

describe("WeeklyChart", () => {
  it("renders a section with accessible label", () => {
    const history = makeDays([0, 0, 4, 6, 3, 8, 5]);
    render(<WeeklyChart dailyHistory={history} userTargetKg={5.5} />);
    expect(screen.getByRole("region", { name: /7-day carbon history/i })).toBeInTheDocument();
  });

  it("renders 7 columns for 7 days of data", () => {
    const history = makeDays([1, 2, 3, 4, 5, 6, 7]);
    const { container } = render(<WeeklyChart dailyHistory={history} userTargetKg={5.5} />);
    expect(container.querySelectorAll(".weekly-chart__col")).toHaveLength(7);
  });

  it("displays non-zero bar labels", () => {
    const history = makeDays([0, 0, 0, 0, 0, 0, 4.5]);
    render(<WeeklyChart dailyHistory={history} userTargetKg={5.5} />);
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });
});
