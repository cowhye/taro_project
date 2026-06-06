import { createClient } from '@supabase/supabase-js'

// 새 프로젝트(agvpfoasjjqeixcgjinp) 주소와 키로 교체 완료!
export const supabase = createClient(
  'https://agvpfoasjjqeixcgjinp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFndnBmb2FzampxZWl4Y2dqaW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxODIzNTQsImV4cCI6MjA5NDc1ODM1NH0.5NW--CP0iwUP9DKvkMaigGMjXYJAwkELly1f9GUKkfY'
)