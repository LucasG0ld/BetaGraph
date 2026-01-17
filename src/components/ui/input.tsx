import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-11 w-full rounded-lg border border-brand-gray-600 bg-brand-gray-800 px-4 py-2 text-white placeholder:text-brand-gray-300 focus:border-brand-accent-cyan focus:outline-none focus:ring-2 focus:ring-brand-accent-cyan/20 transition-all",
                    error &&
                    "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);

Input.displayName = "Input";
