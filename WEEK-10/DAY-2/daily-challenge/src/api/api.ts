import type {
  FetchRequest,
  SearchRecipesOptions,
  SpoonacularRecipe,
  SpoonacularSearchResponse,
} from '../types/types'

const RAPIDAPI_HOST = 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com'
const SPOONACULAR_BASE_URL = `https://${RAPIDAPI_HOST}`

export async function fetchJson<T>(
  request: FetchRequest,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(request.url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...request.headers,
    },
    signal,
  })

  if (!response.ok) {
    const message = await readApiError(response)
    throw new Error(message)
  }

  try {
    return (await response.json()) as T
  } catch (error) {
    throw new Error('The API returned a response that was not valid JSON.', { cause: error })
  }
}

export function buildRecipeSearchRequest({
  query,
  apiKey,
  number = 12,
}: SearchRecipesOptions): FetchRequest {
  const url = new URL(`${SPOONACULAR_BASE_URL}/recipes/complexSearch`)
  url.searchParams.set('query', query)
  url.searchParams.set('number', String(number))
  url.searchParams.set('addRecipeInformation', 'true')
  url.searchParams.set('fillIngredients', 'true')

  return {
    url: url.toString(),
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
    },
  }
}

export function parseRecipeResults(value: unknown): SpoonacularRecipe[] {
  if (!isSearchResponse(value)) {
    throw new Error('The recipe API returned data in an unexpected format.')
  }

  return value.results
}

function isSearchResponse(value: unknown): value is SpoonacularSearchResponse {
  if (typeof value !== 'object' || value === null || !('results' in value)) return false

  const results = value.results
  return (
    Array.isArray(results) &&
    results.every(isRecipe) &&
    'totalResults' in value &&
    typeof value.totalResults === 'number'
  )
}

function isRecipe(value: unknown): value is SpoonacularRecipe {
  if (typeof value !== 'object' || value === null) return false

  return (
    'id' in value &&
    typeof value.id === 'number' &&
    'title' in value &&
    typeof value.title === 'string' &&
    'image' in value &&
    typeof value.image === 'string' &&
    (!('summary' in value) || typeof value.summary === 'string') &&
    (!('readyInMinutes' in value) || typeof value.readyInMinutes === 'number') &&
    (!('servings' in value) || typeof value.servings === 'number') &&
    (!('dishTypes' in value) ||
      (Array.isArray(value.dishTypes) && value.dishTypes.every((type) => typeof type === 'string'))) &&
    (!('extendedIngredients' in value) ||
      (Array.isArray(value.extendedIngredients) && value.extendedIngredients.every(isIngredient))) &&
    (!('analyzedInstructions' in value) ||
      (Array.isArray(value.analyzedInstructions) &&
        value.analyzedInstructions.every(isInstructionSet))) &&
    (!('sourceUrl' in value) || typeof value.sourceUrl === 'string')
  )
}

function isIngredient(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'number' &&
    'original' in value &&
    typeof value.original === 'string' &&
    'name' in value &&
    typeof value.name === 'string'
  )
}

function isInstructionSet(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof value.name === 'string' &&
    'steps' in value &&
    Array.isArray(value.steps) &&
    value.steps.every(isInstructionStep)
  )
}

function isInstructionStep(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'number' in value &&
    typeof value.number === 'number' &&
    'step' in value &&
    typeof value.step === 'string'
  )
}

async function readApiError(response: Response): Promise<string> {
  const responseBody = await response.text()
  if (!responseBody) return fallbackApiError(response.status)

  let body: unknown
  try {
    body = JSON.parse(responseBody)
  } catch (error) {
    if (error instanceof SyntaxError) return fallbackApiError(response.status)
    throw error
  }

  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message = body.message
    if (typeof message === 'string') {
      return message
    }
  }

  return fallbackApiError(response.status)
}

function fallbackApiError(status: number): string {
  if (status === 401 || status === 403) {
    return 'That key was not accepted. Check it and make sure your Spoonacular API subscription is active.'
  }
  if (status === 429) {
    return 'You have reached the API rate limit. Give it a little while, then try again.'
  }
  return `Recipe search failed (HTTP ${status}). Please try again.`
}
