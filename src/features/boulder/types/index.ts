export type BoulderStatus = "idle" | "loading" | "success" | "error";
export type Boulder = {
    id: string;
    name: string;
    location: string;
    grade_value: string;
    grade_system: "fontainebleau" | "v_scale";
    image_url: string;
    created_at: string;
    updated_at: string;
    is_public: boolean;
};
