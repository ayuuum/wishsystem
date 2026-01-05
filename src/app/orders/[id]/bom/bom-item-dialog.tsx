"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { createBomItem, updateBomItem } from "@/app/actions/bom";
import { getItems } from "@/app/actions/items";
import { toast } from "@/lib/toast";

interface BomItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: string;
    bomItem?: any;
    parentBomId?: string;
    level: number;
    onSuccess: () => void;
}

export function BomItemDialog({
    open,
    onOpenChange,
    orderId,
    bomItem,
    parentBomId,
    level,
    onSuccess,
}: BomItemDialogProps) {
    const [formData, setFormData] = useState({
        itemId: "",
        itemCode: "",
        itemName: "",
        quantity: "1",
        unit: "個",
        unitCost: "0",
        leadTimeDays: "0",
        remarks: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const [itemSearch, setItemSearch] = useState("");

    useEffect(() => {
        if (itemSearch) {
            loadItems();
        } else {
            setItems([]);
        }
    }, [itemSearch]);

    const loadItems = async () => {
        const result = await getItems({ search: itemSearch });
        if (result.success && result.data) {
            setItems(result.data);
        }
    };

    useEffect(() => {
        if (bomItem) {
            setFormData({
                itemId: bomItem.itemId || "",
                itemCode: bomItem.itemCode || "",
                itemName: bomItem.itemName || "",
                quantity: String(bomItem.quantity || 1),
                unit: bomItem.unit || "個",
                unitCost: String(bomItem.unitCost || 0),
                leadTimeDays: String(bomItem.leadTimeDays || 0),
                remarks: bomItem.remarks || "",
            });
        } else {
            setFormData({
                itemId: "",
                itemCode: "",
                itemName: "",
                quantity: "1",
                unit: "個",
                unitCost: "0",
                leadTimeDays: "0",
                remarks: "",
            });
        }
    }, [bomItem, open]);

    const handleItemSelect = (item: any) => {
        setFormData({
            ...formData,
            itemId: item.id,
            itemCode: item.itemCode,
            itemName: item.itemName,
            unit: item.unit,
            unitCost: String(item.standardCost || 0),
        });
        setItemSearch("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const quantity = parseFloat(formData.quantity);
            const unitCost = parseFloat(formData.unitCost);
            const totalCost = quantity * unitCost;

            if (bomItem) {
                // 更新
                const result = await updateBomItem(bomItem.id, {
                    itemCode: formData.itemCode,
                    itemName: formData.itemName,
                    quantity,
                    unit: formData.unit,
                    unitCost,
                    totalCost,
                    leadTimeDays: parseInt(formData.leadTimeDays) || 0,
                    remarks: formData.remarks || undefined,
                });

                if (result.success) {
                    toast.success("BOMアイテムを更新しました");
                    onOpenChange(false);
                    onSuccess();
                } else {
                    toast.error(result.error?.message || "更新に失敗しました");
                }
            } else {
                // 新規作成
                const result = await createBomItem({
                    orderId,
                    parentBomId,
                    itemId: formData.itemId || `temp-${Date.now()}`, // 部品マスタから選択した場合は実際のID、そうでない場合は一時ID
                    itemCode: formData.itemCode,
                    itemName: formData.itemName,
                    quantity,
                    unit: formData.unit,
                    level,
                    sortOrder: 0,
                    unitCost,
                    totalCost,
                    leadTimeDays: parseInt(formData.leadTimeDays) || 0,
                    remarks: formData.remarks || undefined,
                });

                if (result.success) {
                    toast.success("BOMアイテムを追加しました");
                    onOpenChange(false);
                    onSuccess();
                } else {
                    toast.error(result.error?.message || "追加に失敗しました");
                }
            }
        } catch (error) {
            console.error("Failed to save BOM item:", error);
            toast.error("保存に失敗しました");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {bomItem ? "BOMアイテムを編集" : "BOMアイテムを追加"}
                    </DialogTitle>
                    <DialogDescription>
                        部品情報を入力してください
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!bomItem && (
                        <div className="space-y-2">
                            <Label htmlFor="itemSearch">部品マスタから選択（任意）</Label>
                            <div className="relative">
                                <Input
                                    id="itemSearch"
                                    placeholder="部品コードまたは部品名で検索..."
                                    value={itemSearch}
                                    onChange={(e) => setItemSearch(e.target.value)}
                                />
                                {itemSearch && items.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                                        {items.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => handleItemSelect(item)}
                                                className="w-full text-left px-4 py-2 hover:bg-muted border-b last:border-b-0"
                                            >
                                                <div className="font-medium">{item.itemCode}</div>
                                                <div className="text-sm text-muted-foreground">{item.itemName}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="itemCode">部品コード <span className="text-red-500">*</span></Label>
                            <Input
                                id="itemCode"
                                value={formData.itemCode}
                                onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit">単位</Label>
                            <Select
                                value={formData.unit}
                                onValueChange={(value) => setFormData({ ...formData, unit: value })}
                            >
                                <SelectTrigger id="unit">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="個">個</SelectItem>
                                    <SelectItem value="式">式</SelectItem>
                                    <SelectItem value="枚">枚</SelectItem>
                                    <SelectItem value="本">本</SelectItem>
                                    <SelectItem value="kg">kg</SelectItem>
                                    <SelectItem value="m">m</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="itemName">部品名 <span className="text-red-500">*</span></Label>
                        <Input
                            id="itemName"
                            value={formData.itemName}
                            onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">数量 <span className="text-red-500">*</span></Label>
                            <Input
                                id="quantity"
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unitCost">単価</Label>
                            <Input
                                id="unitCost"
                                type="number"
                                value={formData.unitCost}
                                onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="totalCost">合計金額</Label>
                            <Input
                                id="totalCost"
                                value={(parseFloat(formData.quantity) * parseFloat(formData.unitCost)).toLocaleString()}
                                disabled
                                className="font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="leadTimeDays">リードタイム（日数）</Label>
                        <Input
                            id="leadTimeDays"
                            type="number"
                            value={formData.leadTimeDays}
                            onChange={(e) => setFormData({ ...formData, leadTimeDays: e.target.value })}
                            min="0"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="remarks">備考</Label>
                        <Textarea
                            id="remarks"
                            value={formData.remarks}
                            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            キャンセル
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "保存中..." : "保存"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

