"use client";

import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Activity,
    Save,
    History,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';

export default function ResultsInputPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // 実際には API 叩く
        setTimeout(() => {
            setIsSubmitting(false);
            alert("実績を登録しました");
        }, 1000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-primary">製造実績入力</h2>
                    <p className="text-muted-foreground">現場での本日分の作業実績をリアルタイムで記録します</p>
                </div>
                <Button variant="outline" asChild>
                    <a href="/results/history">
                        <History className="mr-2 h-4 w-4" /> 履歴を確認
                    </a>
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>実績登録フォーム</CardTitle>
                            <CardDescription>
                                すべての項目を入力して「登録」ボタンを押してください
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="order">案件選択</Label>
                                        <Select defaultValue="order1">
                                            <SelectTrigger id="order">
                                                <SelectValue placeholder="案件を選択してください" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="order1">SO-2026-0001 (東京研究所)</SelectItem>
                                                <SelectItem value="order2">SO-2026-0002 (横浜病院)</SelectItem>
                                                <SelectItem value="order3">SO-2026-0003 (川崎クリーンルーム)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="process">工程選択</Label>
                                        <Select defaultValue="proc2">
                                            <SelectTrigger id="process">
                                                <SelectValue placeholder="工程を選択してください" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="proc1">板金加工 (完了済)</SelectItem>
                                                <SelectItem value="proc2">溶接工作 (実行中)</SelectItem>
                                                <SelectItem value="proc3">部品組立 (未着手)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="start-time">開始時刻</Label>
                                        <Input id="start-time" type="time" defaultValue="09:00" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end-time">終了時刻</Label>
                                        <Input id="end-time" type="time" defaultValue="17:00" />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="good-qty">良品数量</Label>
                                        <Input id="good-qty" type="number" defaultValue="1" min="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="defect-qty">不良数量</Label>
                                        <Input id="defect-qty" type="number" defaultValue="0" min="0" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="remarks">備考 (特記事項など)</Label>
                                    <Textarea id="remarks" placeholder="作業中に発生した問題や連絡事項があれば記入してください" />
                                </div>

                                <Button type="submit" className="w-full h-12 text-lg" disabled={isSubmitting}>
                                    <Save className="mr-2 h-5 w-5" /> {isSubmitting ? "登録中..." : "実績を登録する"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">本日の累積実績</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-primary/10 text-primary">
                                    <Activity className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">6.5h</div>
                                    <p className="text-xs text-muted-foreground">総作業時間</p>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span>溶接班A</span>
                                    <span className="font-medium">4.0h</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span>板金班B</span>
                                    <span className="font-medium">2.5h</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-emerald-50 border-emerald-100 italic">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center text-emerald-700">
                                <CheckCircle2 className="mr-2 h-4 w-4" /> 前回登録
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-emerald-800">
                                SO-2026-001 / 板金加工<br />
                                実績: 5個 / 完了日時: 11:30
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-orange-50 border-orange-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center text-orange-700">
                                <AlertTriangle className="mr-2 h-4 w-4" /> 未着手アラート
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-orange-800">
                                SO-2026-003 / 部品組立<br />
                                予定を 3 日経過しています
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
