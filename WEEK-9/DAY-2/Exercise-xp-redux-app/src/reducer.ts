import { ADD_TODO, REMOVE_TODO, TOGGLE_TODO, type TodoAction } from './actions'
import type { Todo } from './types'

const initialState: Todo[] = []

export function todoReducer(state = initialState, action: TodoAction): Todo[] {
  switch (action.type) {
    case ADD_TODO:
      return [...state, action.payload]
    case TOGGLE_TODO:
      return state.map((todo) =>
        todo.id === action.payload ? { ...todo, completed: !todo.completed } : todo,
      )
    case REMOVE_TODO:
      return state.filter((todo) => todo.id !== action.payload)
    default:
      return state
  }
}
