export type CanvasStatus = "idle" | "drawing" | "saving" | "error";
export type Tool = "brush" | "circle" | "eraser";
export type Point = {
    x: number; // 0-100 (percentage)
    y: number; // 0-100 (percentage)
};
