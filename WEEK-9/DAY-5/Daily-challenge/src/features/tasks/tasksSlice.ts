import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'
import { deleteCategory } from '../categories/categoriesSlice'

export interface Task {
  id: string
  title: string
  categoryId: string
  progress: number
  completed: boolean
}

interface TasksState {
  items: Task[]
}

const initialState: TasksState = {
  items: [
    { id: 'task-1', title: 'Plan the week ahead', categoryId: 'work', progress: 100, completed: true },
    { id: 'task-2', title: 'Finish project proposal', categoryId: 'work', progress: 65, completed: false },
    { id: 'task-3', title: 'Read for twenty minutes', categoryId: 'personal', progress: 25, completed: false },
    { id: 'task-4', title: 'Take an afternoon walk', categoryId: 'wellness', progress: 0, completed: false },
  ],
}

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask: {
      reducer(state, action: PayloadAction<Task>) {
        state.items.unshift(action.payload)
      },
      prepare(payload: { title: string; categoryId: string }) {
        return {
          payload: {
            id: nanoid(),
            title: payload.title.trim(),
            categoryId: payload.categoryId,
            progress: 0,
            completed: false,
          },
        }
      },
    },
    editTask(
      state,
      action: PayloadAction<{ id: string; title: string }>,
    ) {
      const task = state.items.find((item) => item.id === action.payload.id)
      if (task) task.title = action.payload.title.trim()
    },
    deleteTask(state, action: PayloadAction<string>) {
      state.items = state.items.filter((task) => task.id !== action.payload)
    },
    updateTaskProgress(
      state,
      action: PayloadAction<{ id: string; progress: number }>,
    ) {
      const task = state.items.find((item) => item.id === action.payload.id)
      if (!task) return

      task.progress = Math.max(0, Math.min(100, action.payload.progress))
      task.completed = task.progress === 100
    },
    toggleTaskCompletion(state, action: PayloadAction<string>) {
      const task = state.items.find((item) => item.id === action.payload)
      if (!task) return

      task.completed = !task.completed
      task.progress = task.completed ? 100 : 0
    },
  },
  extraReducers(builder) {
    builder.addCase(deleteCategory, (state, action) => {
      state.items = state.items.filter(
        (task) => task.categoryId !== action.payload,
      )
    })
  },
})

export const {
  addTask,
  editTask,
  deleteTask,
  updateTaskProgress,
  toggleTaskCompletion,
} = tasksSlice.actions
export default tasksSlice.reducer
