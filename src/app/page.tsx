import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ClipboardList,
  Layers,
  CalendarDays,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">進行中の案件</CardTitle>
            <ClipboardList className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">
              先月から +2 件
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本日の稼働工程</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground mt-1">
              全 5 ライン稼働中
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">納期間近 (1週間以内)</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">
              優先対応が必要です
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">完了済み (今月)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground mt-1">
              目標まであと 6 件
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>直近の製造予定</CardTitle>
            <CardDescription>
              今後1週間の主要工程スケジュール
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/50">
              <div className="text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">ガントチャート プレビュー表示エリア</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>アラート通知</CardTitle>
            <CardDescription>
              在庫不足・工程遅延の警告
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-3 rounded-lg border bg-orange-50 border-orange-100">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-900">在庫不足: SUS304 鋼板</p>
                  <p className="text-xs text-orange-700">有効在庫が安全在庫を下回っています (案件: SO-2026-001)</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-3 rounded-lg border bg-red-50 border-red-100">
                <Activity className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">工程遅延: 消防ダンパー組立</p>
                  <p className="text-xs text-red-700">予定開始日から 2 日経過しています</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-3 rounded-lg border bg-blue-50 border-blue-100">
                <Layers className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">BOM未作成: 特殊防火ダンパー</p>
                  <p className="text-xs text-blue-700">設計部門による部品表の登録が必要です</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
