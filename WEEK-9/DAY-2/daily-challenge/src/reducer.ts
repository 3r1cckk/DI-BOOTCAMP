import {
  ADD_TASK,
  DELETE_TASK,
  EDIT_TASK,
  TOGGLE_TASK,
  type PlannerAction,
} from './actions'
import type { PlannerTask, TasksByDay } from './types'

export function isPlannerTask(value: unknown): value is PlannerTask {
  if (typeof value !== 'object' || value === null) return false
  const task = value as Record<string, unknown>

  return (
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.time === 'string' &&
    typeof task.notes === 'string' &&
    typeof task.completed === 'boolean'
  )
}

export function isTasksByDay(value: unknown): value is TasksByDay {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false

  return Object.values(value).every(
    (tasks) => Array.isArray(tasks) && tasks.every(isPlannerTask),
  )
}

export function plannerReducer(
  state: TasksByDay = {},
  action: PlannerAction,
): TasksByDay {
  switch (action.type) {
    case ADD_TASK:
      return {
        ...state,
        [action.payload.date]: [...(state[action.payload.date] ?? []), action.payload.task],
      }
    case EDIT_TASK:
      return {
        ...state,
        [action.payload.date]: (state[action.payload.date] ?? []).map((task) =>
          task.id === action.payload.taskId ? { ...task, ...action.payload.details } : task,
        ),
      }
    case DELETE_TASK: {
      const remainingTasks = (state[action.payload.date] ?? []).filter(
        (task) => task.id !== action.payload.taskId,
      )
      const nextState = { ...state }

      if (remainingTasks.length === 0) {
        delete nextState[action.payload.date]
      } else {
        nextState[action.payload.date] = remainingTasks
      }

      return nextState
    }
    case TOGGLE_TASK:
      return {
        ...state,
        [action.payload.date]: (state[action.payload.date] ?? []).map((task) =>
          task.id === action.payload.taskId ? { ...task, completed: !task.completed } : task,
        ),
      }
    default:
      return state
  }
}
