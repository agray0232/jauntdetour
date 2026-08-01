import React from "react";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import BrandMark from "./BrandMark";

describe("BrandMark", () => {
  it("provides an accessible product name and stable dimensions", () => {
    render(<BrandMark size={48} />);

    const mark = screen.getByRole("img", { name: "JauntDetour" });
    expect(mark).toHaveAttribute("height", "48");
    expect(mark).toHaveAttribute("width", "48");
  });

  it("can be hidden when adjacent text already names the product", () => {
    render(<BrandMark decorative />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("has no automated accessibility violations", async () => {
    const { container } = render(<BrandMark />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
