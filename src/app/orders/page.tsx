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
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { getOrders } from "@/app/actions/orders";
import { formatDate } from "@/lib/utils/date";
import { OrdersSearchClient } from "./orders-search-client";
import { OrdersFilterClient } from "./orders-filter-client";
import { PaginationControls } from "@/components/pagination-controls";

const statusMap: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "下書き", color: "bg-slate-500" },
    DESIGN: { label: "設計中", color: "bg-blue-500" },
    BOM_REVIEW: { label: "BOM承認待ち", color: "bg-orange-500" },
    PLANNING: { label: "生産計画中", color: "bg-cyan-500" },
    IN_PRODUCTION: { label: "製造中", color: "bg-emerald-500" },
    COMPLETED: { label: "完了", color: "bg-green-600" },
    SHIPPED: { label: "出荷済み", color: "bg-indigo-600" },
};

export default async function OrdersPage({
    searchParams,
}: {
    searchParams?: { search?: string; status?: string; page?: string };
}) {
    const search = searchParams?.search || "";
    const status = searchParams?.status as any;
    const page = parseInt(searchParams?.page || "1");

    const result = await getOrders({
        search,
        status,
        page,
        pageSize: 20,
    });

    const orders = result.success && result.data ? result.data.orders : [];
    const total = result.success && result.data ? result.data.total : 0;
    const totalPages = result.success && result.data ? result.data.totalPages : 1;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">案件管理</h2>
                    <p className="text-muted-foreground">
                        特別受注製品の受注状況と進捗を管理します
                    </p>
                </div>
                <Button asChild>
                    <Link href="/orders/new">
                        <Plus className="mr-2 h-4 w-4" /> 新規案件登録
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>案件一覧</CardTitle>
                        <div className="flex items-center gap-4">
                            <Suspense fallback={<div className="w-40 h-10 bg-muted animate-pulse rounded-md" />}>
                                <OrdersFilterClient initialStatus={status} />
                            </Suspense>
                            <Suspense fallback={<div className="w-72 h-10 bg-muted animate-pulse rounded-md" />}>
                                <OrdersSearchClient initialSearch={search} />
                            </Suspense>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {orders.length > 0 ? (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>案件番号</TableHead>
                                        <TableHead>顧客名</TableHead>
                                        <TableHead>製品名</TableHead>
                                        <TableHead>納期</TableHead>
                                        <TableHead>ステータス</TableHead>
                                        <TableHead>優先度</TableHead>
                                        <TableHead className="text-right">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order: any) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium text-primary">
                                                <Link href={`/orders/${order.id}`} className="hover:underline">
                                                    {order.orderNo}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{order.customerName}</TableCell>
                                            <TableCell>{order.productName}</TableCell>
                                            <TableCell>{formatDate(order.dueDate)}</TableCell>
                                            <TableCell>
                                                <Badge className={statusMap[order.status]?.color || "bg-slate-500"}>
                                                    {statusMap[order.status]?.label || order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`
                                                    px-2 py-0.5 rounded-full text-xs font-bold
                                                    ${order.priority === 1 ? 'bg-red-100 text-red-700' : 
                                                      order.priority === 2 ? 'bg-orange-100 text-orange-700' : 
                                                      'bg-slate-100 text-slate-700'}
                                                `}>
                                                    P{order.priority}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/orders/${order.id}`}>詳細</Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {totalPages > 1 && (
                                <div className="mt-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            全 {total} 件中 {((page - 1) * 20) + 1} - {Math.min(page * 20, total)} 件を表示
                                        </p>
                                    </div>
                                    <PaginationControls
                                        currentPage={page}
                                        totalPages={totalPages}
                                        baseUrl="/orders"
                                        searchParams={{
                                            ...(search && { search }),
                                            ...(status && { status }),
                                        }}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>案件が見つかりませんでした</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
