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
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { getWorkResultsByOrderId } from "@/app/actions/results";
import { getOrders } from "@/app/actions/orders";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { ResultsHistorySearchClient } from "./results-history-search-client";

export default async function ResultsHistoryPage({
    searchParams,
}: {
    searchParams?: { search?: string; date?: string };
}) {
    const search = searchParams?.search || "";
    const date = searchParams?.date || "";

    // 全実績を取得（簡易実装：全案件の実績を取得）
    const ordersResult = await getOrders({ pageSize: 1000 });
    const orders = ordersResult.success && ordersResult.data ? ordersResult.data.orders : [];

    const allResults: any[] = [];
    for (const order of orders) {
        const resultsResult = await getWorkResultsByOrderId(order.id);
        if (resultsResult.success && resultsResult.data) {
            allResults.push(...resultsResult.data.map((r: any) => ({
                ...r,
                orderNo: order.orderNo,
                productName: order.productName,
                orderId: order.id,
            })));
        }
    }

    // 日付でソート（新しい順）
    allResults.sort((a, b) => {
        return new Date(b.workDate).getTime() - new Date(a.workDate).getTime();
    });

    // フィルタ
    let filteredResults = allResults;
    if (search) {
        filteredResults = filteredResults.filter((r: any) =>
            r.orderNo.toLowerCase().includes(search.toLowerCase()) ||
            r.productName.toLowerCase().includes(search.toLowerCase())
        );
    }
    if (date) {
        filteredResults = filteredResults.filter((r: any) =>
            formatDate(r.workDate) === date
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/results">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">製造実績履歴</h2>
                    <p className="text-muted-foreground">
                        過去の製造実績を一覧表示・検索します
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>実績一覧</CardTitle>
                            <CardDescription>
                                全 {filteredResults.length} 件の実績を表示中
                            </CardDescription>
                        </div>
                        <Suspense fallback={<div className="w-80 h-10 bg-muted animate-pulse rounded-md" />}>
                            <ResultsHistorySearchClient initialSearch={search} initialDate={date} />
                        </Suspense>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredResults.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>作業日</TableHead>
                                    <TableHead>案件番号</TableHead>
                                    <TableHead>製品名</TableHead>
                                    <TableHead>作業時間</TableHead>
                                    <TableHead className="text-right">良品数量</TableHead>
                                    <TableHead className="text-right">不良数量</TableHead>
                                    <TableHead>作業者ID</TableHead>
                                    <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredResults.map((result: any) => {
                                    const startTime = new Date(result.startTime);
                                    const endTime = new Date(result.endTime);
                                    const workHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
                                    
                                    return (
                                        <TableRow key={result.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {formatDate(result.workDate)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-primary">
                                                <Link href={`/orders/${result.orderId}`} className="hover:underline">
                                                    {result.orderNo}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{result.productName}</TableCell>
                                            <TableCell>
                                                {formatDateTime(result.startTime)} 〜 {formatDateTime(result.endTime)}
                                                <br />
                                                <span className="text-xs text-muted-foreground">
                                                    ({workHours.toFixed(1)}時間)
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                {Number(result.quantity).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {Number(result.defectQuantity) > 0 ? (
                                                    <Badge variant="destructive">
                                                        {Number(result.defectQuantity).toLocaleString()}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">0</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {result.workerId}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/orders/${result.orderId}`}>
                                                        案件詳細
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
                            {search || date ? "検索条件に一致する実績が見つかりませんでした" : "実績データがありません"}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

