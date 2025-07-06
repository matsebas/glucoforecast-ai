import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("debería combinar clases usando clsx y tailwind-merge", () => {
    const result = cn("p-4", "text-red-500");
    expect(result).toBe("p-4 text-red-500");
  });

  it("debería manejar clases condicionales", () => {
    const condition = false;
    const result = cn("p-4", condition && "hidden", "text-red-500");
    expect(result).toBe("p-4 text-red-500");
  });

  it("debería resolver conflictos de Tailwind CSS", () => {
    const result = cn("p-4", "p-2");
    expect(result).toBe("p-2");
  });

  it("debería manejar arrays de clases", () => {
    const result = cn(["p-4", "text-red-500"]);
    expect(result).toBe("p-4 text-red-500");
  });

  it("debería manejar strings vacíos y undefined", () => {
    const result = cn("", undefined, "p-4");
    expect(result).toBe("p-4");
  });
});
