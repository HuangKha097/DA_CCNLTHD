import express from "express";
import multer from "multer";

import {
    uploadProductImages,
    createProduct,
    updateProduct,
    publishProduct,
    unpublishProduct,
    getDraftProducts,
    getPublishedProducts,
    deleteProduct,
    getAllProducts,
    getProductDetail,
    searchProducts,
    filterProducts
} from "../controllers/ProductController.js";
import { authenToken } from "../middlewares/AuthenToken.js";

const router = express.Router();
const allowedImageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 10
    },
    fileFilter: (req, file, cb) => {
        if (!allowedImageMimeTypes.includes(file.mimetype)) {
            return cb(new Error('Chỉ hỗ trợ ảnh JPG, PNG, WEBP'));
        }

        cb(null, true);
    }
});

const handleProductImageUpload = (req, res, next) => {
    upload.array('images', 10)(req, res, (error) => {
        if (!error) return next();

        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'Mỗi ảnh tối đa 5MB', status: 'error' });
            }
            if (error.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({ message: 'Tối đa 10 ảnh mỗi lần upload', status: 'error' });
            }

            return res.status(400).json({ message: error.message, status: 'error' });
        }

        return res.status(400).json({ message: error.message || 'Upload ảnh không hợp lệ', status: 'error' });
    });
};

// --- PUBLIC ROUTES (User/Guest) ---
router.get('/all', getAllProducts);
router.get('/search', searchProducts);
router.get('/filter', filterProducts);
router.get('/:productId', getProductDetail);

// --- PRIVATE ROUTES (Shop/Vendor) ---
router.post('/upload', authenToken, handleProductImageUpload, uploadProductImages);
router.post('/create', authenToken, createProduct);
router.put('/:productId', authenToken, updateProduct);
router.delete('/:productId', authenToken, deleteProduct);

router.patch('/publish/:productId', authenToken, publishProduct);
router.patch('/unpublish/:productId', authenToken, unpublishProduct);

router.get('/drafts/:shopId', authenToken, getDraftProducts);
router.get('/published/:shopId', authenToken, getPublishedProducts);

export default router;
