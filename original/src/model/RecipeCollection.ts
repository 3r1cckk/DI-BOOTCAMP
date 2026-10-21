import { RecipeItem, type NewRecipe, type RecipeData } from './RecipeItem'

const STORAGE_KEY = 'gather-recipes'

export class RecipeCollection {
  private recipes: RecipeItem[] = []

  getRecipes(): readonly RecipeItem[] {
    return [...this.recipes]
  }

  addRecipe(recipe: NewRecipe): RecipeItem {
    const newRecipe = new RecipeItem(recipe)
    this.commit([...this.recipes, newRecipe])
    return newRecipe
  }

  removeRecipe(id: string): void {
    this.commit(this.recipes.filter((recipe) => recipe.id !== id))
  }

  toggleFavorite(id: string): void {
    const recipe = this.recipes.find((item) => item.id === id)
    if (!recipe) return

    this.commit(
      this.recipes.map((item) =>
        item.id === id
          ? new RecipeItem({ ...item.toData(), isFavorite: !item.isFavorite })
          : item,
      ),
    )
  }

  clearRecipes(): void {
    this.commit([])
  }

  loadFromLocalStorage(starterRecipes: NewRecipe[]): void {
    const storedRecipes = localStorage.getItem(STORAGE_KEY)
    if (storedRecipes === null) {
      this.recipes = starterRecipes.map((recipe) => new RecipeItem(recipe))
      this.saveToLocalStorage()
      return
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(storedRecipes)
    } catch (error) {
      throw new Error('Saved recipes contain invalid JSON.', { cause: error })
    }

    if (!Array.isArray(parsed) || !parsed.every(isRecipeData)) {
      throw new Error('Saved recipes have an invalid format.')
    }

    this.recipes = parsed.map((recipe) => new RecipeItem(recipe))
  }

  loadStarterRecipes(starterRecipes: NewRecipe[]): void {
    this.recipes = starterRecipes.map((recipe) => new RecipeItem(recipe))
  }

  saveToLocalStorage(): void {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(this.recipes.map((recipe) => recipe.toData())),
    )
  }

  private commit(recipes: RecipeItem[]): void {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(recipes.map((recipe) => recipe.toData())),
    )
    this.recipes = recipes
  }
}

function isRecipeData(value: unknown): value is RecipeData {
  if (typeof value !== 'object' || value === null) return false

  const recipe = value as Partial<RecipeData>
  return (
    typeof recipe.id === 'string' &&
    recipe.id.length > 0 &&
    typeof recipe.title === 'string' &&
    Array.isArray(recipe.ingredients) &&
    recipe.ingredients.every((ingredient) => typeof ingredient === 'string') &&
    typeof recipe.instructions === 'string' &&
    typeof recipe.isFavorite === 'boolean' &&
    (recipe.description === undefined || typeof recipe.description === 'string') &&
    (recipe.category === undefined || typeof recipe.category === 'string') &&
    (recipe.imageUrl === undefined || typeof recipe.imageUrl === 'string') &&
    (recipe.createdAt === undefined || typeof recipe.createdAt === 'string')
  )
}
