import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "三功工業所 特別受注製品向け製造管理システム",
  description: "株式会社三功工業所 特別受注製品向け製造管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <main className="flex-1 overflow-auto bg-muted/40">
              <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
                <SidebarTrigger className="-ml-1" />
                <div className="w-full flex-1">
                  <h1 className="text-lg font-semibold">
                    製造管理システム
                  </h1>
                </div>
              </header>
              <div className="p-6">
                {children}
              </div>
            </main>
          </div>
        </SidebarProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
