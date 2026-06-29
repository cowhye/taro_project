import { createClient } from "@supabase/supabase-js";

// 환경변수는 client/.env 파일에 설정 (client/.env.example 참고)
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY);
