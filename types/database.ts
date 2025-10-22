export interface Database {
  public: {
    Tables: {
      applicants: {
        Row: {
          id: string
          auth_user_id: string | null
          email: string
          first_name: string
          last_name: string
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          profession: string | null
          experience_level: string | null
          education_level: string | null
          certifications: string | null
          is_active: boolean
          email_verified: boolean
          marketing_opt_in: boolean
          created_at: string
          updated_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          email: string
          first_name: string
          last_name: string
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          profession?: string | null
          experience_level?: string | null
          education_level?: string | null
          certifications?: string | null
          is_active?: boolean
          email_verified?: boolean
          marketing_opt_in?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          auth_user_id?: string | null
          email?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          profession?: string | null
          experience_level?: string | null
          education_level?: string | null
          certifications?: string | null
          is_active?: boolean
          email_verified?: boolean
          marketing_opt_in?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
      }
      employers: {
        Row: {
          id: string
          auth_user_id: string | null
          email: string
          first_name: string
          last_name: string
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          company_name: string
          company_type: string | null
          facility_size: string | null
          is_active: boolean
          email_verified: boolean
          marketing_opt_in: boolean
          created_at: string
          updated_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          email: string
          first_name: string
          last_name: string
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          company_name: string
          company_type?: string | null
          facility_size?: string | null
          is_active?: boolean
          email_verified?: boolean
          marketing_opt_in?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          auth_user_id?: string | null
          email?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          company_name?: string
          company_type?: string | null
          facility_size?: string | null
          is_active?: boolean
          email_verified?: boolean
          marketing_opt_in?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
      }
      job_applications: {
        Row: {
          id: string
          applicant_id: string | null
          employer_id: string | null
          job_title: string
          job_type: string | null
          status: string
          cover_letter: string | null
          resume_url: string | null
          notes: string | null
          applied_date: string
          updated_at: string
          interview_date: string | null
          interview_time: string | null
          interview_location: string | null
          interviewer: string | null
          interview_notes: string | null
          offer_deadline: string | null
          offer_details: string | null
          offer_salary_min: number | null
          offer_salary_max: number | null
          offer_salary_type: string | null
        }
        Insert: {
          id?: string
          applicant_id?: string | null
          employer_id?: string | null
          job_title: string
          job_type?: string | null
          status?: string
          cover_letter?: string | null
          resume_url?: string | null
          notes?: string | null
          applied_date?: string
          updated_at?: string
          interview_date?: string | null
          interview_time?: string | null
          interview_location?: string | null
          interviewer?: string | null
          interview_notes?: string | null
          offer_deadline?: string | null
          offer_details?: string | null
          offer_salary_min?: number | null
          offer_salary_max?: number | null
          offer_salary_type?: string | null
        }
        Update: {
          id?: string
          applicant_id?: string | null
          employer_id?: string | null
          job_title?: string
          job_type?: string | null
          status?: string
          cover_letter?: string | null
          resume_url?: string | null
          notes?: string | null
          applied_date?: string
          updated_at?: string
          interview_date?: string | null
          interview_time?: string | null
          interview_location?: string | null
          interviewer?: string | null
          interview_notes?: string | null
          offer_deadline?: string | null
          offer_details?: string | null
          offer_salary_min?: number | null
          offer_salary_max?: number | null
          offer_salary_type?: string | null
        }
      }
      subscription_plans: {
        Row: {
          id: number
          name: string
          price: number
          billing_period: string
          max_users: number
          max_facilities: number
          max_api_calls: number
          storage_gb: number
          features: string[]
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          price: number
          billing_period: string
          max_users?: number
          max_facilities?: number
          max_api_calls?: number
          storage_gb?: number
          features?: string[]
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          price?: number
          billing_period?: string
          max_users?: number
          max_facilities?: number
          max_api_calls?: number
          storage_gb?: number
          features?: string[]
          created_at?: string
        }
      }
      user_subscriptions: {
        Row: {
          id: number
          user_id: string
          plan_id: number
          status: string
          current_period_start: string
          current_period_end: string
          created_at: string
          subscription_plans?: SubscriptionPlan
        }
        Insert: {
          id?: number
          user_id: string
          plan_id: number
          status?: string
          current_period_start?: string
          current_period_end?: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          plan_id?: number
          status?: string
          current_period_start?: string
          current_period_end?: string
          created_at?: string
        }
      }
      dashboard_access: {
        Row: {
          id: number
          dashboard_name: string
          dashboard_path: string
          required_plan: string
          is_premium: boolean
          description: string | null
        }
        Insert: {
          id?: number
          dashboard_name: string
          dashboard_path: string
          required_plan: string
          is_premium?: boolean
          description?: string | null
        }
        Update: {
          id?: number
          dashboard_name?: string
          dashboard_path?: string
          required_plan?: string
          is_premium?: boolean
          description?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Applicant = Database["public"]["Tables"]["applicants"]["Row"]
export type Employer = Database["public"]["Tables"]["employers"]["Row"]
export type JobApplication = Database["public"]["Tables"]["job_applications"]["Row"]
export type SubscriptionPlan = Database["public"]["Tables"]["subscription_plans"]["Row"]
export type UserSubscription = Database["public"]["Tables"]["user_subscriptions"]["Row"]
export type DashboardAccess = Database["public"]["Tables"]["dashboard_access"]["Row"]
