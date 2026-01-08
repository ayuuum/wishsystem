import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Search, Layers, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { getOrders } from "@/app/actions/orders";
import { getBomByOrderId, getBomTotalCost } from "@/app/actions/bom";
import { formatDate } from "@/lib/utils/date";
import { BomSearchClient } from "./bom-search-client";

export default async function BomPage({
    searchParams,
}: {
    searchParams?: { search?: string };
}) {
    const search = searchParams?.search || "";

    try {
        // 全案件を取得
        const ordersResult = await getOrders({ pageSize: 1000 });
        const orders = ordersResult.success && ordersResult.data ? ordersResult.data.orders : [];

        // 各案件のBOM情報を取得（エラーハンドリング付き）
        const bomData = await Promise.allSettled(
            orders.map(async (order: any) => {
                try {
                    const bomResult = await getBomByOrderId(order.id);
                    const costResult = await getBomTotalCost(order.id);
                    
                    return {
                        order,
                        bomItems: bomResult.success && bomResult.data ? (Array.isArray(bomResult.data) ? bomResult.data : []) : [],
                        totalCost: costResult.success && costResult.data ? costResult.data : 0,
                    };
                } catch (error) {
                    console.error(`Error fetching BOM for order ${order.id}:`, error);
                    return {
                        order,
                        bomItems: [],
                        totalCost: 0,
                    };
                }
            })
        );

        // Promise.allSettledの結果を処理
        const validBomData = bomData
            .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
            .map(result => result.value);

        // 検索フィルタ
        const filteredData = search
            ? validBomData.filter((data) =>
                data.order?.orderNo?.toLowerCase().includes(search.toLowerCase()) ||
                data.order?.productName?.toLowerCase().includes(search.toLowerCase()) ||
                data.order?.customerName?.toLowerCase().includes(search.toLowerCase())
              )
            : validBomData;

        // BOMが存在する案件のみ表示
        const bomOrders = filteredData.filter((data) => Array.isArray(data.bomItems) && data.bomItems.length > 0);

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">BOM管理</h2>
                        <p className="text-muted-foreground">
                            全案件の部品構成表を一覧表示・管理します
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>案件別BOM一覧</CardTitle>
                        <Suspense fallback={<div className="w-72 h-10 bg-muted animate-pulse rounded-md" />}>
                            <BomSearchClient initialSearch={search} />
                        </Suspense>
                    </div>
                    </CardHeader>
                    <CardContent>
                        {bomOrders.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>案件番号</TableHead>
                                        <TableHead>顧客名</TableHead>
                                        <TableHead>製品名</TableHead>
                                        <TableHead>BOMアイテム数</TableHead>
                                        <TableHead className="text-right">原価合計</TableHead>
                                        <TableHead>納期</TableHead>
                                        <TableHead className="text-right">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bomOrders.map((data) => (
                                        <TableRow key={data.order?.id || Math.random()}>
                                            <TableCell className="font-medium text-primary">
                                                <Link href={`/orders/${data.order?.id || ''}`} className="hover:underline">
                                                    {data.order?.orderNo || ''}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{data.order?.customerName || ''}</TableCell>
                                            <TableCell>{data.order?.productName || ''}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    <Layers className="mr-1 h-3 w-3" />
                                                    {Array.isArray(data.bomItems) ? data.bomItems.length : 0}件
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                ¥{typeof data.totalCost === 'number' ? data.totalCost.toLocaleString() : '0'}
                                            </TableCell>
                                            <TableCell>{data.order?.dueDate ? formatDate(data.order.dueDate) : ''}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/orders/${data.order?.id || ''}/bom`}>
                                                        詳細 <ArrowRight className="ml-1 h-3 w-3" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                {search ? "検索条件に一致するBOMが見つかりませんでした" : "BOMデータがありません"}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error) {
        console.error("Error in BomPage:", error);
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">BOM管理</h2>
                        <p className="text-muted-foreground">
                            全案件の部品構成表を一覧表示・管理します
                        </p>
                    </div>
                </div>
                <Card>
                    <CardContent className="py-8">
                        <div className="text-center text-muted-foreground">
                            データの読み込み中にエラーが発生しました。ページを再読み込みしてください。
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }
}

