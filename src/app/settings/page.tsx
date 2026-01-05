import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, Database, Bell, User } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">設定</h2>
                <p className="text-muted-foreground">
                    システム設定を管理します
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            <CardTitle>データベース設定</CardTitle>
                        </div>
                        <CardDescription>
                            データベース接続情報を設定します
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="db-url">データベースURL</Label>
                            <Input
                                id="db-url"
                                placeholder="postgresql://..."
                                disabled
                                value="環境変数から読み込み"
                            />
                            <p className="text-xs text-muted-foreground">
                                .env.localファイルで設定してください
                            </p>
                        </div>
                        <Button variant="outline" disabled>
                            接続テスト
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            <CardTitle>通知設定</CardTitle>
                        </div>
                        <CardDescription>
                            アラート通知の設定を管理します
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="alert-days">納期間近アラート（日数）</Label>
                            <Input
                                id="alert-days"
                                type="number"
                                defaultValue="7"
                                min="1"
                                disabled
                            />
                            <p className="text-xs text-muted-foreground">
                                納期の何日前からアラートを表示するか
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="inventory-alert">在庫不足アラート</Label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="inventory-alert"
                                    defaultChecked
                                    disabled
                                    className="rounded"
                                />
                                <Label htmlFor="inventory-alert" className="text-sm font-normal">
                                    在庫不足時にアラートを表示
                                </Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            <CardTitle>ユーザー設定</CardTitle>
                        </div>
                        <CardDescription>
                            ユーザー情報を管理します（認証実装後に有効化）
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            認証機能実装後に利用可能になります
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            <CardTitle>システム情報</CardTitle>
                        </div>
                        <CardDescription>
                            システムのバージョン情報
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">バージョン</span>
                            <span>0.1.0</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Next.js</span>
                            <span>16.1.1</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">React</span>
                            <span>19.2.3</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Prisma</span>
                            <span>5.22.0</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

