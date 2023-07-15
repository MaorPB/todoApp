const express = require('express')
const app = express()
const port = 3000
const axios = require("axios")
const {response} = require("express");
const {v4: uuidv4} = require('uuid');

/*===========================================================================*/

console.log("Starting up API server")

/*===========================================================================*/

// Initialize an empty todoList
let todoList = [];

// Middleware to parse JSON request bodies
app.use(express.json());

/*===========================================================================*/

// endpoint 1: Get all todo items
app.get('/todos/getAllTodos', (req, res) => {
    if (todoList.length === 0) {
        res.json({
            status: "failure",
            result: {
                desc: `There are no users on this service'`
            }
        })
    } else {
        res.json({
            status: "success",
            result: todoList
        });
    }

});

/*===========================================================================*/

// endpoint 2: Get all todos for a specific user
app.post('/todos/getUserTodos', (req, res) => {
    const {userName, userEmail} = req.body;

    // Find the user by userName
    const user = todoList.find(user => user.userName === userName);
    const email = todoList.find(user => user.userEmail === userEmail);

    if (!user) {
        res.status(404).json({error: `User '${userName}' not found`});
    } else if (user && user.todos.length === 0) {
        res.json({
            result: {
                status: "failure",
                desc: `no todo items for user name: '${userName}'`
            }
        })
    } else if (!email) {
        res.json({
            result: {
                status: "failure",
                desc: `There is no user with email: '${userEmail}'`
            }
        })
    } else {
        const todos = user.todos;
        const response = {
            result: {
                userName: user.userName,
                userEmail: user.userEmail,
                todos: todos
            }

        };
        res.json(response);
    }
});

/*===========================================================================*/

// endpoint 3: Get a specific todo item by ID for a specific user
app.post('/todos/getTodoById', (req, res) => {
    const {userName, userEmail, todoId} = req.body;

    // Find the user by userName
    const user = todoList.find(user => user.userName === userName);
    const email = todoList.find(user => user.userEmail === userEmail);

    if (!user) {
        res.status(404).json({error: `User name '${userName}' not found`});
        return;
    }

    if (!email){
        res.status(404).json({error: `User email '${userEmail}' not found`});
        return;
    }

    // Find the todo item by ID within the user's todos
    const todoItem = user.todos.find(todo => todo.id === todoId);

    if (!todoItem) {
        res.status(404).json({error: `Todo item with id '${todoId}' not found`});
    } else {
        res.json({
            result: todoItem
        });
    }
});

/*===========================================================================*/

// endpoint 4: Create a new todo item
app.post('/todos/setTodo', (req, res) => {
    const {userName, userEmail, todoName, deadline} = req.body;

    // Check if required fields are provided
    if (!userName || !userEmail || !todoName || !deadline) {
        res.status(400).json({error: 'Request must contain all of: [userName, userEmail, todoName, deadline]'});
        return;
    }


    let user = todoList.find(user => user.userName === userName);
    let email = todoList.find(user => user.userEmail === userEmail)

    if (!user && !email) {
        user = {
            userName,
            userEmail,
            todos: [],
            todoCount: 0 // Initialize the todoCount to 0 for a new user
        };
        todoList.push(user);
    } else if (!user && email) {
        res.status(400).json({error: `This email already taken`});
        return;
    } else if (user && !email) {
            // Username exists, but email does not
            // Create a new user with the provided email
            user = {
                userName,
                userEmail,
                todos: [],
                todoCount: 0
            };
            todoList.push(user);
        } 

    // Create a new todo item
    const newTodo = {
        id: uuidv4(), // Generate a unique ID using the uuid library
        todoName,
        deadline,
        status: "TO-DO"
    };

    user.todos.push(newTodo);
    user.todoCount++; // Increment the todoCount for the user
    res.status(201).json({
        result: newTodo
    });
});

/*===========================================================================*/

