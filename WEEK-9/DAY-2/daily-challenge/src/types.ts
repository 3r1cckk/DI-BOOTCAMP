export interface PlannerTask {
  id: string
  title: string
  time: string
  notes: string
  completed: boolean
}

export type TasksByDay = Record<string, PlannerTask[]>

export interface TaskDetails {
  title: string
  time: string
  notes: string
}
