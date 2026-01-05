import { prisma } from "@/lib/prisma";
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

const statusMap: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "下書き", color: "bg-slate-500" },
    DESIGN: { label: "設計中", color: "bg-blue-500" },
    BOM_REVIEW: { label: "BOM承認待ち", color: "bg-orange-500" },
    PLANNING: { label: "生産計画中", color: "bg-cyan-500" },
    IN_PRODUCTION: { label: "製造中", color: "bg-emerald-500" },
    COMPLETED: { label: "完了", color: "bg-green-600" },
    SHIPPED: { label: "出荷済み", color: "bg-indigo-600" },
};

export default async function OrdersPage() {
    // 実際には Prisma から取得するが、モックデータをまずは表示
    const orders = [
        {
            id: "1",
            orderNo: "SO-2026-0001",
            customerName: "東京研究所",
            productName: "特殊防火ダンパー",
            dueDate: "2026-06-30",
            status: "IN_PRODUCTION",
            priority: 1,
        },
        {
            id: "2",
            orderNo: "SO-2026-0002",
            customerName: "横浜病院",
            productName: "防煙ダンパー タイプB",
            dueDate: "2026-07-15",
            status: "PLANNING",
            priority: 3,
        },
        {
            id: "3",
            orderNo: "SO-2026-0003",
            customerName: "川崎クリーンルーム",
            productName: "高気密ダンパー",
            dueDate: "2026-05-20",
            status: "BOM_REVIEW",
            priority: 2,
        },
    ];

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
                        <div className="relative w-72">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="検索 (案件番号、顧客名...)" className="pl-8" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
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
                            {orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium text-primary">
                                        <Link href={`/orders/${order.id}`} className="hover:underline">
                                            {order.orderNo}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{order.customerName}</TableCell>
                                    <TableCell>{order.productName}</TableCell>
                                    <TableCell>{order.dueDate}</TableCell>
                                    <TableCell>
                                        <Badge className={statusMap[order.status].color}>
                                            {statusMap[order.status].label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`
                      px-2 py-0.5 rounded-full text-xs font-bold
                      ${order.priority === 1 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}
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
                </CardContent>
            </Card>
        </div>
    );
}
