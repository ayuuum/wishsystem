"use client";

import React, { useState, useEffect, useTransition } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
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
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { updateOrder, getOrderById } from "@/app/actions/orders";
import { useRouter } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import { formatDate } from "@/lib/utils/date";
import { toast } from "@/lib/toast";

export default function EditOrderPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        customerCode: "",
        customerName: "",
        productName: "",
        productSpec: "",
        orderedDate: "",
        dueDate: "",
        estimatedPrice: "",
        status: OrderStatus.DRAFT,
        priority: "3",
        salesRepId: "",
        designerId: "",
        productionManagerId: "",
    });

    useEffect(() => {
        loadOrder();
    }, [params.id]);

    const loadOrder = async () => {
        setIsLoading(true);
        try {
            const result = await getOrderById(params.id);
            if (result.success && result.data) {
                const order = result.data;
                setFormData({
                    customerCode: order.customerCode || "",
                    customerName: order.customerName || "",
                    productName: order.productName || "",
                    productSpec: order.productSpec || "",
                    orderedDate: formatDate(order.orderedDate, 'yyyy-MM-dd'),
                    dueDate: formatDate(order.dueDate, 'yyyy-MM-dd'),
                    estimatedPrice: String(order.estimatedPrice || 0),
                    status: order.status,
                    priority: String(order.priority || 3),
                    salesRepId: order.salesRepId || "",
                    designerId: order.designerId || "",
                    productionManagerId: order.productionManagerId || "",
                });
            } else {
                toast.error("案件データの取得に失敗しました");
                router.push("/orders");
            }
        } catch (error) {
            console.error("Failed to load order:", error);
            toast.error("案件データの取得に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const result = await updateOrder(params.id, {
                customerCode: formData.customerCode,
                customerName: formData.customerName,
                productName: formData.productName,
                productSpec: formData.productSpec || undefined,
                orderedDate: new Date(formData.orderedDate),
                dueDate: new Date(formData.dueDate),
                estimatedPrice: parseFloat(formData.estimatedPrice),
                status: formData.status,
                priority: parseInt(formData.priority),
                salesRepId: formData.salesRepId || undefined,
                designerId: formData.designerId || undefined,
                productionManagerId: formData.productionManagerId || undefined,
            });

            if (result.success) {
                toast.success("案件を更新しました");
                router.push(`/orders/${params.id}`);
            } else {
                toast.error(result.error?.message || "案件の更新に失敗しました");
            }
        } catch (error) {
            console.error("Failed to update order:", error);
            toast.error("案件の更新に失敗しました");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">読み込み中...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href={`/orders/${params.id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">案件編集</h2>
                    <p className="text-muted-foreground">
                        案件情報を編集します
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>案件情報</CardTitle>
                    <CardDescription>
                        案件情報を編集して「保存」ボタンを押してください
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="customerCode">顧客コード</Label>
                                <Input
                                    id="customerCode"
                                    value={formData.customerCode}
                                    onChange={(e) => setFormData({ ...formData, customerCode: e.target.value })}
                                    placeholder="CUST-001"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="customerName">顧客名 <span className="text-red-500">*</span></Label>
                            <Input
                                id="customerName"
                                value={formData.customerName}
                                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                placeholder="株式会社○○"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="productName">製品名 <span className="text-red-500">*</span></Label>
                            <Input
                                id="productName"
                                value={formData.productName}
                                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                                placeholder="特殊防火ダンパー"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="productSpec">製品仕様・特記事項</Label>
                            <Textarea
                                id="productSpec"
                                value={formData.productSpec}
                                onChange={(e) => setFormData({ ...formData, productSpec: e.target.value })}
                                placeholder="製品の仕様や特記事項を入力してください"
                                rows={3}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="orderedDate">受注日 <span className="text-red-500">*</span></Label>
                                <Input
                                    id="orderedDate"
                                    type="date"
                                    value={formData.orderedDate}
                                    onChange={(e) => setFormData({ ...formData, orderedDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dueDate">納期 <span className="text-red-500">*</span></Label>
                                <Input
                                    id="dueDate"
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="estimatedPrice">見積金額 <span className="text-red-500">*</span></Label>
                                <Input
                                    id="estimatedPrice"
                                    type="number"
                                    value={formData.estimatedPrice}
                                    onChange={(e) => setFormData({ ...formData, estimatedPrice: e.target.value })}
                                    placeholder="5000000"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="priority">優先度</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                                >
                                    <SelectTrigger id="priority">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">P1 - 最優先</SelectItem>
                                        <SelectItem value="2">P2 - 高</SelectItem>
                                        <SelectItem value="3">P3 - 中</SelectItem>
                                        <SelectItem value="4">P4 - 低</SelectItem>
                                        <SelectItem value="5">P5 - 最低</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">ステータス</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value as OrderStatus })}
                            >
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={OrderStatus.DRAFT}>下書き</SelectItem>
                                    <SelectItem value={OrderStatus.DESIGN}>設計中</SelectItem>
                                    <SelectItem value={OrderStatus.BOM_REVIEW}>BOM承認待ち</SelectItem>
                                    <SelectItem value={OrderStatus.PLANNING}>生産計画中</SelectItem>
                                    <SelectItem value={OrderStatus.IN_PRODUCTION}>製造中</SelectItem>
                                    <SelectItem value={OrderStatus.COMPLETED}>完了</SelectItem>
                                    <SelectItem value={OrderStatus.SHIPPED}>出荷済み</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="pt-4 border-t">
                            <h3 className="text-sm font-medium mb-4">担当者情報（任意）</h3>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="salesRepId">営業担当ID</Label>
                                    <Input
                                        id="salesRepId"
                                        value={formData.salesRepId}
                                        onChange={(e) => setFormData({ ...formData, salesRepId: e.target.value })}
                                        placeholder="SALES-001"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="designerId">設計担当ID</Label>
                                    <Input
                                        id="designerId"
                                        value={formData.designerId}
                                        onChange={(e) => setFormData({ ...formData, designerId: e.target.value })}
                                        placeholder="DESIGN-001"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="productionManagerId">生産管理担当ID</Label>
                                    <Input
                                        id="productionManagerId"
                                        value={formData.productionManagerId}
                                        onChange={(e) => setFormData({ ...formData, productionManagerId: e.target.value })}
                                        placeholder="PROD-001"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button type="button" variant="outline" asChild>
                                <Link href={`/orders/${params.id}`}>キャンセル</Link>
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                <Save className="mr-2 h-4 w-4" />
                                {isSubmitting ? "保存中..." : "保存"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

