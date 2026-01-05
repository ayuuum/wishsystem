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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { suggestBomFromSimilarOrders } from "@/app/actions/ai";
import { createBomItem } from "@/app/actions/bom";
import { toast } from "@/lib/toast";
import { formatDate } from "@/lib/utils/date";
import { Loader2 } from "lucide-react";

interface BomSuggestionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: string;
    onSuccess: () => void;
}

interface Suggestion {
    order: {
        id: string;
        orderNo: string;
        productName: string;
        customerName: string;
        orderedDate: Date;
    };
    bomItems: Array<{
        id: string;
        itemCode: string;
        itemName: string;
        quantity: number;
        unit: string;
        unitCost: number;
        totalCost: number;
        level: number;
    }>;
    similarityScore: number;
}

export function BomSuggestionDialog({
    open,
    onOpenChange,
    orderId,
    onSuccess,
}: BomSuggestionDialogProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open && orderId) {
            loadSuggestions();
        } else {
            setSuggestions([]);
            setSelectedItems(new Set());
        }
    }, [open, orderId]);

    const loadSuggestions = async () => {
        setIsLoading(true);
        try {
            const result = await suggestBomFromSimilarOrders(orderId);
            if (result.success && result.data) {
                setSuggestions(result.data);
            } else {
                toast.error(result.error?.message || "提案の取得に失敗しました");
            }
        } catch (error) {
            console.error("Failed to load suggestions:", error);
            toast.error("提案の取得に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleItem = (orderId: string, itemId: string) => {
        const key = `${orderId}-${itemId}`;
        const newSelected = new Set(selectedItems);
        if (newSelected.has(key)) {
            newSelected.delete(key);
        } else {
            newSelected.add(key);
        }
        setSelectedItems(newSelected);
    };

    const toggleAllItems = (orderId: string) => {
        const suggestion = suggestions.find((s) => s.order.id === orderId);
        if (!suggestion) return;

        const allSelected = suggestion.bomItems.every((item) =>
            selectedItems.has(`${orderId}-${item.id}`)
        );

        const newSelected = new Set(selectedItems);
        if (allSelected) {
            // すべて解除
            suggestion.bomItems.forEach((item) => {
                newSelected.delete(`${orderId}-${item.id}`);
            });
        } else {
            // すべて選択
            suggestion.bomItems.forEach((item) => {
                newSelected.add(`${orderId}-${item.id}`);
            });
        }
        setSelectedItems(newSelected);
    };

    const handleSubmit = async () => {
        if (selectedItems.size === 0) {
            toast.error("追加するBOMアイテムを選択してください");
            return;
        }

        setIsSubmitting(true);
        try {
            let successCount = 0;
            let errorCount = 0;

            // 選択されたアイテムを追加
            for (const key of selectedItems) {
                const [sourceOrderId, itemId] = key.split("-");
                const suggestion = suggestions.find((s) => s.order.id === sourceOrderId);
                if (!suggestion) continue;

                const item = suggestion.bomItems.find((i) => i.id === itemId);
                if (!item) continue;

                const result = await createBomItem({
                    orderId,
                    itemId: `temp-${Date.now()}-${itemId}`, // 一時ID
                    itemCode: item.itemCode,
                    itemName: item.itemName,
                    quantity: item.quantity,
                    unit: item.unit,
                    level: item.level,
                    sortOrder: 0,
                    unitCost: item.unitCost,
                    totalCost: item.totalCost,
                    leadTimeDays: 0,
                });

                if (result.success) {
                    successCount++;
                } else {
                    errorCount++;
                }
            }

            if (successCount > 0) {
                toast.success(`${successCount}件のBOMアイテムを追加しました`);
                onSuccess();
                onOpenChange(false);
            }
            if (errorCount > 0) {
                toast.error(`${errorCount}件の追加に失敗しました`);
            }
        } catch (error) {
            console.error("Failed to add BOM items:", error);
            toast.error("BOMアイテムの追加に失敗しました");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>類似案件からBOMを提案</DialogTitle>
                    <DialogDescription>
                        過去の類似案件のBOMから、必要なアイテムを選択して追加できます
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">提案を読み込み中...</span>
                    </div>
                ) : suggestions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        類似案件が見つかりませんでした
                    </div>
                ) : (
                    <div className="space-y-4">
                        {suggestions.map((suggestion) => (
                            <div
                                key={suggestion.order.id}
                                className="border rounded-lg p-4 bg-muted/30"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-sm">
                                                {suggestion.order.orderNo} - {suggestion.order.productName}
                                            </h4>
                                            <Badge variant="outline" className="text-xs">
                                                類似度: {suggestion.similarityScore}点
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            顧客: {suggestion.order.customerName} / 受注日:{" "}
                                            {formatDate(suggestion.order.orderedDate)}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleAllItems(suggestion.order.id)}
                                        className="text-xs"
                                    >
                                        {suggestion.bomItems.every((item) =>
                                            selectedItems.has(`${suggestion.order.id}-${item.id}`)
                                        )
                                            ? "すべて解除"
                                            : "すべて選択"}
                                    </Button>
                                </div>

                                {suggestion.bomItems.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">BOMデータがありません</p>
                                ) : (
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {suggestion.bomItems.map((item) => {
                                            const key = `${suggestion.order.id}-${item.id}`;
                                            const isSelected = selectedItems.has(key);
                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`flex items-center gap-3 p-2 rounded border ${
                                                        isSelected ? "bg-primary/5 border-primary/20" : "bg-background"
                                                    }`}
                                                >
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() =>
                                                            toggleItem(suggestion.order.id, item.id)
                                                        }
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-mono text-muted-foreground">
                                                                {item.itemCode}
                                                            </span>
                                                            <span className="text-sm font-medium truncate">
                                                                {item.itemName}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                                            <span>
                                                                数量: {item.quantity.toLocaleString()} {item.unit}
                                                            </span>
                                                            <span>単価: ¥{item.unitCost.toLocaleString()}</span>
                                                            <span className="font-bold">
                                                                合計: ¥{item.totalCost.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        キャンセル
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || selectedItems.size === 0}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                追加中...
                            </>
                        ) : (
                            `選択した${selectedItems.size}件を追加`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

