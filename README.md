# DA_CCNLTHD

# Nhóm 20: Xây dựng Web API bằng Express.js
# Dự án xây dựng hệ thống Backend API cho sàn thương mại điện tử Multi-vendor, sử dụng Node.js, Express và MongoDB.

# Công Nghệ Sử Dụng
- Core: Node.js, Express.js (v4.18.2)
- Database: MongoDB (Mongoose ODM)
- Auth: JWT (Access Token & Refresh Token)
- Security: Bcrypt, CORS

#Cấu trúc thư mục:

```
DA_CCNLTHD/               
├── backend/      
│       ├── package.json        
│       ├── .env                <-- Cấu hình biến môi trường
│       ├── .gitignore         
│       └── src/                <-- Source code chính
│           ├── index.js       // File chạy chính (Entry point)
│           ├── configs/        // Cấu hình DB, Cloudinary
|           |      ├── db.js
|           └── middlewares/ // Xử lý Authentication
│           │     ├── AuthenToken.js
│           └── controllers/ // Xử lý request
│           │     ├── shop.controller.js
│           │     ├── product.controller.js
│           │     └── checkout.controller.js
│           ├── models/      // Mongoose Schemas
│           ├── routes/      // Khai báo API
│           └── utils/       // Hàm tiện ích
└── frontend/               <-- (Dự kiến cho React FE)

```
Hướng Dẫn Cài Đặt Và Chạy Backend Dự Án Nhóm 20
0. Yêu cầu hệ thống (Bắt buộc)
Trước khi bắt đầu, máy tính cần phải cài đặt sẵn 2 công cụ sau:

Git: Dùng để clone code về máy (Tải tại: git-scm.com).

Node.js: Bắt buộc phải có để chạy server (Khuyên dùng bản LTS tải tại nodejs.org).

1. Clone dự án về máy
Mở Terminal (hoặc Git Bash/Command Prompt) tại thư mục muốn lưu code và chạy lệnh:

Bash
git clone https://github.com/HuangKha097/DA_CCNLTHD

Sau khi clone xong, di chuyển vào đúng thư mục backend của dự án:

Bash
cd DA_CCNLTHD/backend

2. Cài đặt các thư viện (Dependencies)
Dự án sử dụng Express, Mongoose, JWT,... Mở terminal ngay tại thư mục backend và chạy lệnh sau để tải toàn bộ thư viện cần thiết:

Bash
npm install
3. Cấu hình biến môi trường (.env)
Để bảo mật, cấu hình database và port không được đẩy lên Git. Cần tự tạo một file lấy tên chính xác là .env (đặt ngang hàng với file package.json).

Copy đoạn cấu hình sau và dán vào file .env vừa tạo:

Code snippet
PORT=5001
MONGODB_URI=mongodb+srv://quachhoangkha097:nhom20@cluster0.4ntb77e.mongodb.net/nhom20?retryWrites=true&w=majority&appName=Cluster0

JWT_SECRET=nhom20
REFRESH_JWT_SECRET=nhom20refresh

4. Khởi chạy Server
Để chạy dự án trong môi trường phát triển (tự động khởi động lại khi có code mới):

Bash
npm run dev
5. Kiểm tra kết quả
Nếu cấu hình đúng, trên terminal sẽ hiện thông báo:

Server is running on port 5001
Connected to MongoDB successfully!

Bây giờ có thể mở Postman và gọi thử các API vào địa chỉ: http://localhost:5001 để bắt đầu code và test chức năng được rồi.

