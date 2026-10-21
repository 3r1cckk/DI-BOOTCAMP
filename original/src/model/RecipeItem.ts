export interface RecipeData {
  id: string
  title: string
  ingredients: string[]
  instructions: string
  isFavorite: boolean
  description: string
  category: string
  imageUrl: string
  createdAt: string
}

export interface NewRecipe {
  title: string
  ingredients: string[]
  instructions: string
  description?: string
  category?: string
  imageUrl?: string
}

type RecipeInput = NewRecipe & Partial<Pick<RecipeData, 'id' | 'isFavorite' | 'createdAt'>>

export class RecipeItem {
  readonly id: string
  readonly title: string
  readonly ingredients: string[]
  readonly instructions: string
  readonly isFavorite: boolean
  readonly description: string
  readonly category: string
  readonly imageUrl: string
  readonly createdAt: string

  constructor({
    id = crypto.randomUUID(),
    title,
    ingredients,
    instructions,
    isFavorite = false,
    description = '',
    category = 'From my kitchen',
    imageUrl = '',
    createdAt = new Date().toISOString(),
  }: RecipeInput) {
    this.id = id
    this.title = title
    this.ingredients = [...ingredients]
    this.instructions = instructions
    this.isFavorite = isFavorite
    this.description = description
    this.category = category
    this.imageUrl = imageUrl
    this.createdAt = createdAt
  }

  toData(): RecipeData {
    return {
      id: this.id,
      title: this.title,
      ingredients: [...this.ingredients],
      instructions: this.instructions,
      isFavorite: this.isFavorite,
      description: this.description,
      category: this.category,
      imageUrl: this.imageUrl,
      createdAt: this.createdAt,
    }
  }
}
