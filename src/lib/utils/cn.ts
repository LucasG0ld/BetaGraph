import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and twMerge for deduplication
 *
 * @example
 * cn("px-4 py-2", "bg-blue-500", { "text-white": true })
 * // => "px-4 py-2 bg-blue-500 text-white"
 *
 * cn("px-4 px-8") // twMerge removes duplicate
 * // => "px-8"
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
