import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'

const selectTaskItems = (state: RootState) => state.tasks.items
const selectCategories = (state: RootState) => state.categories
const selectSelectedCategoryId = (_state: RootState, categoryId: string) =>
  categoryId

export const selectTasksByCategory = createSelector(
  [selectTaskItems, selectSelectedCategoryId],
  (tasks, categoryId) =>
    categoryId === 'all'
      ? tasks
      : tasks.filter((task) => task.categoryId === categoryId),
)

export const selectCompletedTasks = createSelector(
  [selectTaskItems],
  (tasks) => tasks.filter((task) => task.completed).length,
)

export const selectCategoryById = createSelector(
  [selectCategories, (_state: RootState, categoryId: string) => categoryId],
  (categories, categoryId) =>
    categories.find((category) => category.id === categoryId),
)
