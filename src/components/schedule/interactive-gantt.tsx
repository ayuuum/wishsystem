"use client";

import React, { useTransition } from 'react';
import { GanttChart } from "@/components/gantt-chart";
import { updateWorkOrderSchedule } from "@/app/actions/schedule";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface InteractiveGanttProps {
    tasks: any[];
}

export function InteractiveGantt({ tasks }: InteractiveGanttProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleDateChange = async (task: any, start: Date, end: Date) => {
        startTransition(async () => {
            try {
                const result = await updateWorkOrderSchedule({
                    id: task.id,
                    startDate: start,
                    endDate: end,
                });

                if (result.success) {
                    toast.success(`${task.name} のスケジュールを更新しました`);
                    router.refresh(); // サーバーコンポーネントのデータを再取得
                } else {
                    toast.error(result.error?.message || "スケジュールの更新に失敗しました");
                }
            } catch (error) {
                console.error("Failed to update schedule:", error);
                toast.error("システムエラーが発生しました");
            }
        });
    };

    return (
        <div className={`relative ${isPending ? 'opacity-70 pointer-events-none' : ''}`}>
            <GanttChart tasks={tasks} onDateChange={handleDateChange} />
            {isPending && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/20">
                    <div className="px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-lg text-sm animate-pulse">
                        保存中...
                    </div>
                </div>
            )}
        </div>
    );
}
