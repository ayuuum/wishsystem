"use client";

import React from 'react';
import { GanttChart } from "@/components/gantt-chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    ArrowLeft,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Plus,
    Save
} from 'lucide-react';
import Link from 'next/link';

export default function OrderSchedulePage({ params }: { params: { id: string } }) {
    const tasks = [
        {
            id: 'T1',
            name: '板金加工',
            start: '2026-04-01',
            end: '2026-04-05',
            progress: 100,
        },
        {
            id: 'T2',
            name: '溶接工作',
            start: '2026-04-06',
            end: '2026-04-10',
            progress: 40,
            dependencies: 'T1'
        },
        {
            id: 'T3',
            name: '部品組立',
            start: '2026-04-11',
            end: '2026-04-15',
            progress: 0,
            dependencies: 'T2'
        },
        {
            id: 'T4',
            name: '塗装・仕上',
            start: '2026-04-16',
            end: '2026-04-18',
            progress: 0,
            dependencies: 'T3'
        },
        {
            id: 'T5',
            name: '検査・出荷',
            start: '2026-04-19',
            end: '2026-04-21',
            progress: 0,
            dependencies: 'T4'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href={`/orders/${params.id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">日程管理 (ガントチャート)</h2>
                    <p className="text-muted-foreground">案件: SO-2026-0001 / 特殊防火ダンパー</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <div className="flex items-center border rounded-md p-1 bg-muted/50 mr-2">
                        <Button variant="ghost" size="sm" className="h-7">日</Button>
                        <Button variant="ghost" size="sm" className="h-7 bg-white shadow-sm">週</Button>
                        <Button variant="ghost" size="sm" className="h-7">月</Button>
                    </div>
                    <Button variant="outline" size="sm">
                        <Calendar className="mr-2 h-4 w-4" /> 2026年4月
                    </Button>
                    <Button size="sm">
                        <Save className="mr-2 h-4 w-4" /> 保存
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>製造工程スケジュール</CardTitle>
                            <CardDescription>バーをドラッグして日程を変更、端をドラッグして期間を調整できます</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="gantt-container p-4">
                        <GanttChart tasks={tasks} />
                    </div>

                    <div className="mt-8 flex gap-6 overflow-x-auto pb-4">
                        {tasks.map((task) => (
                            <div key={task.id} className="min-w-[200px] border rounded-lg p-3 bg-background shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-primary">{task.id}</span>
                                    <Badge variant={task.progress === 100 ? "default" : task.progress > 0 ? "outline" : "secondary"} className="text-[10px]">
                                        {task.progress === 100 ? "完了" : task.progress > 0 ? "実行中" : "未着手"}
                                    </Badge>
                                </div>
                                <h4 className="font-bold text-sm mb-1">{task.name}</h4>
                                <div className="flex justify-between text-[11px] text-muted-foreground">
                                    <span>{task.start}</span>
                                    <span>〜</span>
                                    <span>{task.end}</span>
                                </div>
                                <div className="mt-3 overflow-hidden h-1.5 rounded-full bg-muted">
                                    <div style={{ width: `${task.progress}%` }} className="h-full bg-primary"></div>
                                </div>
                            </div>
                        ))}
                        <button className="min-w-[200px] border-2 border-dashed rounded-lg p-3 flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                            <Plus className="h-6 w-6 mb-2" />
                            <span className="text-sm font-medium">工程を追加</span>
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
