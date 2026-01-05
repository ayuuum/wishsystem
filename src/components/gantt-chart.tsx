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

export function GanttChart({ tasks }: { tasks: Task[] }) {
    const ganttRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (ganttRef.current && tasks.length > 0) {
            new Gantt(ganttRef.current, tasks, {
                on_click: (task: any) => console.log(task),
                on_date_change: (task: any, start: any, end: any) => {
                    console.log(task, start, end);
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
        }
    }, [tasks]);

    return <svg ref={ganttRef}></svg>;
}
