"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  Play,
  AlertCircle,
  CheckCircle,
  Info,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface CronLog {
  id: string;
  job_name: string;
  log_type: "INFO" | "ERROR" | "SUCCESS" | "WARNING";
  message: string;
  details: string | null;
  created_at: string;
}

interface SyncStats {
  total_runs: number;
  success_runs: number;
  error_runs: number;
  last_run: string | null;
  last_success: string | null;
}

export default function CronLogsPage() {
  const [logs, setLogs] = useState<CronLog[]>([]);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const supabase = createClient();

  // 로그 데이터 로드
  const loadLogs = async () => {
    try {
      setLoading(true);

      let query = supabase
        .table("cron_logs")
        .select("*")
        .eq("job_name", "medical-data-sync")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter !== "all") {
        query = query.eq("log_type", filter.toUpperCase());
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("로그 로드 실패:", error);
      toast.error("로그를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 통계 데이터 로드
  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .table("cron_logs")
        .select("log_type, created_at")
        .eq("job_name", "medical-data-sync");

      if (error) throw error;

      const logs = data || [];
      const successLogs = logs.filter((log) => log.log_type === "SUCCESS");
      const errorLogs = logs.filter((log) => log.log_type === "ERROR");

      setStats({
        total_runs: logs.length,
        success_runs: successLogs.length,
        error_runs: errorLogs.length,
        last_run: logs.length > 0 ? logs[0].created_at : null,
        last_success: successLogs.length > 0 ? successLogs[0].created_at : null,
      });
    } catch (error) {
      console.error("통계 로드 실패:", error);
    }
  };

  // 수동 실행
  const runManualSync = async () => {
    try {
      setRunning(true);
      toast.info("의료기관 데이터 동기화를 시작합니다...");

      const response = await fetch("/api/cron/medical-data", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || "dev-secret"}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`동기화 완료! ${result.processed}개 처리됨`);
      } else {
        toast.error(`동기화 실패: ${result.error}`);
      }

      // 로그 새로고침
      await loadLogs();
      await loadStats();
    } catch (error) {
      console.error("수동 실행 실패:", error);
      toast.error("수동 실행에 실패했습니다.");
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  // 로그 타입별 아이콘
  const getLogIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "ERROR":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "WARNING":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  // 로그 타입별 배지 색상
  const getLogBadgeVariant = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return "default";
      case "ERROR":
        return "destructive";
      case "WARNING":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">의료기관 데이터 동기화 로그</h1>
          <p className="text-muted-foreground">
            매일 오전 8시에 실행되는 자동 동기화 상태를 확인하세요
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadLogs} variant="outline" disabled={loading}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            새로고침
          </Button>
          <Button onClick={runManualSync} disabled={running}>
            <Play className={`w-4 h-4 mr-2 ${running ? "animate-spin" : ""}`} />
            수동 실행
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">총 실행 횟수</p>
                  <p className="text-2xl font-bold">{stats.total_runs}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">성공</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.success_runs}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">실패</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.error_runs}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-sm text-muted-foreground">마지막 성공</p>
                <p className="text-sm font-medium">
                  {stats.last_success
                    ? new Date(stats.last_success).toLocaleString("ko-KR")
                    : "없음"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 로그 필터 및 목록 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>실행 로그</CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="로그 타입 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="success">성공</SelectItem>
                <SelectItem value="error">에러</SelectItem>
                <SelectItem value="warning">경고</SelectItem>
                <SelectItem value="info">정보</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              로그가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-3 p-4 border rounded-lg"
                >
                  {getLogIcon(log.log_type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant={getLogBadgeVariant(log.log_type)}>
                        {log.log_type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.created_at).toLocaleString("ko-KR")}
                      </span>
                    </div>
                    <p className="text-sm">{log.message}</p>
                    {log.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer">
                          상세 정보 보기
                        </summary>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(JSON.parse(log.details), null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
