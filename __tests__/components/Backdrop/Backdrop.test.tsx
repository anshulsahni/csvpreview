import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Backdrop from "@/app/components/Backdrop";

describe("Backdrop", () => {
  it("renders its children", () => {
    render(
      <Backdrop>
        <span>panel</span>
      </Backdrop>
    );

    expect(screen.getByText("panel")).toBeInTheDocument();
  });

  it("defaults to the modal stacking level", () => {
    render(
      <Backdrop data-testid="scrim">
        <span>panel</span>
      </Backdrop>
    );

    expect(screen.getByTestId("scrim")).toHaveAttribute("data-level", "modal");
  });

  it("marks the overlay level so it can stack above dialogs", () => {
    render(
      <Backdrop level="overlay" data-testid="scrim">
        <span>panel</span>
      </Backdrop>
    );

    expect(screen.getByTestId("scrim")).toHaveAttribute("data-level", "overlay");
  });

  it("passes semantics and handlers through to the scrim element", async () => {
    const onClick = jest.fn();
    render(
      <Backdrop role="presentation" aria-busy="true" onClick={onClick}>
        <span>panel</span>
      </Backdrop>
    );

    const scrim = screen.getByRole("presentation");
    expect(scrim).toHaveAttribute("aria-busy", "true");

    await userEvent.click(scrim);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
