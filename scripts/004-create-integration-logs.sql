create table if not exists integration_logs (
  id bigserial primary key,
  service text not null,
  action text not null,
  status text not null,
  message text,
  created_at timestamptz default now()
);

create index if not exists integration_logs_service_idx on integration_logs(service);
