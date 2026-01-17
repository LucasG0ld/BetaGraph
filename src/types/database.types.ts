/**
 * Database Types for BetaGraph
 * 
 * Generated from PostgreSQL schema (migrations/001_initial_schema.sql)
 * Reflects the 2-table model: profiles, boulders, betas
 * 
 * Usage:
 * ```typescript
 * import { Database } from '@/types/database.types';
 * const supabase = createClient<Database>(...);
 * ```
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    username: string;
                    preferred_grading_system: 'fontainebleau' | 'v_scale';
                    created_at: string;
                };
                Insert: {
                    id: string;
                    username: string;
                    preferred_grading_system?: 'fontainebleau' | 'v_scale';
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    username?: string;
                    preferred_grading_system?: 'fontainebleau' | 'v_scale';
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'profiles_id_fkey';
                        columns: ['id'];
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    }
                ];
            };
            boulders: {
                Row: {
                    id: string;
                    creator_id: string | null;
                    name: string;
                    location: string | null;
                    image_url: string;
                    deleted_at: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    creator_id?: string | null;
                    name: string;
                    location?: string | null;
                    image_url: string;
                    deleted_at?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    creator_id?: string | null;
                    name?: string;
                    location?: string | null;
                    image_url?: string;
                    deleted_at?: string | null;
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'boulders_creator_id_fkey';
                        columns: ['creator_id'];
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    }
                ];
            };
            betas: {
                Row: {
                    id: string;
                    boulder_id: string;
                    user_id: string;
                    grade_value: string;
                    grade_system: 'fontainebleau' | 'v_scale';
                    drawing_data: Json;
                    is_public: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    boulder_id: string;
                    user_id: string;
                    grade_value: string;
                    grade_system: 'fontainebleau' | 'v_scale';
                    drawing_data: Json;
                    is_public?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    boulder_id?: string;
                    user_id?: string;
                    grade_value?: string;
                    grade_system?: 'fontainebleau' | 'v_scale';
                    drawing_data?: Json;
                    is_public?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'betas_boulder_id_fkey';
                        columns: ['boulder_id'];
                        referencedRelation: 'boulders';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'betas_user_id_fkey';
                        columns: ['user_id'];
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    }
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            grading_system_enum: 'fontainebleau' | 'v_scale';
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}
