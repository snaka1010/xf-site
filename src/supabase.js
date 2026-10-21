import { createClient } from '@supabase/supabase-js'

// 値は .env（ローカル）または GitHub Actions のシークレットから入る。コードには直接書かない。
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('VITE_SUPABASE_URL と VITE_SUPABASE_PUBLISHABLE_KEY を設定してください')
}

export const supabase = createClient(url, key)
