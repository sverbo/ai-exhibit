import { describe, expect, it } from "vitest";
import { stageOwner } from "./stage.ts";

describe("stageOwner", () => {
  it("prefers a presenter view, then the window that joined first", () => {
    expect(stageOwner([])).toBeNull();
    expect(stageOwner([{ clientId: "p", role: "projector" }, { clientId: "r", role: "projector" }])).toBeNull();
    // An old solo tab (e.g. /present) and a projector acting alone: the older one runs the stage.
    expect(stageOwner([{ clientId: "b", role: "solo", since: 1 }, { clientId: "a", role: "solo", since: 2 }])).toBe("b");
    // A presenter opened later still wins over both.
    expect(
      stageOwner([
        { clientId: "b", role: "solo", since: 1 },
        { clientId: "a", role: "solo", since: 2 },
        { clientId: "z", role: "presenter", since: 3 },
      ]),
    ).toBe("z");
    // Two presenters: the first one; relay lists carry no `since`, their order is the joining order.
    expect(stageOwner([{ clientId: "y", role: "presenter" }, { clientId: "x", role: "presenter" }])).toBe("y");
    // Same join time: the smaller id, whatever the list order.
    expect(stageOwner([{ clientId: "d", role: "solo", since: 5 }, { clientId: "c", role: "solo", since: 5 }])).toBe("c");
  });

  it("prefers a visible window: a hidden presenter hands the stage to a visible projector", () => {
    const presenter = { clientId: "z", role: "presenter" as const, since: 1 };
    const projector = { clientId: "p", role: "solo" as const, since: 2 };
    expect(stageOwner([presenter, projector])).toBe("z");
    expect(stageOwner([{ ...presenter, hidden: true }, projector])).toBe("p");
    // Everyone hidden: the usual rule.
    expect(stageOwner([{ ...presenter, hidden: true }, { ...projector, hidden: true }])).toBe("z");
  });
});
