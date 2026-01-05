"use client";

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    RefreshCw,
    AlertTriangle,
    ArrowUpRight,
    Package,
    Activity,
    CheckCircle2
} from 'lucide-react';

const inventoryData = [
    {
        code: "PART-101",
        name: "ステンレス板 (SUS304)",
        stock: 150,
        allocated: 45,
        available: 105,
        unit: "枚",
        safety: 50,
        status: "OK",
    },
    {
        code: "PART-201",
        name: "高性能モーター AC100V",
        stock: 12,
        allocated: 8,
        available: 4,
        unit: "個",
        safety: 10,
        status: "ALERT",
    },
    {
        code: "PART-202",
        name: "減速ギアボックス",
        stock: 25,
        allocated: 10,
        available: 15,
        unit: "個",
        safety: 5,
        status: "OK",
    },
    {
        code: "MTL-001",
        name: "特殊防炎セラミック材",
        stock: 80,
        allocated: 40,
        available: 40,
        unit: "kg",
        safety: 20,
        status: "OK",
    },
];

export default function InventoryPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">在庫管理</h2>
                    <p className="text-muted-foreground">部品の現在庫・引当状況を確認し、欠品リスクを管理します</p>
                </div>
                <Button variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" /> 既存システムと同期 (10分毎)
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">全在庫品目</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">128</div>
                    </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-red-900">在庫不足警告</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">3</div>
                        <p className="text-xs text-red-600 mt-1">安全在庫を下回っています</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">引当済み総数</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">422</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">同期状態</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium">10分前に同期完了</div>
                        <p className="text-xs text-muted-foreground mt-1 text-primary">正常</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>在庫一覧</CardTitle>
                        <div className="relative w-80">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="部品コード、部品名で検索..." className="pl-8" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>部品コード</TableHead>
                                <TableHead>部品名</TableHead>
                                <TableHead className="text-right">現在庫</TableHead>
                                <TableHead className="text-right">引当済</TableHead>
                                <TableHead className="text-right">有効在庫</TableHead>
                                <TableHead>単位</TableHead>
                                <TableHead>状態</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {inventoryData.map((item) => (
                                <TableRow key={item.code}>
                                    <TableCell className="font-mono text-xs">{item.code}</TableCell>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="text-right font-bold">{item.stock}</TableCell>
                                    <TableCell className="text-right text-muted-foreground">{item.allocated}</TableCell>
                                    <TableCell className={`text-right font-bold ${item.status === 'ALERT' ? 'text-red-600' : 'text-primary'}`}>
                                        {item.available}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{item.unit}</TableCell>
                                    <TableCell>
                                        {item.status === 'ALERT' ? (
                                            <Badge variant="destructive" className="flex w-fit items-center gap-1">
                                                <AlertTriangle className="h-3 w-3" /> 不足
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                正常
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="h-8 px-2">
                                            詳細 <ArrowUpRight className="ml-1 h-3 w-3" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
