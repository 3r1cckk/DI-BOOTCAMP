import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

export interface Category {
  id: string
  name: string
  color: string
}

type CategoriesState = Category[]

const initialState: CategoriesState = [
  { id: 'work', name: 'Work', color: '#657b64' },
  { id: 'personal', name: 'Personal', color: '#b47b5d' },
  { id: 'wellness', name: 'Wellness', color: '#788ca3' },
]

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    addCategory: {
      reducer(state, action: PayloadAction<Category>) {
        state.push(action.payload)
      },
      prepare(name: string) {
        return {
          payload: {
            id: nanoid(),
            name: name.trim(),
            color: ['#657b64', '#b47b5d', '#788ca3', '#9a7b9b'][
              Math.floor(Math.random() * 4)
            ],
          },
        }
      },
    },
    editCategory(
      state,
      action: PayloadAction<{ id: string; name: string }>,
    ) {
      const category = state.find((item) => item.id === action.payload.id)
      if (category) category.name = action.payload.name.trim()
    },
    deleteCategory(state, action: PayloadAction<string>) {
      return state.filter((category) => category.id !== action.payload)
    },
  },
})

export const { addCategory, editCategory, deleteCategory } =
  categoriesSlice.actions
export default categoriesSlice.reducer
