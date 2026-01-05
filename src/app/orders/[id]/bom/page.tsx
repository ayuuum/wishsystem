"use client";

import React, { useState } from 'react';
import {
    ChevronRight,
    ChevronDown,
    Layers,
    Plus,
    MoreVertical,
    Search,
    ArrowLeft
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';

interface BomItem {
    id: string;
    itemCode: string;
    itemName: string;
    quantity: number;
    unit: string;
    level: number;
    unitCost: number;
    children?: BomItem[];
}

const mockBom: BomItem[] = [
    {
        id: "1",
        itemCode: "PRD-001",
        itemName: "特殊防火ダンパー",
        quantity: 1,
        unit: "個",
        level: 0,
        unitCost: 250000,
        children: [
            {
                id: "2",
                itemCode: "ASM-001",
                itemName: "本体フレーム組立",
                quantity: 1,
                unit: "式",
                level: 1,
                unitCost: 85000,
                children: [
                    {
                        id: "3",
                        itemCode: "PART-101",
                        itemName: "ステンレス板 (SUS304)",
                        quantity: 2,
                        unit: "枚",
                        level: 2,
                        unitCost: 15000,
                    },
                    {
                        id: "4",
                        itemCode: "PART-102",
                        itemName: "溶接ボルト M8",
                        quantity: 8,
                        unit: "本",
                        level: 2,
                        unitCost: 50,
                    }
                ]
            },
            {
                id: "5",
                itemCode: "ASM-002",
                itemName: "駆動部ユニット",
                quantity: 1,
                unit: "式",
                level: 1,
                unitCost: 120000,
                children: [
                    {
                        id: "6",
                        itemCode: "PART-201",
                        itemName: "高性能モーター AC100V",
                        quantity: 1,
                        unit: "個",
                        level: 2,
                        unitCost: 45000,
                    },
                    {
                        id: "7",
                        itemCode: "PART-202",
                        itemName: "減速ギアボックス",
                        quantity: 1,
                        unit: "個",
                        level: 2,
                        unitCost: 35000,
                    }
                ]
            },
            {
                id: "8",
                itemCode: "MTL-001",
                itemName: "特殊防炎セラミック材",
                quantity: 5,
                unit: "kg",
                level: 1,
                unitCost: 8000,
            }
        ]
    }
];

export function BomTreeView({ items, level = 0 }: { items: BomItem[], level?: number }) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({ "1": true, "2": true, "5": true });

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="space-y-1">
            {items.map((item) => (
                <div key={item.id} className="space-y-1">
                    <div
                        className={`
              flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors border
              ${level === 0 ? 'bg-primary/5 font-bold border-primary/20' : 'bg-background'}
            `}
                        style={{ marginLeft: `${level * 20}px` }}
                    >
                        <button
                            onClick={() => toggleExpand(item.id)}
                            className="p-1 hover:bg-muted rounded"
                        >
                            {item.children && item.children.length > 0 ? (
                                expanded[item.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                            ) : (
                                <div className="w-4 h-4" />
                            )}
                        </button>
                        <div className="flex-1 flex items-center justify-between min-w-0">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">{item.itemCode}</span>
                                <span className="truncate">{item.itemName}</span>
                            </div>
                            <div className="flex items-center gap-6 px-4">
                                <div className="text-right w-24">
                                    <span className="text-sm font-medium">{item.quantity}</span>
                                    <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                                </div>
                                <div className="text-right w-32">
                                    <span className="text-sm font-bold">¥{(item.unitCost * item.quantity).toLocaleString()}</span>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>編集</DropdownMenuItem>
                                        <DropdownMenuItem>子部品を追加</DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600">削除</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                    {item.children && expanded[item.id] && (
                        <BomTreeView items={item.children} level={level + 1} />
                    )}
                </div>
            ))}
        </div>
    );
}

export default function OrderBomPage({ params }: { params: { id: string } }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href={`/orders/${params.id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">部品構成 (BOM) 管理</h2>
                    <p className="text-muted-foreground">案件: SO-2026-0001 / 特殊防火ダンパー</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button variant="outline">
                        部品マスタから引用
                    </Button>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> 行を追加
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>BOMツリー構造</CardTitle>
                                <CardDescription>ドラッグ&ドロップで階層構造を編集できます</CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="構成内を検索..." className="pl-8" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg p-4 bg-muted/10">
                            <div className="flex items-center justify-between px-2 mb-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b pb-2">
                                <div className="flex-1">名称 / 型番</div>
                                <div className="flex items-center gap-6 px-4">
                                    <div className="text-right w-24">数量 / 単位</div>
                                    <div className="text-right w-32">金額 (合計)</div>
                                    <div className="w-8"></div>
                                </div>
                            </div>
                            <BomTreeView items={mockBom} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>原価サマリ</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">材料費合計</span>
                                <span>¥480,000</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">外注費合計</span>
                                <span>¥120,000</span>
                            </div>
                            <div className="flex justify-between text-sm border-t pt-2">
                                <span className="font-bold">原価総計</span>
                                <span className="font-bold text-xl">¥600,000</span>
                            </div>
                        </div>
                        <div className="space-y-3 pt-6 border-t">
                            <p className="text-xs font-bold text-muted-foreground">ステータス</p>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between p-2 rounded border bg-orange-50 border-orange-200">
                                    <span className="text-xs font-bold text-orange-700">BOM承認待ち</span>
                                    <Button size="sm" variant="outline" className="h-7 text-xs bg-white">
                                        承認する
                                    </Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground">承認されると生産計画に移行可能になります</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
