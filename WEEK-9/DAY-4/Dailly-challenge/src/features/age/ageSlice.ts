import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

const UPDATE_DELAY_MS = 700

interface AgeState {
  age: number
  loading: boolean
}

const initialState: AgeState = {
  age: 25,
  loading: false,
}

function waitForUpdate(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, UPDATE_DELAY_MS)
  })
}

export const ageUpAsync = createAsyncThunk('age/ageUpAsync', async () => {
  await waitForUpdate()
  return 1
})

export const ageDownAsync = createAsyncThunk('age/ageDownAsync', async () => {
  await waitForUpdate()
  return 1
})

const ageSlice = createSlice({
  name: 'age',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(ageUpAsync.pending, (state) => {
        state.loading = true
      })
      .addCase(ageUpAsync.fulfilled, (state, action) => {
        state.age += action.payload
        state.loading = false
      })
      .addCase(ageUpAsync.rejected, (state) => {
        state.loading = false
      })
      .addCase(ageDownAsync.pending, (state) => {
        state.loading = true
      })
      .addCase(ageDownAsync.fulfilled, (state, action) => {
        state.age = Math.max(0, state.age - action.payload)
        state.loading = false
      })
      .addCase(ageDownAsync.rejected, (state) => {
        state.loading = false
      })
  },
})

export default ageSlice.reducer
