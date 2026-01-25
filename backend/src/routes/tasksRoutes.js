import express from "express";
import {addTask, deleteTask, getAllTasks, updateTask} from "../controllers/tasksController.js";

const router = express.Router();

router.get('/', getAllTasks)
router.post('/', addTask)
router.put('/:id', updateTask )
router.delete('/:id' , deleteTask)


export default router;