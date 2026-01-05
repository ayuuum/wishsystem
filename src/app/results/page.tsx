"use client";

import React, { useState, useEffect, useTransition } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Activity,
    Save,
    History,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import { createWorkResult } from "@/app/actions/results";
import { getOrders } from "@/app/actions/orders";
import { getWorkOrdersByOrderId } from "@/app/actions/schedule";
import { getTodayResults } from "@/app/actions/results";
import { calculateTotalWorkHours } from "@/lib/utils/calculations";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

export default function ResultsInputPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [orders, setOrders] = useState<any[]>([]);
    const [workOrders, setWorkOrders] = useState<any[]>([]);
    const [todayResults, setTodayResults] = useState<any[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState<string>("");
    const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string>("");
    
    const [formData, setFormData] = useState({
        workDate: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "17:00",
        quantity: "1",
        defectQuantity: "0",
        remarks: "",
        workerId: "worker-001", // TODO: 認証実装時に実際のユーザーIDを使用
    });

    useEffect(() => {
        loadOrders();
        loadTodayResults();
    }, []);

    useEffect(() => {
        if (selectedOrderId) {
            loadWorkOrders(selectedOrderId);
        } else {
            setWorkOrders([]);
        }
    }, [selectedOrderId]);

    const loadOrders = async () => {
        const result = await getOrders({ pageSize: 100 });
        if (result.success && result.data) {
            setOrders(result.data.orders.filter((o: any) => 
                o.status === 'IN_PRODUCTION' || o.status === 'PLANNING'
            ));
        }
    };

    const loadWorkOrders = async (orderId: string) => {
        const result = await getWorkOrdersByOrderId(orderId);
        if (result.success && result.data) {
            setWorkOrders(result.data);
        }
    };

    const loadTodayResults = async () => {
        const result = await getTodayResults();
        if (result.success && result.data) {
            setTodayResults(result.data);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedWorkOrderId) {
            toast.error("工程を選択してください");
            return;
        }

        setIsSubmitting(true);
        
        try {
            const workDate = new Date(formData.workDate);
            const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
            const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
            
            const startTime = new Date(workDate);
            startTime.setHours(startHours, startMinutes, 0, 0);
            
            const endTime = new Date(workDate);
            endTime.setHours(endHours, endMinutes, 0, 0);

            const result = await createWorkResult({
                workOrderId: selectedWorkOrderId,
                workerId: formData.workerId,
                workDate,
                startTime,
                endTime,
                quantity: parseFloat(formData.quantity),
                defectQuantity: parseFloat(formData.defectQuantity) || 0,
                remarks: formData.remarks,
            });

            if (result.success) {
                toast.success("実績を登録しました");
                // フォームをリセット
                setFormData({
                    workDate: new Date().toISOString().split('T')[0],
                    startTime: "09:00",
                    endTime: "17:00",
                    quantity: "1",
                    defectQuantity: "0",
                    remarks: "",
                    workerId: formData.workerId,
                });
                setSelectedOrderId("");
                setSelectedWorkOrderId("");
                loadTodayResults();
            } else {
                toast.error(result.error?.message || "実績の登録に失敗しました");
            }
        } catch (error) {
            console.error("Failed to submit work result:", error);
            toast.error("実績の登録に失敗しました");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalWorkHours = calculateTotalWorkHours(todayResults);
    const lastResult = todayResults.length > 0 ? todayResults[0] : null;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-primary">製造実績入力</h2>
                    <p className="text-muted-foreground">現場での本日分の作業実績をリアルタイムで記録します</p>
                </div>
                <Button variant="outline" asChild>
                    <a href="/results/history">
                        <History className="mr-2 h-4 w-4" /> 履歴を確認
                    </a>
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>実績登録フォーム</CardTitle>
                            <CardDescription>
                                すべての項目を入力して「登録」ボタンを押してください
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="order">案件選択</Label>
                                        <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                                            <SelectTrigger id="order">
                                                <SelectValue placeholder="案件を選択してください" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {orders.map((order) => (
                                                    <SelectItem key={order.id} value={order.id}>
                                                        {order.orderNo} ({order.customerName})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="process">工程選択</Label>
                                        <Select 
                                            value={selectedWorkOrderId} 
                                            onValueChange={setSelectedWorkOrderId}
                                            disabled={!selectedOrderId || workOrders.length === 0}
                                        >
                                            <SelectTrigger id="process">
                                                <SelectValue placeholder="工程を選択してください" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {workOrders.map((wo) => (
                                                    <SelectItem key={wo.id} value={wo.id}>
                                                        {wo.processName} ({wo.status === 'COMPLETED' ? '完了済' : wo.status === 'IN_PROGRESS' ? '実行中' : '未着手'})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="work-date">作業日</Label>
                                        <Input 
                                            id="work-date" 
                                            type="date" 
                                            value={formData.workDate}
                                            onChange={(e) => setFormData({ ...formData, workDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="start-time">開始時刻</Label>
                                        <Input 
                                            id="start-time" 
                                            type="time" 
                                            value={formData.startTime}
                                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end-time">終了時刻</Label>
                                        <Input 
                                            id="end-time" 
                                            type="time" 
                                            value={formData.endTime}
                                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="good-qty">良品数量</Label>
                                        <Input 
                                            id="good-qty" 
                                            type="number" 
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                            min="0" 
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="defect-qty">不良数量</Label>
                                        <Input 
                                            id="defect-qty" 
                                            type="number" 
                                            value={formData.defectQuantity}
                                            onChange={(e) => setFormData({ ...formData, defectQuantity: e.target.value })}
                                            min="0" 
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="remarks">備考 (特記事項など)</Label>
                                    <Textarea 
                                        id="remarks" 
                                        placeholder="作業中に発生した問題や連絡事項があれば記入してください"
                                        value={formData.remarks}
                                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                    />
                                </div>

                                <Button type="submit" className="w-full h-12 text-lg" disabled={isSubmitting || !selectedWorkOrderId}>
                                    <Save className="mr-2 h-5 w-5" /> {isSubmitting ? "登録中..." : "実績を登録する"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">本日の累積実績</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-primary/10 text-primary">
                                    <Activity className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{totalWorkHours.toFixed(1)}h</div>
                                    <p className="text-xs text-muted-foreground">総作業時間</p>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span>登録件数</span>
                                    <span className="font-medium">{todayResults.length}件</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {lastResult && (
                        <Card className="bg-emerald-50 border-emerald-100">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center text-emerald-700">
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> 前回登録
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-emerald-800">
                                    {formatDate(lastResult.workDate)}<br />
                                    実績: {Number(lastResult.quantity).toLocaleString()}個 / 
                                    完了日時: {formatDateTime(lastResult.endTime)}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
