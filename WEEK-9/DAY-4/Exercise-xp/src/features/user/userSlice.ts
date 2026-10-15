import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

export interface User {
  id: number
  name: string
  username: string
  email: string
  phone: string
  website: string
  address: {
    city: string
  }
  company: {
    name: string
  }
}

type UserStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

interface UserState {
  profile: User | null
  status: UserStatus
  error: string | null
}

const initialState: UserState = {
  profile: null,
  status: 'idle',
  error: null,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUser(value: unknown): value is User {
  if (!isRecord(value) || !isRecord(value.address) || !isRecord(value.company)) {
    return false
  }

  return (
    typeof value.id === 'number' &&
    typeof value.name === 'string' &&
    typeof value.username === 'string' &&
    typeof value.email === 'string' &&
    typeof value.phone === 'string' &&
    typeof value.website === 'string' &&
    typeof value.address.city === 'string' &&
    typeof value.company.name === 'string'
  )
}

export const fetchUser = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>('user/fetchUser', async (_, { rejectWithValue, signal }) => {
  const response = await fetch('https://jsonplaceholder.typicode.com/users/1', {
    signal,
  })

  if (!response.ok) {
    return rejectWithValue(
      `The user service returned an error (${response.status}).`,
    )
  }

  const data: unknown = await response.json()
  if (!isUser(data)) {
    return rejectWithValue('The user service returned an unexpected response.')
  }

  return data
})

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.profile = action.payload
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.status = 'failed'
        state.error =
          action.payload ??
          action.error.message ??
          'Unable to load the user profile. Please try again.'
      })
  },
})

export default userSlice.reducer
