import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopackを無効化（日本語パス名の問題を回避）
  // 開発モードでは --turbo=false フラグを使用
  // ビルド時はデフォルトでwebpackが使用される
};

export default nextConfig;
