-- Cron job 로그 테이블 생성
create table cron_logs (
  id uuid primary key default uuid_generate_v4(),
  job_name text not null,
  log_type text not null check (log_type in ('INFO', 'ERROR', 'SUCCESS', 'WARNING')),
  message text not null,
  details text,
  created_at timestamptz default now()
);

-- 인덱스 생성 (성능 최적화)
create index cron_logs_job_name_idx on cron_logs (job_name);
create index cron_logs_log_type_idx on cron_logs (log_type);
create index cron_logs_created_at_idx on cron_logs (created_at desc);

-- 복합 인덱스 (자주 사용되는 조합)
create index cron_logs_job_type_date_idx on cron_logs (job_name, log_type, created_at desc);

-- RLS 정책 (보안)
alter table cron_logs enable row level security;

-- 서비스 롤에서만 읽기/쓰기 가능
create policy "Service role can manage cron logs" on cron_logs
  using (auth.role() = 'service_role');

-- 데이터 정리 함수 (30일 이상 오래된 로그 삭제)
create or replace function cleanup_old_cron_logs()
returns void
language plpgsql
as $$
begin
  delete from cron_logs 
  where created_at < now() - interval '30 days';
end;
$$;

-- 주석 추가
comment on table cron_logs is 'Cron job 실행 로그를 저장하는 테이블';
comment on column cron_logs.job_name is 'Cron job 이름 (예: medical-data-sync)';
comment on column cron_logs.log_type is '로그 유형 (INFO, ERROR, SUCCESS, WARNING)';
comment on column cron_logs.message is '로그 메시지';
comment on column cron_logs.details is '상세 정보 (JSON 형태)';
comment on column cron_logs.created_at is '로그 생성 시간'; 