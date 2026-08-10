import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Reveal } from "../src/components/motion/reveal";

describe("Reveal", () => {
  it("does not hide server-rendered content with inline styles", () => {
    const markup = renderToStaticMarkup(
      createElement(
        Reveal,
        { delay: 0.1 } as ComponentProps<typeof Reveal>,
        "Visible without JavaScript",
      ),
    );

    expect(markup).toContain("Visible without JavaScript");
    expect(markup).toContain("--reveal-delay:0.1s");
    expect(markup).not.toContain("opacity:0");
    expect(markup).not.toContain("translateY");
  });
});
