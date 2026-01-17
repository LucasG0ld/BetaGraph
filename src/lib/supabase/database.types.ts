/**
 * Database Type Helpers
 * 
 * Provides convenient type aliases for working with database entities.
 * These types are extracted from the main Database type definition.
 * 
 * @see src/types/database.types.ts
 */

import type { Database } from '@/types/database.types';

// ============================================
// Table Row Types
// ============================================

/**
 * Profile - User profile extending auth.users
 */
export type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Boulder - Physical climbing boulder (image + metadata)
 */
export type Boulder = Database['public']['Tables']['boulders']['Row'];

/**
 * Beta - User-drawn climbing route on a boulder
 */
export type Beta = Database['public']['Tables']['betas']['Row'];

// ============================================
// Insert Types
// ============================================

/**
 * ProfileInsert - Data required/optional when creating a profile
 */
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

/**
 * BoulderInsert - Data required/optional when creating a boulder
 */
export type BoulderInsert = Database['public']['Tables']['boulders']['Insert'];

/**
 * BetaInsert - Data required/optional when creating a beta
 */
export type BetaInsert = Database['public']['Tables']['betas']['Insert'];

// ============================================
// Update Types
// ============================================

/**
 * ProfileUpdate - Fields that can be updated on a profile
 */
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * BoulderUpdate - Fields that can be updated on a boulder
 */
export type BoulderUpdate = Database['public']['Tables']['boulders']['Update'];

/**
 * BetaUpdate - Fields that can be updated on a beta
 */
export type BetaUpdate = Database['public']['Tables']['betas']['Update'];

// ============================================
// Enums
// ============================================

/**
 * GradingSystem - Supported grading systems
 */
export type GradingSystem = Database['public']['Enums']['grading_system_enum'];

// ============================================
// Utility Types
// ============================================

/**
 * Json - Generic JSON type for JSONB columns (e.g., drawing_data)
 */
export type Json = Database['public']['Tables']['betas']['Row']['drawing_data'];

/**
 * ActiveBoulder - Boulder with deleted_at = null
 */
export type ActiveBoulder = Omit<Boulder, 'deleted_at'> & {
    deleted_at: null;
};

/**
 * PublicBeta - Beta that is publicly visible
 */
export type PublicBeta = Omit<Beta, 'is_public'> & {
    is_public: true;
};
