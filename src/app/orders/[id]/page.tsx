import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Layers,
    CalendarDays,
    Activity,
    FileText
} from "lucide-react";
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

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
    // モックデータ（本来は Prisma から取得）
    const order = {
        id: params.id,
        orderNo: "SO-2026-0001",
        customerName: "東京研究所",
        productName: "特殊防火ダンパー",
        productSpec: "被爆実験棟用、耐熱強化仕様、手動/自動切替機能付",
        orderedDate: "2026-04-01",
        dueDate: "2026-06-30",
        status: "IN_PRODUCTION",
        estimatedPrice: 5000000,
        priority: 1,
    };

    if (!order) notFound();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/orders">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">案件詳細: {order.orderNo}</h2>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{order.customerName}</span>
                        <span>/</span>
                        <span>{order.productName}</span>
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Badge className={statusMap[order.status].color}>
                        {statusMap[order.status].label}
                    </Badge>
                    <span className={`
            px-2 py-0.5 rounded-full text-xs font-bold
            ${order.priority === 1 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}
          `}>
                        P{order.priority}
                    </span>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>基本情報</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">受注日</p>
                            <p>{order.orderedDate}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">納期</p>
                            <p className="font-bold text-orange-600">{order.dueDate}</p>
                        </div>
                        <div className="md:col-span-2 border-t pt-4">
                            <p className="text-sm font-medium text-muted-foreground">製品仕様・特記事項</p>
                            <p className="mt-1">{order.productSpec}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>見積・管理</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">見積金額</p>
                            <p className="text-2xl font-bold">¥{order.estimatedPrice.toLocaleString()}</p>
                        </div>
                        <div className="pt-4 border-t space-y-2">
                            <Button className="w-full justify-start" variant="outline" asChild>
                                <Link href={`/orders/${order.id}/bom`}>
                                    <Layers className="mr-2 h-4 w-4" /> 部品構成 (BOM) を表示
                                </Link>
                            </Button>
                            <Button className="w-full justify-start" variant="outline" asChild>
                                <Link href={`/orders/${order.id}/schedule`}>
                                    <CalendarDays className="mr-2 h-4 w-4" /> 日程管理を表示
                                </Link>
                            </Button>
                            <Button className="w-full justify-start" variant="outline">
                                <FileText className="mr-2 h-4 w-4" /> 生産指示書 PDF 出力
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="progress" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="progress">製造進捗</TabsTrigger>
                    <TabsTrigger value="history">実績履歴</TabsTrigger>
                </TabsList>
                <TabsContent value="progress" className="pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">現在の工程進捗</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="relative pt-1">
                                    <div className="flex mb-2 items-center justify-between text-xs">
                                        <div>全 5 工程中 2 工程完了</div>
                                        <div className="text-right font-bold text-primary">40%</div>
                                    </div>
                                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-muted">
                                        <div style={{ width: "40%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"></div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                                        <Activity className="h-5 w-5 text-emerald-500" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">板金加工 (完了)</p>
                                            <p className="text-xs text-muted-foreground">2026-04-10 完了</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-blue-50 border-blue-200">
                                        <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">溶接工作 (実行中)</p>
                                            <p className="text-xs text-muted-foreground">担当: 溶接班A / 予定: 2026-04-12 〜 2026-04-15</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg border opacity-50">
                                        <Activity className="h-5 w-5 text-muted-foreground" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">組立工程 (未着手)</p>
                                            <p className="text-xs text-muted-foreground">予定: 2026-04-16 〜 2026-04-20</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">作業実績履歴</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground text-center py-8">
                                まだ実績データがありません
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
