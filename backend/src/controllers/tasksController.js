export const getAllTasks = (req, res) => {
    res.status(200).send("You have 10 works to do")
}

export const addTask = (req, res) => {
    res.status(201).json({message: "New Task has been created"});
}

export const deleteTask = (req, res) => {
    res.status(200).json({message: "New Task has been deleted"});
}
export const updateTask = (req, res) => {
    res.status(200).json({message: "New Task has been updated"});
}