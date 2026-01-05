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
import { getDashboardStats } from "@/app/actions/dashboard";
import { formatDate } from "@/lib/utils/date";
import Link from "next/link";

export default async function Home() {
  const statsResult = await getDashboardStats();
  
  // エラーハンドリング: データ取得に失敗した場合はデフォルト値を表示
  const stats = statsResult.success && statsResult.data ? statsResult.data : {
    inProgressCount: 0,
    nearDueDateCount: 0,
    thisMonthCompletedCount: 0,
    todayWorkOrdersCount: 0,
    inventoryStats: {
      totalItems: 0,
      lowStockCount: 0,
      totalAllocated: 0,
    },
    alerts: [],
    upcomingWorkOrders: [],
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "inventory":
        return AlertCircle;
      case "delay":
        return Activity;
      case "bom":
        return Layers;
      default:
        return AlertCircle;
    }
  };

  const getAlertStyles = (severity: string) => {
    switch (severity) {
      case "error":
        return "bg-red-50 border-red-100 text-red-900";
      case "warning":
        return "bg-orange-50 border-orange-100 text-orange-900";
      case "info":
        return "bg-blue-50 border-blue-100 text-blue-900";
      default:
        return "bg-muted border-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">進行中の案件</CardTitle>
            <ClipboardList className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              製造中の案件数
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本日の稼働工程</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayWorkOrdersCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              実行中の工程数
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">納期間近 (1週間以内)</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.nearDueDateCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.nearDueDateCount > 0 ? "優先対応が必要です" : "問題ありません"}
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">完了済み (今月)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonthCompletedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              今月の完了案件数
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
            {stats.upcomingWorkOrders.length > 0 ? (
              <div className="space-y-2">
                {stats.upcomingWorkOrders.map((wo) => (
                  <div key={wo.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{wo.processName}</p>
                      <p className="text-xs text-muted-foreground">
                        {wo.orderNo} / {wo.productName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {wo.plannedStartDate ? formatDate(wo.plannedStartDate) : '未設定'} 〜 {wo.plannedEndDate ? formatDate(wo.plannedEndDate) : '未設定'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/50">
                <div className="text-center">
                  <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">今後1週間の予定はありません</p>
                </div>
              </div>
            )}
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
            {stats.alerts.length > 0 ? (
              <div className="space-y-4">
                {stats.alerts.map((alert, index: number) => {
                  const Icon = getAlertIcon(alert.type);
                  const styles = getAlertStyles(alert.severity);
                  return (
                    <div key={index} className={`flex items-start gap-4 p-3 rounded-lg border ${styles}`}>
                      <Icon className="h-5 w-5 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs opacity-80">
                          {alert.message}
                          {alert.orderNo && (
                            <Link href={`/orders/${alert.orderId}`} className="underline ml-1">
                              ({alert.orderNo})
                            </Link>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">アラートはありません</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
