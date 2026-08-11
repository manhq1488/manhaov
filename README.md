# MY AOV v2

Bản này nâng cấp từ bản demo:
- Website public đọc sản phẩm từ backend.
- Admin có đăng nhập session.
- CRUD sản phẩm.
- Bật/tắt sản phẩm bằng API.
- SQLite database (`my_aov.db`) tự tạo.
- Tạo key 24 giờ.
- Xem key trong Admin.
- Responsive mobile.

## Chạy
1. Cài Node.js.
2. Mở terminal tại thư mục project.
3. `npm install`
4. Đặt biến môi trường:
   - `ADMIN_USER`
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`
5. `npm start`
6. Website: `http://localhost:3000`
7. Admin: `http://localhost:3000/admin.html`

Nếu không đặt biến môi trường, server dùng giá trị mặc định trong code; hãy đổi chúng trước khi đưa lên Internet.

## Bước production tiếp theo
Dùng HTTPS, secret manager, cookie secure, reverse proxy, rate limiting, CSRF protection, backup database và phân quyền chi tiết.

## v3
- Tạo key tùy thời hạn: 1h, 24h, 3 ngày, 7 ngày, 30 ngày.
- Hiển thị trạng thái key.
- Thu hồi key ngay trong Admin.
