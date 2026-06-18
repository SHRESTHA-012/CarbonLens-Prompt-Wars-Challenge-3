import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogEntryForm } from "../LogEntryForm";

function makeHandlers() {
  return {
    onAddTransport: vi.fn(),
    onAddEnergy: vi.fn(),
    onAddFood: vi.fn(),
    onAddWaste: vi.fn(),
  };
}

describe("LogEntryForm", () => {
  it("renders category pills and defaults to Transport", () => {
    render(<LogEntryForm {...makeHandlers()} />);
    expect(screen.getByRole("radio", { name: /transport/i })).toHaveAttribute("aria-checked", "true");
  });

  it("calls onAddTransport with the correct mode and distance on submit", async () => {
    const handlers = makeHandlers();
    render(<LogEntryForm {...handlers} />);
    const user = userEvent.setup();

    // Transport is already selected; default mode is car_petrol
    await user.clear(screen.getByRole("spinbutton"));
    await user.type(screen.getByRole("spinbutton"), "10");
    await user.click(screen.getByRole("button", { name: /add entry/i }));

    expect(handlers.onAddTransport).toHaveBeenCalledOnce();
    expect(handlers.onAddTransport).toHaveBeenCalledWith("car_petrol", 10);
  });

  it("shows an error for empty input and does not call handler", async () => {
    const handlers = makeHandlers();
    render(<LogEntryForm {...handlers} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /add entry/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(handlers.onAddTransport).not.toHaveBeenCalled();
  });

  it("shows an error for negative input", async () => {
    const handlers = makeHandlers();
    const { container } = render(<LogEntryForm {...handlers} />);

    // jsdom sanitizes type="number" — set value via property assignment to
    // ensure the React controlled state sees -5 as a string.
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "-5" } });

    // Submit the form directly to avoid userEvent / jsdom interaction quirks
    fireEvent.submit(container.querySelector("form"));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(handlers.onAddTransport).not.toHaveBeenCalled();
  });

  it("clears the input after a successful submission", async () => {
    const handlers = makeHandlers();
    render(<LogEntryForm {...handlers} />);
    const user = userEvent.setup();
    const input = screen.getByRole("spinbutton");

    await user.type(input, "20");
    await user.click(screen.getByRole("button", { name: /add entry/i }));
    expect(input).toHaveValue(null);
  });

  it("switches to Energy category and calls onAddEnergy", async () => {
    const handlers = makeHandlers();
    render(<LogEntryForm {...handlers} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("radio", { name: /energy/i }));
    await user.type(screen.getByRole("spinbutton"), "50");
    await user.click(screen.getByRole("button", { name: /add entry/i }));

    expect(handlers.onAddEnergy).toHaveBeenCalledOnce();
    expect(handlers.onAddEnergy).toHaveBeenCalledWith("electricity_grid", 50);
  });
});
