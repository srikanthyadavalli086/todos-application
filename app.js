const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodosQuery);
  response.send(data);
});

//Returns a specific todo based on the todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { id } = request.params;
  const getTodoQuery = `
    SELECT *
    FROM todo
    WHERE id = ${id};`;
  const todoItem = await database.get(getTodoQuery);
  response.send(todoItem);
});

//Create a todo in the todo table,
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `
  INSERT INTO todo(id, todo, priority, status)
  VALUES (${id}, '${todo}', '${priority}', '${status}');`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//Updates the details of a specific todo based on the todo ID
app.put("/todos/", async (request, response) => {
  const { id } = request.params;
  let data = null;
  let updateTodoQuery = "";
  const { todo, priority, status } = request.body;

  switch (true) {
    case hasPriorityProperty(request.body):
      updateTodoQuery = `
  UPDATE todo
  SET priority = '${priority}'
  WHERE id = ${id}`;
      break;

    case hasStatusProperty(request.body):
      updateTodoQuery = `
  UPDATE todo
  SET status = '${status}'
  WHERE id = ${id}`;
      break;

    default:
      updateTodoQuery = `
  UPDATE todo
  SET todo = '${todo}'
  WHERE id = ${id}`;
  }

  data = await database.all(getTodosQuery);
  response.send(data);
});

//Deletes a todo from the todo table based on the todo ID
app.delete("/todos/:todoId/", async (request, response) => {
  const { id } = request.params;
  const deleteTodoQuery = `
     DELETE 
    FROM 
      todo 
    WHERE 
      id = ${id};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
