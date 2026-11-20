export const DEFAULT_GRID_SIZE = 3;

export function emptyGrid(rows: number, cols: number): string[][] {
  return Array.from({ length: rows }, () => Array<string>(cols).fill(""));
}

export const EMPTY_GRID_JSON = JSON.stringify(
  emptyGrid(DEFAULT_GRID_SIZE, DEFAULT_GRID_SIZE)
);

export function parseGrid(expression: string): string[][] | null {
  let data: unknown;
  try {
    data = JSON.parse(expression);
  } catch {
    return null;
  }

  if (!Array.isArray(data) || data.length === 0) return null;

  const width = Array.isArray(data[0]) ? data[0].length : 0;
  const isRectangular = data.every(
    (row) => Array.isArray(row) && row.length === width
  );
  if (width === 0 || !isRectangular) return null;

  return (data as unknown[][]).map((row) =>
    row.map((cell) => String(cell ?? ""))
  );
}

export function gridToLatex(grid: string[][]): string {
  const body = grid
    .map((row) => row.map((cell) => cell.trim() || "0").join(" & "))
    .join(" \\\\ ");
  return `\\begin{bmatrix} ${body} \\end{bmatrix}`;
}