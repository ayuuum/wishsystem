"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function OrdersFilterClient({ initialStatus }: { initialStatus?: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState(initialStatus || "");
    const [isPending, startTransition] = useTransition();

    const handleStatusChange = (value: string) => {
        setStatus(value);
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== "all") {
            params.set("status", value);
        } else {
            params.delete("status");
        }
        params.delete("page"); // フィルタ変更時はページをリセット
        startTransition(() => {
            router.push(`/orders?${params.toString()}`);
        });
    };

    return (
        <div className="flex items-center gap-2">
            <Label htmlFor="status-filter" className="text-sm">ステータス:</Label>
            <Select value={status || "all"} onValueChange={handleStatusChange} disabled={isPending}>
                <SelectTrigger id="status-filter" className="w-40">
                    <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="DRAFT">下書き</SelectItem>
                    <SelectItem value="DESIGN">設計中</SelectItem>
                    <SelectItem value="BOM_REVIEW">BOM承認待ち</SelectItem>
                    <SelectItem value="PLANNING">生産計画中</SelectItem>
                    <SelectItem value="IN_PRODUCTION">製造中</SelectItem>
                    <SelectItem value="COMPLETED">完了</SelectItem>
                    <SelectItem value="SHIPPED">出荷済み</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}

