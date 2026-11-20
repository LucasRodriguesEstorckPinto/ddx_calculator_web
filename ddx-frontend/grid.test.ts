import { describe, expect, it } from "vitest";

import {
  EMPTY_GRID_JSON,
  emptyGrid,
  gridToLatex,
  parseGrid,
} from "@/lib/grid";

describe("emptyGrid", () => {
  it("creates independent rows of empty strings", () => {
    const grid = emptyGrid(2, 3);
    expect(grid).toEqual([
      ["", "", ""],
      ["", "", ""],
    ]);
    grid[0][0] = "x";
    expect(grid[1][0]).toBe("");
  });

  it("exposes a 3x3 default as JSON", () => {
    expect(JSON.parse(EMPTY_GRID_JSON)).toEqual(emptyGrid(3, 3));
  });
});

describe("parseGrid", () => {
  it("reads a rectangular grid and coerces cells to strings", () => {
    expect(parseGrid('[[1,"x"],[null,"3"]]')).toEqual([
      ["1", "x"],
      ["", "3"],
    ]);
  });

  it.each([
    ["invalid json", "not json"],
    ["non-array", "{}"],
    ["scalar", "5"],
    ["empty array", "[]"],
    ["empty row", "[[]]"],
    ["rows that are not arrays", "[1,2]"],
    ["ragged rows", '[["1","2"],["3"]]'],
    ["a plain expression", "x**2 + 1"],
  ])("returns null for %s", (_label, input) => {
    expect(parseGrid(input)).toBeNull();
  });
});

describe("gridToLatex", () => {
  it("builds a bmatrix, treating blank cells as zero", () => {
    expect(
      gridToLatex([
        ["1", " "],
        ["", " x "],
      ])
    ).toBe("\\begin{bmatrix} 1 & 0 \\\\ 0 & x \\end{bmatrix}");
  });
});
