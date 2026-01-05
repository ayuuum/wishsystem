import { createClient } from '@supabase/supabase-js'

// 環境変数の安全な取得（開発環境では警告のみ、本番環境ではエラー）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Supabase環境変数が設定されていません。NEXT_PUBLIC_SUPABASE_URLとNEXT_PUBLIC_SUPABASE_ANON_KEYを設定してください。'
    );
  } else {
    console.warn(
      '警告: Supabase環境変数が設定されていません。一部の機能が動作しない可能性があります。'
    );
  }
}

// 環境変数が設定されている場合のみクライアントを作成
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Supabaseが利用可能かどうかをチェックするヘルパー関数
export function isSupabaseAvailable(): boolean {
  return supabase !== null;
}
