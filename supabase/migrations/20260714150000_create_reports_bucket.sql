-- Create the storage bucket for patient reports
insert into storage.buckets (id, name, public)
values ('reports', 'reports', true)
on conflict (id) do nothing;

-- Create storage policies to allow anyone to read reports but only authenticated users to insert reports
create policy "Allow public read access to reports"
on storage.objects for select
to public
using (bucket_id = 'reports');

create policy "Allow authenticated upload access to reports"
on storage.objects for insert
to authenticated
with check (bucket_id = 'reports');
