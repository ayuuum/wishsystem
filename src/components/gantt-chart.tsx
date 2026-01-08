"use client";

import React, { useEffect, useRef } from 'react';
import Gantt from 'frappe-gantt';
import './gantt.css';

interface Task {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    dependencies?: string;
    custom_class?: string;
}

export function GanttChart({
    tasks,
    onDateChange
}: {
    tasks: Task[],
    onDateChange?: (task: any, start: Date, end: Date) => void
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const ganttInstance = useRef<any>(null);

    useEffect(() => {
        if (containerRef.current && tasks.length > 0) {
            // クリーンアップ: 既存の内容をクリア
            containerRef.current.innerHTML = '';

            try {
                // frappe-gantt はコンテナ要素（通常はdiv）を要求し、その中にsvgを生成します
                ganttInstance.current = new Gantt(containerRef.current, tasks, {
                    on_click: (task: any) => console.log(task),
                    on_date_change: (task: any, start: any, end: any) => {
                        if (onDateChange) {
                            onDateChange(task, new Date(start), new Date(end));
                        }
                    },
                    on_progress_change: (task: any, progress: any) => {
                        console.log(task, progress);
                    },
                    on_view_change: (mode: any) => {
                        console.log(mode);
                    },
                    view_mode: 'Day',
                    language: 'jp',
                });
            } catch (error) {
                console.error("Frappe Gantt initialization error:", error);
            }
        }

        return () => {
            // アンマウント時のクリーンアップ
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
            ganttInstance.current = null;
        };
    }, [tasks, onDateChange]);

    return (
        <div
            ref={containerRef}
            className="gantt-container"
            style={{ width: '100%', overflow: 'auto' }}
        />
    );
}

