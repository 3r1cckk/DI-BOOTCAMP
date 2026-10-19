import { TodoList } from './todo.js';

const todoList = new TodoList();

todoList.addTask('Learn Node.js');
todoList.addTask('Practice modules');
todoList.addTask('Review file system');

todoList.markTaskComplete('Practice modules');

console.log(todoList.listTasks());
