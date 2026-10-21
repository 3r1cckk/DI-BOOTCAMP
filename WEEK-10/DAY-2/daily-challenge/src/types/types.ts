export interface FetchRequest {
  url: string
  headers?: Record<string, string>
}

export interface DataState {
  data: unknown
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  activeRequestId: string | null
}

export interface SpoonacularRecipe {
  id: number
  title: string
  image: string
  imageType?: string
  summary?: string
  readyInMinutes?: number
  servings?: number
  dishTypes?: string[]
  extendedIngredients?: SpoonacularIngredient[]
  analyzedInstructions?: SpoonacularInstructionSet[]
  sourceUrl?: string
}

export interface SpoonacularIngredient {
  id: number
  original: string
  name: string
}

export interface SpoonacularInstructionSet {
  name: string
  steps: SpoonacularInstructionStep[]
}

export interface SpoonacularInstructionStep {
  number: number
  step: string
}

export interface SpoonacularSearchResponse {
  results: SpoonacularRecipe[]
  totalResults: number
}

export interface SearchRecipesOptions {
  query: string
  apiKey: string
  number?: number
}
