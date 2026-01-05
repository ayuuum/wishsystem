"use client";

import React, { useState, useEffect } from 'react';
import {
    ChevronRight,
    ChevronDown,
    Layers,
    Plus,
    MoreVertical,
    Search,
    ArrowLeft
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';
import { getBomByOrderId, getBomTotalCost, approveBom, deleteBomItem } from "@/app/actions/bom";
import { getOrderById } from "@/app/actions/orders";
import { calculateCostBreakdown } from "@/lib/utils/calculations";
import { useRouter, useParams } from "next/navigation";
import { BomItemDialog } from "./bom-item-dialog";
import { BomSuggestionDialog } from "./bom-suggestion-dialog";
import { toast } from "@/lib/toast";
import { Sparkles } from "lucide-react";

interface BomItem {
    id: string;
    itemCode: string;
    itemName: string;
    quantity: number | string;
    unit: string;
    level: number;
    unitCost: number | string;
    totalCost: number | string;
    childBoms?: BomItem[];
}

export function BomTreeView({ 
    items, 
    level = 0, 
    onDelete, 
    onEdit,
    orderId 
}: { 
    items: BomItem[], 
    level?: number, 
    onDelete?: (id: string) => void,
    onEdit?: (item: BomItem) => void,
    orderId?: string
}) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // 最初のレベルは展開
    useEffect(() => {
        const initialExpanded: Record<string, boolean> = {};
        items.forEach(item => {
            if (item.level === 0) {
                initialExpanded[item.id] = true;
            }
        });
        setExpanded(initialExpanded);
    }, [items]);

    return (
        <div className="space-y-1">
            {items.map((item) => (
                <div key={item.id} className="space-y-1">
                    <div
                        className={`
                            flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors border
                            ${level === 0 ? 'bg-primary/5 font-bold border-primary/20' : 'bg-background'}
                        `}
                        style={{ marginLeft: `${level * 20}px` }}
                    >
                        <button
                            onClick={() => toggleExpand(item.id)}
                            className="p-1 hover:bg-muted rounded"
                        >
                            {item.childBoms && item.childBoms.length > 0 ? (
                                expanded[item.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                            ) : (
                                <div className="w-4 h-4" />
                            )}
                        </button>
                        <div className="flex-1 flex items-center justify-between min-w-0">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">{item.itemCode}</span>
                                <span className="truncate">{item.itemName}</span>
                            </div>
                            <div className="flex items-center gap-6 px-4">
                                <div className="text-right w-24">
                                    <span className="text-sm font-medium">{Number(item.quantity).toLocaleString()}</span>
                                    <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                                </div>
                                <div className="text-right w-32">
                                    <span className="text-sm font-bold">¥{Number(item.totalCost).toLocaleString()}</span>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEdit && onEdit(item)}>
                                            編集
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onEdit && onEdit({ ...item, id: '', level: item.level + 1, parentBomId: item.id } as any)}>
                                            子部品を追加
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                            className="text-red-600"
                                            onClick={() => onDelete && onDelete(item.id)}
                                        >
                                            削除
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                    {item.childBoms && expanded[item.id] && (
                        <BomTreeView items={item.childBoms} level={level + 1} onDelete={onDelete} onEdit={onEdit} orderId={orderId} />
                    )}
                </div>
            ))}
        </div>
    );
}

