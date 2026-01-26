# DA_CCNLTHD

# Nhóm 20: Xây dựng Web API bằng Express.js
# Dự án xây dựng hệ thống Backend API cho sàn thương mại điện tử Multi-vendor, sử dụng Node.js, Express và MongoDB.

# Công Nghệ Sử Dụng
- Core: Node.js, Express.js (v4.18.2)
- Database: MongoDB (Mongoose ODM)
- Auth: JWT (Access Token & Refresh Token)
- File Storage: Cloudinary
- Security: Bcrypt, CORS

#Cấu trúc thư mục:

```
DA_CCNLTHD/               
├── backend/
|   ├── src          
│       ├── package.json        
│       ├── .env                <-- Cấu hình biến môi trường
│       ├── .gitignore         
│       └── src/                <-- Source code chính
│           ├── app.js          // Khởi tạo App, Middlewares
│           ├── server.js       // File chạy chính (Entry point)
│           ├── configs/        // Cấu hình DB, Cloudinary
│           └── api/           
│               ├── controllers/ // Xử lý request
│               │   ├── access.controller.js
│               │   ├── product.controller.js
│               │   └── checkout.controller.js
│               ├── services/    // Logic nghiệp vụ
│               │   ├── access.service.js
│               │   ├── product.service.js
│               │   └── checkout.service.js
│               ├── models/      // Mongoose Schemas
│               ├── routes/      // Khai báo API
│               └── utils/       // Hàm tiện ích
└── frontend/               <-- (Dự kiến cho React FE)


