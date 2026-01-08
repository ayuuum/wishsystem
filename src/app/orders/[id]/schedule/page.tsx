"use client";

import React, { useState, useEffect } from 'react';
import { GanttChart } from "@/components/gantt-chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    ArrowLeft,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Plus,
    Save
} from 'lucide-react';
import Link from 'next/link';
import { getWorkOrdersByOrderId, updateWorkOrderSchedule } from "@/app/actions/schedule";
import { getOrderById } from "@/app/actions/orders";
import { predictProcessTimeAction } from "@/app/actions/ai";
import { formatDate } from "@/lib/utils/date";
import { calculateWorkOrderProgress } from "@/lib/utils/calculations";
import { useRouter, useParams } from "next/navigation";

export default function OrderSchedulePage() {
    const router = useRouter();
    const params = useParams();
    const orderId = typeof params?.id === 'string' ? params.id : undefined;
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/522b9dd6-62bf-43dc-a4fb-fcba4c30eae5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'schedule/page.tsx:30',message:'OrderSchedulePage component initialized',data:{orderId,params:params?JSON.stringify(params):'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const [workOrders, setWorkOrders] = useState<any[]>([]);
    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [predictedTimes, setPredictedTimes] = useState<Record<string, { predictedHours: number | null; dataCount: number }>>({});

    useEffect(() => {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/522b9dd6-62bf-43dc-a4fb-fcba4c30eae5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'schedule/page.tsx:38',message:'useEffect triggered',data:{orderId,hasOrderId:!!orderId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        if (orderId) {
            loadData();
        } else {
            // #region agent log
            fetch('http://127.0.0.1:7245/ingest/522b9dd6-62bf-43dc-a4fb-fcba4c30eae5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'schedule/page.tsx:42',message:'orderId is undefined',data:{params:params?JSON.stringify(params):'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            setIsLoading(false);
        }
    }, [orderId]);

    const loadData = async () => {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/522b9dd6-62bf-43dc-a4fb-fcba4c30eae5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'schedule/page.tsx:35',message:'loadData called',data:{orderId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        if (!orderId) return;
        
        setIsLoading(true);
        try {
            const [workOrdersResult, orderResult] = await Promise.all([
                getWorkOrdersByOrderId(orderId),
                getOrderById(orderId),
            ]);

            if (workOrdersResult.success && workOrdersResult.data) {
                setWorkOrders(workOrdersResult.data);
                
                // 各工程の予測時間を取得
                const predictions: Record<string, { predictedHours: number | null; dataCount: number }> = {};
                await Promise.all(
                    workOrdersResult.data.map(async (wo: any) => {
                        const predictionResult = await predictProcessTimeAction(
                            wo.processName,
                            Number(wo.plannedQuantity)
                        );
                        if (predictionResult.success && predictionResult.data) {
                            predictions[wo.id] = {
                                predictedHours: predictionResult.data.predictedHours,
                                dataCount: predictionResult.data.dataCount,
                            };
                        }
                    })
                );
                setPredictedTimes(predictions);
            }
            if (orderResult.success && orderResult.data) {
                setOrder(orderResult.data);
            }
        } catch (error) {
            console.error("Failed to load schedule data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDateChange = async (workOrderId: string, startDate: Date, endDate: Date) => {
        const result = await updateWorkOrderSchedule({
            id: workOrderId,
            startDate,
            endDate,
        });

        if (result.success) {
            await loadData();
        } else {
            alert(result.error?.message || "スケジュールの更新に失敗しました");
        }
    };

    // ガントチャート用のタスクデータに変換
    const tasks = workOrders.map((wo, index) => {
        const progress = calculateWorkOrderProgress(wo);
        return {
            id: wo.id,
            name: wo.processName,
            start: formatDate(wo.plannedStartDate, 'yyyy-MM-dd'),
            end: formatDate(wo.plannedEndDate, 'yyyy-MM-dd'),
            progress,
            dependencies: wo.predecessorId || undefined,
        };
    });

    const getStatusBadge = (wo: any) => {
        const progress = calculateWorkOrderProgress(wo);
        if (wo.status === 'COMPLETED' || progress === 100) {
            return { variant: "default" as const, label: "完了" };
        } else if (wo.status === 'IN_PROGRESS' || progress > 0) {
            return { variant: "outline" as const, label: "実行中" };
        } else {
            return { variant: "secondary" as const, label: "未着手" };
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href={`/orders/${orderId}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">日程管理 (ガントチャート)</h2>
                    <p className="text-muted-foreground">
                        案件: {order?.orderNo || '...'} / {order?.productName || '...'}
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <div className="flex items-center border rounded-md p-1 bg-muted/50 mr-2">
                        <Button variant="ghost" size="sm" className="h-7">日</Button>
                        <Button variant="ghost" size="sm" className="h-7 bg-white shadow-sm">週</Button>
                        <Button variant="ghost" size="sm" className="h-7">月</Button>
                    </div>
                    <Button variant="outline" size="sm">
                        <Calendar className="mr-2 h-4 w-4" /> {new Date().getFullYear()}年{new Date().getMonth() + 1}月
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>製造工程スケジュール</CardTitle>
                            <CardDescription>バーをドラッグして日程を変更、端をドラッグして期間を調整できます</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            読み込み中...
                        </div>
                    ) : tasks.length > 0 ? (
                        <>
                            <div className="gantt-container p-4">
                                <GanttChart tasks={tasks} />
                            </div>

                            <div className="mt-8 flex gap-6 overflow-x-auto pb-4">
                                {workOrders.map((wo) => {
                                    const progress = calculateWorkOrderProgress(wo);
                                    const statusBadge = getStatusBadge(wo);
                                    return (
                                        <div key={wo.id} className="min-w-[200px] border rounded-lg p-3 bg-background shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold text-primary">{wo.processOrder}</span>
                                                <Badge variant={statusBadge.variant} className="text-[10px]">
                                                    {statusBadge.label}
                                                </Badge>
                                            </div>
                                            <h4 className="font-bold text-sm mb-1">{wo.processName}</h4>
                                            <div className="flex justify-between text-[11px] text-muted-foreground">
                                                <span>{formatDate(wo.plannedStartDate)}</span>
                                                <span>〜</span>
                                                <span>{formatDate(wo.plannedEndDate)}</span>
                                            </div>
                                            {predictedTimes[wo.id] && (
                                                <div className="mt-2 text-[10px] text-muted-foreground">
                                                    {predictedTimes[wo.id].predictedHours !== null ? (
                                                        <span className="text-blue-600 font-medium">
                                                            AI予測: {predictedTimes[wo.id].predictedHours?.toFixed(1)}時間
                                                            {predictedTimes[wo.id].dataCount > 0 && (
                                                                <span className="text-[9px] ml-1">
                                                                    ({predictedTimes[wo.id].dataCount}件の実績より)
                                                                </span>
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">予測データ不足</span>
                                                    )}
                                                </div>
                                            )}
                                            <div className="mt-3 overflow-hidden h-1.5 rounded-full bg-muted">
                                                <div style={{ width: `${progress}%` }} className="h-full bg-primary"></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            スケジュールデータがありません
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
