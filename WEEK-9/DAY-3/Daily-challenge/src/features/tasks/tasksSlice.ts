import { createSlice, nanoid } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface PlannerTask {
  id: string
  text: string
}

interface TasksState {
  byDate: Record<string, PlannerTask[]>
}

interface AddTaskPayload {
  date: string
  text: string
}

interface EditTaskPayload extends AddTaskPayload {
  id: string
}

interface DeleteTaskPayload {
  date: string
  id: string
}

const initialState: TasksState = {
  byDate: {},
}

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask: {
      reducer(state, action: PayloadAction<AddTaskPayload & { id: string }>) {
        const { date, text, id } = action.payload
        state.byDate[date] ??= []
        state.byDate[date].push({ id, text })
      },
      prepare({ date, text }: AddTaskPayload) {
        return {
          payload: {
            date,
            text: text.trim(),
            id: nanoid(),
          },
        }
      },
    },
    editTask(state, action: PayloadAction<EditTaskPayload>) {
      const { date, id, text } = action.payload
      const task = state.byDate[date]?.find((item) => item.id === id)
      if (task) task.text = text.trim()
    },
    deleteTask(state, action: PayloadAction<DeleteTaskPayload>) {
      const { date, id } = action.payload
      const tasks = state.byDate[date]
      if (tasks) {
        state.byDate[date] = tasks.filter((task) => task.id !== id)
        if (state.byDate[date].length === 0) delete state.byDate[date]
      }
    },
  },
})

export const { addTask, editTask, deleteTask } = tasksSlice.actions
export default tasksSlice.reducer
