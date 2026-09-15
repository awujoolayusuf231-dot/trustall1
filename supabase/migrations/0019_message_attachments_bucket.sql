-- Storage bucket required by the chat attachment upload flow.
insert into storage.buckets (id, name, public)
values ('message-attachments', 'message-attachments', true)
on conflict (id) do update set public = true;