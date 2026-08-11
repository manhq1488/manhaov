# Đưa website lên chạy thử

## Cách dễ nhất: Render / Railway / VPS
Bạn cần một nơi chạy Node.js. Upload toàn bộ project, rồi chạy:

npm install
npm start

Biến môi trường bắt buộc:
NODE_ENV=production
ADMIN_USER=...
ADMIN_PASSWORD=...
SESSION_SECRET=chuoi-bi-mat-dai

Sau khi deploy, mở:
https://TEN-MIEN-CUA-BAN/
https://TEN-MIEN-CUA-BAN/admin.html

Health check:
https://TEN-MIEN-CUA-BAN/api/health

## Lưu ý database
Bản này dùng SQLite. Với môi trường demo/ít truy cập thì phù hợp. Nếu deploy trên nền tảng có filesystem tạm thời, dữ liệu có thể mất khi service restart/redeploy. Khi đó nên chuyển sang PostgreSQL.

## Domain
Sau khi web chạy được bằng domain tạm của hosting:
1. Mua domain.
2. Trỏ DNS theo hướng dẫn của hosting.
3. Bật HTTPS.
4. Đặt NODE_ENV=production.
5. Đổi ADMIN_PASSWORD và SESSION_SECRET.

## Không commit secret
Không đưa `.env`, mật khẩu hoặc database thật lên GitHub công khai.
