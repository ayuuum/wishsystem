"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function ResultsHistorySearchClient({ 
    initialSearch, 
    initialDate 
}: { 
    initialSearch?: string;
    initialDate?: string;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState(initialSearch || "");
    const [date, setDate] = useState(initialDate || "");
    const [isPending, startTransition] = useTransition();

    const handleSearch = (value: string) => {
        setSearch(value);
        updateParams(value, date);
    };

    const handleDateChange = (value: string) => {
        setDate(value);
        updateParams(search, value);
    };

    const updateParams = (searchValue: string, dateValue: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (searchValue) {
            params.set("search", searchValue);
        } else {
            params.delete("search");
        }
        if (dateValue) {
            params.set("date", dateValue);
        } else {
            params.delete("date");
        }
        startTransition(() => {
            router.push(`/results/history?${params.toString()}`);
        });
    };

    return (
        <div className="flex gap-2">
            <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="検索 (案件番号、製品名...)"
                    className="pl-8"
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    disabled={isPending}
                />
            </div>
            <Input
                type="date"
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                disabled={isPending}
                className="w-48"
            />
        </div>
    );
}

