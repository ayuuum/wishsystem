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
    FileText,
    Edit
} from "lucide-react";
import Link from "next/link";
import { getOrderById } from "@/app/actions/orders";
import { getWorkOrdersByOrderId } from "@/app/actions/schedule";
import { getWorkResultsByOrderId } from "@/app/actions/results";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { calculateProgress } from "@/lib/utils/calculations";
import { WorkOrderStatus } from "@prisma/client";

const statusMap: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "下書き", color: "bg-slate-500" },
    DESIGN: { label: "設計中", color: "bg-blue-500" },
    BOM_REVIEW: { label: "BOM承認待ち", color: "bg-orange-500" },
    PLANNING: { label: "生産計画中", color: "bg-cyan-500" },
    IN_PRODUCTION: { label: "製造中", color: "bg-emerald-500" },
    COMPLETED: { label: "完了", color: "bg-green-600" },
    SHIPPED: { label: "出荷済み", color: "bg-indigo-600" },
};

const workOrderStatusMap: Record<string, { label: string; color: string; icon: string }> = {
    PLANNED: { label: "未着手", color: "opacity-50", icon: "text-muted-foreground" },
    READY: { label: "準備完了", color: "bg-blue-50 border-blue-200", icon: "text-blue-500" },
    IN_PROGRESS: { label: "実行中", color: "bg-blue-50 border-blue-200", icon: "text-blue-500 animate-pulse" },
    COMPLETED: { label: "完了", color: "bg-muted/30", icon: "text-emerald-500" },
    SUSPENDED: { label: "中断", color: "bg-orange-50 border-orange-200", icon: "text-orange-500" },
};

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
    const [orderResult, workOrdersResult, resultsResult] = await Promise.all([
        getOrderById(params.id),
        getWorkOrdersByOrderId(params.id),
        getWorkResultsByOrderId(params.id),
    ]);

    if (!orderResult.success || !orderResult.data) {
        notFound();
    }

    const order = orderResult.data;
    const workOrders = workOrdersResult.success && workOrdersResult.data ? workOrdersResult.data : [];
    const results = resultsResult.success && resultsResult.data ? resultsResult.data : [];

    const progress = calculateProgress(workOrders);

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
                    <Badge className={statusMap[order.status]?.color || "bg-slate-500"}>
                        {statusMap[order.status]?.label || order.status}
                    </Badge>
                    <span className={`
                        px-2 py-0.5 rounded-full text-xs font-bold
                        ${order.priority === 1 ? 'bg-red-100 text-red-700' : 
                          order.priority === 2 ? 'bg-orange-100 text-orange-700' : 
                          'bg-slate-100 text-slate-700'}
                    `}>
                        P{order.priority}
                    </span>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/orders/${order.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> 編集
                        </Link>
                    </Button>
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
                            <p>{formatDate(order.orderedDate)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">納期</p>
                            <p className="font-bold text-orange-600">{formatDate(order.dueDate)}</p>
                        </div>
                        {order.productSpec && (
                            <div className="md:col-span-2 border-t pt-4">
                                <p className="text-sm font-medium text-muted-foreground">製品仕様・特記事項</p>
                                <p className="mt-1">{order.productSpec}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>見積・管理</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">見積金額</p>
                            <p className="text-2xl font-bold">¥{Number(order.estimatedPrice).toLocaleString()}</p>
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
                            <Button className="w-full justify-start" variant="outline" disabled>
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
                            {workOrders.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="relative pt-1">
                                        <div className="flex mb-2 items-center justify-between text-xs">
                                            <div>全 {workOrders.length} 工程中 {workOrders.filter((wo: any) => wo.status === 'COMPLETED').length} 工程完了</div>
                                            <div className="text-right font-bold text-primary">{progress}%</div>
                                        </div>
                                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-muted">
                                            <div 
                                                style={{ width: `${progress}%` }} 
                                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {workOrders.map((wo: any) => {
                                            const statusInfo = workOrderStatusMap[wo.status] || workOrderStatusMap.PLANNED;
                                            return (
                                                <div 
                                                    key={wo.id} 
                                                    className={`flex items-center gap-3 p-3 rounded-lg border ${statusInfo.color}`}
                                                >
                                                    <Activity className={`h-5 w-5 ${statusInfo.icon}`} />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">
                                                            {wo.processName} ({statusInfo.label})
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {wo.actualStartDate 
                                                                ? `開始: ${formatDate(wo.actualStartDate)}` 
                                                                : `予定: ${formatDate(wo.plannedStartDate)} 〜 ${formatDate(wo.plannedEndDate)}`}
                                                            {wo.actualEndDate && ` / 完了: ${formatDate(wo.actualEndDate)}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    工程データがありません
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">作業実績履歴</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {results.length > 0 ? (
                                <div className="space-y-3">
                                    {results.map((result: any) => (
                                        <div key={result.id} className="flex items-center justify-between p-3 rounded-lg border">
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {formatDate(result.workDate)} - {formatDateTime(result.startTime)} 〜 {formatDateTime(result.endTime)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    実績: {Number(result.quantity).toLocaleString()}個
                                                    {Number(result.defectQuantity) > 0 && ` / 不良: ${Number(result.defectQuantity).toLocaleString()}個`}
                                                </p>
                                                {result.remarks && (
                                                    <p className="text-xs text-muted-foreground mt-1">{result.remarks}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    まだ実績データがありません
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