// endpoint 5: Update an existing todo item
app.put('/todos/updateTodo', (req, res) => {
    const {todoId, userName, userEmail, updatedTodo} = req.body;

    // Find the user by userName
    const user = todoList.find(user => user.userName === userName);
    const email = todoList.find(user => user.userEmail === userEmail)

    if (!user) {
        res.status(404).json({error: 'User not found'});
        return;
    }

    if (!email) {
        res.status(404).json({error: `User email not found`});
        return;
    }

    // Find the todo item by ID within the user's todos
    const todoItem = user.todos.find(todo => todo.id === todoId);

    if (!todoItem) {
        res.status(404).json({error: 'Todo item not found'});
    } else {
        // Update the todo item
        if (updatedTodo.todoName) {
            todoItem.todoName = updatedTodo.todoName;
        }
        if (updatedTodo.deadline) {
            todoItem.deadline = updatedTodo.deadline;
        }
        if (updatedTodo.status) {
            const validStatuses = ['TO-DO', 'DOING', 'DONE'];
            if (validStatuses.includes(updatedTodo.status)) {
                todoItem.status = updatedTodo.status;
            } else {
                res.status(400).json({ error: 'Invalid status value, must be one of [TO-DO, DOING, DONE]' });
                return;
            }
        }

        res.json({
            status: "success",
            result: {
                updatedItem: todoItem
            }
        });
    }
});

/*===========================================================================*/

// endpoint 6: Delete a specific todo item
app.delete('/todos/deleteTodoItem', (req, res) => {
    const {todoId, userName, userEmail} = req.body;

    // Find the user by userName
    const user = todoList.find(user => user.userName === userName);
    const email = todoList.find(user => user.userEmail === userEmail);

    if (!user) {
        res.status(404).json({error: 'User not found'});
        return;
    }

    if (!email) {
        res.status(404).json({error: 'Email not found'});
    }

    // Find the todo item by ID within the user's todos
    const todoIndex = user.todos.findIndex(todo => todo.id === todoId);

    if (todoIndex === -1) {
        res.status(404).json({error: `Todo item with id: '${todoId}' not found`});
    } else {
        // Remove the todo item from the user's todos
        const deletedTodo = user.todos.splice(todoIndex, 1);
        user.todoCount--; // Reduce the todoCount by 1

        res.json({
            status: "success",
            message: "The following todo item have been deleted",
            userName: userName,
            email: userEmail,
            deletedTodo: deletedTodo
        });
    }
});

/*===========================================================================*/

// endpoint 7: Delete all todos for a specific user
app.delete('/todos/deleteUserTodos', (req, res) => {
    const {userName, userEmail} = req.body;

    // Find the user by userName
    const userIndex = todoList.findIndex(user => user.userName === userName);
    const email = todoList.find(user => user.userEmail === userEmail);

    if (userIndex === -1) {
        res.status(404).json({error: `User '${userName}' not found`});
    } else if (todoList[userIndex].todos.length === 0) {
        res.status(404).json({error: `No todo items for '${userName}'`});
    } else if (!email) {
        res.status(404).json({error: 'Email not found'});
    } else {
        // Remove all todos for the user
        const deletedTodos = todoList[userIndex].todos;
        todoList[userIndex].todos = [];
        todoList[userIndex].todoCount = 0;

        res.json({
            status: "success",
            message: 'The following todo items have been deleted',
            deletedTodos: deletedTodos
        });
    }
});

/*===========================================================================*/

// endpoint 8: - Delete all todos for all users
app.delete('/todos/deleteAllTodos', (req, res) => {

    let deletedTodos = []

    // Iterate over all users and remove their todos
    todoList.forEach(user => {
        deletedTodos.push(...user.todos)
        user.todos = [];
        user.todoCount = 0;
    });

    if (deletedTodos.length === 0) {
        res.status(404).json({
            status: "failure",
            message: 'There are no todo items exist'
        });
    } else {
        res.json({
            status: "success",
            message: 'All todo items deleted'
        });
    }
});

/*===========================================================================*/

// Start the server
app.listen(port, () => {
    console.log(`API server is running on http://localhost:${port}`);
});