export default function OrderBomPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params?.id as string | undefined;
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/522b9dd6-62bf-43dc-a4fb-fcba4c30eae5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bom/page.tsx:147',message:'OrderBomPage component initialized',data:{orderId,params:params?JSON.stringify(params):'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const [bomItems, setBomItems] = useState<BomItem[]>([]);
    const [order, setOrder] = useState<any>(null);
    const [totalCost, setTotalCost] = useState(0);
    const [costBreakdown, setCostBreakdown] = useState({ materialCost: 0, outsourcingCost: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [suggestionDialogOpen, setSuggestionDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<BomItem | null>(null);
    const [addingParentId, setAddingParentId] = useState<string | undefined>(undefined);

    useEffect(() => {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/522b9dd6-62bf-43dc-a4fb-fcba4c30eae5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bom/page.tsx:161',message:'useEffect triggered',data:{orderId,hasOrderId:!!orderId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        if (orderId) {
            loadData();
        } else {
            // #region agent log
            fetch('http://127.0.0.1:7245/ingest/522b9dd6-62bf-43dc-a4fb-fcba4c30eae5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bom/page.tsx:165',message:'orderId is undefined',data:{params:params?JSON.stringify(params):'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            setIsLoading(false);
        }
    }, [orderId]);

    const loadData = async () => {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/522b9dd6-62bf-43dc-a4fb-fcba4c30eae5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bom/page.tsx:161',message:'loadData called',data:{orderId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        setIsLoading(true);
        try {
            const [bomResult, orderResult, costResult] = await Promise.all([
                getBomByOrderId(orderId),
                getOrderById(orderId),
                getBomTotalCost(orderId),
            ]);

            if (bomResult.success && bomResult.data) {
                setBomItems(bomResult.data);
                const breakdown = calculateCostBreakdown(bomResult.data);
                setCostBreakdown(breakdown);
            }
            if (orderResult.success && orderResult.data) {
                setOrder(orderResult.data);
            }
            if (costResult.success && costResult.data) {
                setTotalCost(costResult.data);
            }
        } catch (error) {
            console.error("Failed to load BOM data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("このBOMアイテムを削除しますか？")) {
            return;
        }

        const result = await deleteBomItem(id);
        if (result.success) {
            toast.success("BOMアイテムを削除しました");
            await loadData();
        } else {
            toast.error(result.error?.message || "削除に失敗しました");
        }
    };

    const handleEdit = (item: BomItem) => {
        setEditingItem(item);
        setAddingParentId(undefined);
        setDialogOpen(true);
    };

    const handleAdd = (parentId?: string) => {
        setEditingItem(null);
        setAddingParentId(parentId);
        setDialogOpen(true);
    };

    const handleApprove = async () => {
        if (!confirm("BOMを承認しますか？承認すると生産計画に移行可能になります。")) {
            return;
        }

        const result = await approveBom(orderId);
        if (result.success) {
            toast.success("BOMを承認しました");
            router.refresh();
        } else {
            toast.error(result.error?.message || "承認に失敗しました");
        }
    };

    const filteredItems = search
        ? bomItems.filter(item => 
            item.itemCode.toLowerCase().includes(search.toLowerCase()) ||
            item.itemName.toLowerCase().includes(search.toLowerCase())
          )
        : bomItems;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href={`/orders/${orderId}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">部品構成 (BOM) 管理</h2>
                    <p className="text-muted-foreground">
                        案件: {order?.orderNo || '...'} / {order?.productName || '...'}
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button variant="outline" onClick={() => setSuggestionDialogOpen(true)}>
                        <Sparkles className="mr-2 h-4 w-4" /> 類似案件から提案
                    </Button>
                    <Button onClick={() => handleAdd()}>
                        <Plus className="mr-2 h-4 w-4" /> 行を追加
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>BOMツリー構造</CardTitle>
                                <CardDescription>ドラッグ&ドロップで階層構造を編集できます</CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="構成内を検索..." 
                                    className="pl-8"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8 text-muted-foreground">
                                読み込み中...
                            </div>
                        ) : filteredItems.length > 0 ? (
                            <div className="border rounded-lg p-4 bg-muted/10">
                                <div className="flex items-center justify-between px-2 mb-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b pb-2">
                                    <div className="flex-1">名称 / 型番</div>
                                    <div className="flex items-center gap-6 px-4">
                                        <div className="text-right w-24">数量 / 単位</div>
                                        <div className="text-right w-32">金額 (合計)</div>
                                        <div className="w-8"></div>
                                    </div>
                                </div>
                                <BomTreeView 
                                    items={filteredItems} 
                                    onDelete={handleDelete} 
                                    onEdit={handleEdit}
                                    orderId={params.id}
                                />
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                BOMデータがありません
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>原価サマリ</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">材料費合計</span>
                                <span>¥{costBreakdown.materialCost.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">外注費合計</span>
                                <span>¥{costBreakdown.outsourcingCost.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm border-t pt-2">
                                <span className="font-bold">原価総計</span>
                                <span className="font-bold text-xl">¥{totalCost.toLocaleString()}</span>
                            </div>
                        </div>
                        {order?.status === 'BOM_REVIEW' && (
                            <div className="space-y-3 pt-6 border-t">
                                <p className="text-xs font-bold text-muted-foreground">ステータス</p>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between p-2 rounded border bg-orange-50 border-orange-200">
                                        <span className="text-xs font-bold text-orange-700">BOM承認待ち</span>
                                        <Button size="sm" variant="outline" className="h-7 text-xs bg-white" onClick={handleApprove}>
                                            承認する
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">承認されると生産計画に移行可能になります</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <BomItemDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                orderId={orderId}
                bomItem={editingItem || undefined}
                parentBomId={addingParentId}
                level={editingItem ? editingItem.level : (addingParentId ? 1 : 0)}
                onSuccess={loadData}
            />
            <BomSuggestionDialog
                open={suggestionDialogOpen}
                onOpenChange={setSuggestionDialogOpen}
                orderId={orderId}
                onSuccess={loadData}
            />
        </div>
    );
}
