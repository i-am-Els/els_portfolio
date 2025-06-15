export type Database = {
  public: {
    Tables: {
      // Add your table definitions here
      // Example:
      // users: {
      //   Row: {
      //     id: string
      //     created_at: string
      //     // ... other fields
      //   }
      //   Insert: {
      //     id?: string
      //     created_at?: string
      //     // ... other fields
      //   }
      //   Update: {
      //     id?: string
      //     created_at?: string
      //     // ... other fields
      //   }
      // }
    }
  }
}

export type {
  Session,
  User,
  AuthError,
} from '@supabase/supabase-js';
