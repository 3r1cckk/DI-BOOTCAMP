import type { PlannerTask, TaskDetails } from './types'

export const ADD_TASK = 'planner/addTask'
export const EDIT_TASK = 'planner/editTask'
export const DELETE_TASK = 'planner/deleteTask'
export const TOGGLE_TASK = 'planner/toggleTask'

export interface AddTaskAction {
  type: typeof ADD_TASK
  payload: { date: string; task: PlannerTask }
}

export interface EditTaskAction {
  type: typeof EDIT_TASK
  payload: { date: string; taskId: string; details: TaskDetails }
}

export interface DeleteTaskAction {
  type: typeof DELETE_TASK
  payload: { date: string; taskId: string }
}

export interface ToggleTaskAction {
  type: typeof TOGGLE_TASK
  payload: { date: string; taskId: string }
}

export type PlannerAction =
  | AddTaskAction
  | EditTaskAction
  | DeleteTaskAction
  | ToggleTaskAction

export const addTask = (date: string, details: TaskDetails): AddTaskAction => ({
  type: ADD_TASK,
  payload: {
    date,
    task: {
      id: crypto.randomUUID(),
      ...details,
      completed: false,
    },
  },
})

export const editTask = (
  date: string,
  taskId: string,
  details: TaskDetails,
): EditTaskAction => ({
  type: EDIT_TASK,
  payload: { date, taskId, details },
})

export const deleteTask = (date: string, taskId: string): DeleteTaskAction => ({
  type: DELETE_TASK,
  payload: { date, taskId },
})

export const toggleTask = (date: string, taskId: string): ToggleTaskAction => ({
  type: TOGGLE_TASK,
  payload: { date, taskId },
})
