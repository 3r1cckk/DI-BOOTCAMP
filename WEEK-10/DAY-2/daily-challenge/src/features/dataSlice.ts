import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { fetchJson } from '../api/api'
import type { DataState, FetchRequest } from '../types/types'

const initialState: DataState = {
  data: null,
  status: 'idle',
  error: null,
  activeRequestId: null,
}

export const fetchData = createAsyncThunk<unknown, FetchRequest>(
  'data/fetchData',
  async (request, { signal }) => fetchJson<unknown>(request, signal),
)

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    clearData(state) {
      state.data = null
      state.status = 'idle'
      state.error = null
      state.activeRequestId = null
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchData.pending, (state, action) => {
        state.status = 'loading'
        state.error = null
        state.activeRequestId = action.meta.requestId
      })
      .addCase(fetchData.fulfilled, (state, action) => {
        if (state.activeRequestId !== action.meta.requestId) return
        state.status = 'succeeded'
        state.data = action.payload
        state.activeRequestId = null
      })
      .addCase(fetchData.rejected, (state, action) => {
        if (state.activeRequestId !== action.meta.requestId) return
        state.status = action.meta.aborted ? 'idle' : 'failed'
        state.error = action.meta.aborted
          ? null
          : action.error.message || 'The request failed. Please try again.'
        state.activeRequestId = null
      })
  },
})

export const { clearData } = dataSlice.actions
export default dataSlice.reducer
