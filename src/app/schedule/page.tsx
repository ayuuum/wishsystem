import { GanttChart } from "@/components/gantt-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getOrders } from "@/app/actions/orders";
import { getWorkOrdersByOrderId } from "@/app/actions/schedule";
import { formatDate } from "@/lib/utils/date";
import { calculateWorkOrderProgress } from "@/lib/utils/calculations";

export default async function SchedulePage() {
    // 全案件を取得
    const ordersResult = await getOrders({ pageSize: 1000 });
    const orders = ordersResult.success && ordersResult.data ? ordersResult.data.orders : [];

    // 各案件の作業指示を取得
    const scheduleData = await Promise.all(
        orders.map(async (order: any) => {
            const workOrdersResult = await getWorkOrdersByOrderId(order.id);
            const workOrders = workOrdersResult.success && workOrdersResult.data ? workOrdersResult.data : [];
            
            return {
                order,
                workOrders,
            };
        })
    );

    // 作業指示が存在する案件のみ表示
    const ordersWithSchedule = scheduleData.filter((data) => data.workOrders.length > 0);

    // ガントチャート用のタスクデータに変換（全案件分）
    const allTasks: any[] = [];
    ordersWithSchedule.forEach((data) => {
        data.workOrders.forEach((wo: any) => {
            const progress = calculateWorkOrderProgress(wo);
            allTasks.push({
                id: wo.id,
                name: `${data.order.orderNo}: ${wo.processName}`,
                start: formatDate(wo.plannedStartDate, 'yyyy-MM-dd'),
                end: formatDate(wo.plannedEndDate, 'yyyy-MM-dd'),
                progress,
                dependencies: wo.predecessorId || undefined,
                orderId: data.order.id,
                orderNo: data.order.orderNo,
            });
        });
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">日程管理 (ガントチャート)</h2>
                    <p className="text-muted-foreground">
                        全案件の製造工程スケジュールを一覧表示します
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>全案件スケジュール</CardTitle>
                    <CardDescription>
                        {ordersWithSchedule.length}件の案件のスケジュールを表示中
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {allTasks.length > 0 ? (
                        <>
                            <div className="gantt-container p-4 mb-6">
                                <GanttChart tasks={allTasks} />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">案件別スケジュール詳細</h3>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {ordersWithSchedule.map((data) => (
                                        <Card key={data.order.id}>
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-sm">
                                                        <Link 
                                                            href={`/orders/${data.order.id}`}
                                                            className="text-primary hover:underline"
                                                        >
                                                            {data.order.orderNo}
                                                        </Link>
                                                    </CardTitle>
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/orders/${data.order.id}/schedule`}>
                                                            <ArrowRight className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                                <CardDescription className="text-xs">
                                                    {data.order.productName}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    {data.workOrders.map((wo: any) => {
                                                        const progress = calculateWorkOrderProgress(wo);
                                                        const statusBadge = 
                                                            wo.status === 'COMPLETED' || progress === 100
                                                                ? { variant: "default" as const, label: "完了" }
                                                                : wo.status === 'IN_PROGRESS' || progress > 0
                                                                ? { variant: "outline" as const, label: "実行中" }
                                                                : { variant: "secondary" as const, label: "未着手" };
                                                        
                                                        return (
                                                            <div key={wo.id} className="flex items-center justify-between p-2 rounded border text-xs">
                                                                <div className="flex-1">
                                                                    <p className="font-medium">{wo.processName}</p>
                                                                    <p className="text-muted-foreground">
                                                                        {formatDate(wo.plannedStartDate)} 〜 {formatDate(wo.plannedEndDate)}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant={statusBadge.variant} className="text-[10px]">
                                                                        {statusBadge.label}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                            <p>スケジュールデータがありません</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

