import type { Todo } from './types'

export const ADD_TODO = 'todos/add'
export const TOGGLE_TODO = 'todos/toggle'
export const REMOVE_TODO = 'todos/remove'

export interface AddTodoAction {
  type: typeof ADD_TODO
  payload: Todo
}

export interface ToggleTodoAction {
  type: typeof TOGGLE_TODO
  payload: string
}

export interface RemoveTodoAction {
  type: typeof REMOVE_TODO
  payload: string
}

export type TodoAction = AddTodoAction | ToggleTodoAction | RemoveTodoAction

export const addTodo = (text: string): AddTodoAction => ({
  type: ADD_TODO,
  payload: {
    id: crypto.randomUUID(),
    text,
    completed: false,
  },
})

export const toggleTodo = (id: string): ToggleTodoAction => ({
  type: TOGGLE_TODO,
  payload: id,
})

export const removeTodo = (id: string): RemoveTodoAction => ({
  type: REMOVE_TODO,
  payload: id,
})
