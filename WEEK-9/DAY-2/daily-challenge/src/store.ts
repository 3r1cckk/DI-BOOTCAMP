import { legacy_createStore as createStore } from 'redux'
import { isTasksByDay, plannerReducer } from './reducer'

const STORAGE_KEY = 'daybook.tasks.v1'

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY)
    if (!savedTasks) return undefined

    const parsed: unknown = JSON.parse(savedTasks)
    if (isTasksByDay(parsed)) return parsed

    console.warn('Saved planner tasks have an invalid format and were ignored.')
    return undefined
  } catch (error) {
    console.error('Could not load saved planner tasks.', error)
    return undefined
  }
}

export const store = createStore(plannerReducer, loadTasks())

store.subscribe(() => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store.getState()))
  } catch (error) {
    console.error('Could not save planner tasks to local storage.', error)
  }
})
