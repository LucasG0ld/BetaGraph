export type AuthStatus = "idle" | "loading" | "authenticated" | "error";
export type AuthError = {
    message: string;
    code?: string;
};
