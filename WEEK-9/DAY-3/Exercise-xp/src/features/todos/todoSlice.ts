import { createSlice, nanoid } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface Todo {
  id: string
  text: string
  completed: boolean
}

interface TodosState {
  items: Todo[]
}

const initialState: TodosState = {
  items: [],
}

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    addTodo: {
      reducer(state, action: PayloadAction<Todo>) {
        state.items.push(action.payload)
      },
      prepare(text: string) {
        return {
          payload: {
            id: nanoid(),
            text: text.trim(),
            completed: false,
          },
        }
      },
    },
    toggleTodo(state, action: PayloadAction<string>) {
      const todo = state.items.find((item) => item.id === action.payload)
      if (todo) todo.completed = !todo.completed
    },
    removeTodo(state, action: PayloadAction<string>) {
      state.items = state.items.filter((todo) => todo.id !== action.payload)
    },
  },
})

export const { addTodo, toggleTodo, removeTodo } = todosSlice.actions
export default todosSlice.reducer
