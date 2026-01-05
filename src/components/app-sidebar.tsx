"use client";

import * as React from "react";
import Link from "next/link";
import {
    LayoutDashboard,
    ClipboardList,
    Layers,
    CalendarDays,
    Activity,
    Package,
    Settings,
} from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from "@/components/ui/sidebar";

const navItems = [
    {
        title: "ダッシュボード",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        title: "案件管理",
        href: "/orders",
        icon: ClipboardList,
    },
    {
        title: "BOM管理",
        href: "/bom",
        icon: Layers,
    },
    {
        title: "日程管理 (ガント)",
        href: "/schedule",
        icon: CalendarDays,
    },
    {
        title: "製造実績",
        href: "/results",
        icon: Activity,
    },
    {
        title: "在庫管理",
        href: "/inventory",
        icon: Package,
    },
];

export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarHeader className="p-4 border-b">
                <div className="flex items-center gap-2 font-bold text-xl text-primary">
                    <Layers className="w-6 h-6" />
                    <span>三功工業所</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">製造管理システム</p>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>メニュー</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton asChild tooltip={item.title}>
                                        <Link href={item.href}>
                                            <item.icon className="w-4 h-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/settings">
                                <Settings className="w-4 h-4" />
                                <span>設定</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
