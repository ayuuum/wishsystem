"use client";

import React, { useState, useEffect, useTransition } from 'react';
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
import Link from 'next/link';
import { getInventoryItems, getInventoryStats, syncInventory } from "@/app/actions/inventory";
import { isLowStock } from "@/lib/utils/calculations";

export default function InventoryPage() {
    const [search, setSearch] = useState("");
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalItems: 0,
        lowStockCount: 0,
        totalAllocated: 0,
        lastSyncedAt: new Date(),
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [itemsResult, statsResult] = await Promise.all([
                getInventoryItems({ search }),
                getInventoryStats(),
            ]);

            if (itemsResult.success && itemsResult.data) {
                setInventoryItems(itemsResult.data);
            }
            if (statsResult.success && statsResult.data) {
                setStats({
                    ...statsResult.data,
                    lastSyncedAt: new Date(),
                });
            }
        } catch (error) {
            console.error("Failed to load inventory data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [search]);

    const handleSync = async () => {
        startTransition(async () => {
            const result = await syncInventory();
            if (result.success) {
                await loadData();
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">在庫管理</h2>
                    <p className="text-muted-foreground">部品の現在庫・引当状況を確認し、欠品リスクを管理します</p>
                </div>
                <Button variant="outline" onClick={handleSync} disabled={isPending}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} /> 
                    既存システムと同期
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">全在庫品目</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalItems}</div>
                    </CardContent>
                </Card>
                <Card className={stats.lowStockCount > 0 ? "bg-red-50 border-red-100" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className={`text-sm font-medium ${stats.lowStockCount > 0 ? 'text-red-900' : ''}`}>
                            在庫不足警告
                        </CardTitle>
                        <AlertTriangle className={`h-4 w-4 ${stats.lowStockCount > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${stats.lowStockCount > 0 ? 'text-red-700' : ''}`}>
                            {stats.lowStockCount}
                        </div>
                        {stats.lowStockCount > 0 && (
                            <p className="text-xs text-red-600 mt-1">安全在庫を下回っています</p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">引当済み総数</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalAllocated.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">同期状態</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium">
                            {stats.lastSyncedAt.toLocaleTimeString('ja-JP')} に同期完了
                        </div>
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
                            <Input
                                placeholder="部品コード、部品名で検索..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            読み込み中...
                        </div>
                    ) : inventoryItems.length > 0 ? (
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
                                {inventoryItems.map((item: any) => {
                                    const lowStock = isLowStock(
                                        Number(item.availableQuantity),
                                        Number(item.safetyStock)
                                    );
                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-mono text-xs">{item.itemCode}</TableCell>
                                            <TableCell className="font-medium">{item.itemName}</TableCell>
                                            <TableCell className="text-right font-bold">
                                                {Number(item.stockQuantity).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {Number(item.allocatedQuantity).toLocaleString()}
                                            </TableCell>
                                            <TableCell className={`text-right font-bold ${lowStock ? 'text-red-600' : 'text-primary'}`}>
                                                {Number(item.availableQuantity).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {item.item?.unit || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {lowStock ? (
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
                                                <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                                                    <Link href={`/inventory/${item.id}`}>
                                                        詳細 <ArrowUpRight className="ml-1 h-3 w-3" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            在庫データが見つかりませんでした
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
