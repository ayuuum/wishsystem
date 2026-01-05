"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function OrdersSearchClient({ initialSearch }: { initialSearch?: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState(initialSearch || "");
    const [isPending, startTransition] = useTransition();

    const handleSearch = (value: string) => {
        setSearch(value);
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set("search", value);
        } else {
            params.delete("search");
        }
        params.delete("page"); // 検索時はページをリセット
        startTransition(() => {
            router.push(`/orders?${params.toString()}`);
        });
    };

    return (
        <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="検索 (案件番号、顧客名...)"
                className="pl-8"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                disabled={isPending}
            />
        </div>
    );
}

