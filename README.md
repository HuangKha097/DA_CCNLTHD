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
src/
├── app.js               // Khởi tạo App, Middlewares
├── server.js            // Chạy server
├── configs/             // Cấu hình DB, Cloudinary
├── api/
│   └── v1/
│       ├── controllers/ // Xử lý request, gọi Service, trả về res.status().json()
│       │   ├── access.controller.js
│       │   ├── product.controller.js
│       │   └── checkout.controller.js
│       ├── services/    // Logic nghiệp vụ (Vẫn nên giữ để tách biệt logic)
│       │   ├── access.service.js
│       │   ├── product.service.js
│       │   └── checkout.service.js
│       ├── models/      // Mongoose Schemas
│       ├── routes/      // Khai báo đường dẫn API
│       └── utils/       // Hàm tiện ích nhỏ
└── package.json
