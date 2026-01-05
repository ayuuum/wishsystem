import { notFound } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getInventoryById } from "@/app/actions/inventory";
import { formatDate } from "@/lib/utils/date";
import { isLowStock } from "@/lib/utils/calculations";

export default async function InventoryDetailPage({ params }: { params: { id: string } }) {
    const result = await getInventoryById(params.id);

    if (!result.success || !result.data) {
        notFound();
    }

    const inventory = result.data;
    const lowStock = isLowStock(
        Number(inventory.availableQuantity),
        Number(inventory.safetyStock)
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/inventory">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">在庫詳細</h2>
                    <p className="text-muted-foreground">
                        {inventory.itemCode} / {inventory.itemName}
                    </p>
                </div>
                <div className="ml-auto">
                    {lowStock ? (
                        <Badge variant="destructive" className="flex w-fit items-center gap-1">
                            <AlertTriangle className="h-4 w-4" /> 在庫不足
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                            正常
                        </Badge>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>基本情報</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">部品コード</p>
                            <p className="font-mono text-lg">{inventory.itemCode}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">部品名</p>
                            <p className="text-lg font-medium">{inventory.itemName}</p>
                        </div>
                        {inventory.item?.unit && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">単位</p>
                                <p>{inventory.item.unit}</p>
                            </div>
                        )}
                        {inventory.item?.specification && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">仕様</p>
                                <p>{inventory.item.specification}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>在庫情報</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">現在庫</p>
                            <p className="text-2xl font-bold">{Number(inventory.stockQuantity).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">引当済み数量</p>
                            <p className="text-xl">{Number(inventory.allocatedQuantity).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">有効在庫</p>
                            <p className={`text-2xl font-bold ${lowStock ? 'text-red-600' : 'text-primary'}`}>
                                {Number(inventory.availableQuantity).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">安全在庫</p>
                            <p className="text-xl">{Number(inventory.safetyStock).toLocaleString()}</p>
                        </div>
                        {lowStock && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                                <p className="text-sm font-medium text-red-900">
                                    警告: 有効在庫が安全在庫を下回っています
                                </p>
                                <p className="text-xs text-red-700 mt-1">
                                    差: {Number(inventory.availableQuantity) - Number(inventory.safetyStock)} {inventory.item?.unit || ''}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>更新情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">最終同期日時</span>
                        <span>{formatDate(inventory.lastSyncedAt, 'yyyy-MM-dd HH:mm')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">作成日時</span>
                        <span>{formatDate(inventory.createdAt, 'yyyy-MM-dd HH:mm')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">更新日時</span>
                        <span>{formatDate(inventory.updatedAt, 'yyyy-MM-dd HH:mm')}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

