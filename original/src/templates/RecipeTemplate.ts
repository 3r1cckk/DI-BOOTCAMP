import { RecipeCollection } from '../model/RecipeCollection'
import type { NewRecipe, RecipeItem } from '../model/RecipeItem'

const fallbackImage =
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1000&q=80'

type RecipeFilter = 'all' | 'favorites' | 'recent'

export class RecipeTemplate {
  private readonly countElement: HTMLElement
  private readonly addDialog: HTMLDialogElement
  private readonly detailDialog: HTMLDialogElement
  private readonly detailContent: HTMLElement
  private readonly form: HTMLFormElement
  private readonly searchInputs: HTMLInputElement[]
  private filter: RecipeFilter = 'all'
  private searchTerm = ''

  constructor(
    private readonly container: HTMLElement,
    private readonly collection: RecipeCollection,
    private readonly onMessage: (message: string, isError?: boolean) => void,
  ) {
    this.countElement = requiredElement<HTMLElement>('#recipeCount')
    this.addDialog = requiredElement<HTMLDialogElement>('#addRecipeDialog')
    this.detailDialog = requiredElement<HTMLDialogElement>('#recipeDetailDialog')
    this.detailContent = requiredElement<HTMLElement>('#recipeDetailContent')
    this.form = requiredElement<HTMLFormElement>('#recipeEntryForm')
    this.searchInputs = [
      requiredElement<HTMLInputElement>('#headerSearch'),
      requiredElement<HTMLInputElement>('#collectionSearch'),
    ]
    this.bindEvents()
  }

  render(): void {
    const recipes = [...this.collection.getRecipes()]
    const matching = recipes.filter((recipe) => {
      const matchesFilter = this.filter !== 'favorites' || recipe.isFavorite
      const searchable = [
        recipe.title,
        recipe.description,
        recipe.category,
        ...recipe.ingredients,
      ]
        .join(' ')
        .toLocaleLowerCase()
      return matchesFilter && searchable.includes(this.searchTerm)
    })

    if (this.filter === 'recent') {
      matching.sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    }

    this.container.replaceChildren()
    this.countElement.textContent = `${matching.length} ${matching.length === 1 ? 'recipe' : 'recipes'}`

    if (matching.length === 0) {
      this.container.append(this.createEmptyState(recipes.length > 0))
      return
    }

    const fragment = document.createDocumentFragment()
    matching.forEach((recipe, index) => fragment.append(this.createCard(recipe, index)))
    this.container.append(fragment)
  }

  private bindEvents(): void {
    document.addEventListener('click', (event) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const actionElement = target.closest<HTMLElement>('[data-action]')
      if (actionElement) this.handleAction(actionElement)

      const filterButton = target.closest<HTMLButtonElement>('[data-filter]')
      if (filterButton) {
        const selectedFilter = filterButton.dataset.filter
        if (isRecipeFilter(selectedFilter)) this.setFilter(selectedFilter)
      }

      const navigationLink = target.closest<HTMLAnchorElement>('.nav-link[data-view]')
      if (navigationLink?.dataset.view === 'favorites') this.setFilter('favorites', 'Favorites')
      else if (navigationLink?.dataset.view === 'all') this.setFilter('all', 'My Recipes')
      else if (navigationLink?.dataset.view === 'home') this.setFilter('all', 'Home')
    })

    this.searchInputs.forEach((input) => {
      input.addEventListener('input', () => {
        this.searchTerm = input.value.trim().toLocaleLowerCase()
        this.searchInputs.forEach((otherInput) => {
          if (otherInput !== input) otherInput.value = input.value
        })
        this.render()
      })
    })

    this.form.addEventListener('submit', (event) => this.saveRecipe(event))
    this.addDialog.addEventListener('close', () => {
      this.form.reset()
      requiredElement<HTMLElement>('#formError').textContent = ''
    })
    this.addDialog.addEventListener('click', (event) => {
      if (event.target === this.addDialog) this.closeAddDialog()
    })
    this.detailDialog.addEventListener('click', (event) => {
      if (event.target === this.detailDialog) this.detailDialog.close()
    })

    document.addEventListener('keydown', (event) => {
      if (
        event.key === '/' &&
        !isTextEntry(event.target) &&
        !this.addDialog.open &&
        !this.detailDialog.open
      ) {
        event.preventDefault()
        this.searchInputs[1].focus()
      }
    })
  }

  private handleAction(element: HTMLElement): void {
    const action = element.dataset.action
    const recipeId = element.dataset.recipeId

    if (action === 'open-add') {
      this.openAddDialog()
      return
    }
    if (action === 'close-add') {
      this.closeAddDialog()
      return
    }
    if (action === 'close-detail') {
      this.detailDialog.close()
      return
    }
    if (action === 'clear-all') {
      this.clearAll()
      return
    }
    if (action === 'view-recipe' && recipeId) {
      this.openRecipeDetails(recipeId)
      return
    }
    if (action === 'favorite' && recipeId) {
      this.toggleFavorite(recipeId)
      return
    }
    if (action === 'delete' && recipeId) {
      this.deleteRecipe(recipeId)
    }
  }

  private setFilter(filter: RecipeFilter, activeNavigation = filter === 'favorites' ? 'Favorites' : 'My Recipes'): void {
    this.filter = filter
    document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((button) => {
      const active = button.dataset.filter === filter
      button.classList.toggle('is-active', active)
      button.setAttribute('aria-pressed', String(active))
    })
    document.querySelectorAll<HTMLAnchorElement>('.nav-link[data-view]').forEach((link) => {
      link.classList.toggle('is-current', link.textContent?.trim() === activeNavigation)
    })
    this.render()
  }

  private saveRecipe(event: SubmitEvent): void {
    event.preventDefault()
    const titleInput = requiredElement<HTMLInputElement>('#recipeTitle')
    const ingredientsInput = requiredElement<HTMLTextAreaElement>('#ingredients')
    const instructionsInput = requiredElement<HTMLTextAreaElement>('#instructions')
    const imageInput = requiredElement<HTMLInputElement>('#recipeImage')
    const descriptionInput = requiredElement<HTMLInputElement>('#recipeDescription')
    const categoryInput = requiredElement<HTMLSelectElement>('#recipeCategory')
    const formError = requiredElement<HTMLElement>('#formError')

    const title = titleInput.value.trim()
    const ingredients = ingredientsInput.value
      .split(/\r?\n/)
      .map((ingredient) => ingredient.trim())
      .filter(Boolean)
    const instructions = instructionsInput.value.trim()
    const imageUrl = imageInput.value.trim()

    formError.textContent = ''
    if (!title || ingredients.length === 0 || !instructions) {
      formError.textContent = 'Add a title, at least one ingredient, and the cooking instructions.'
      return
    }

    if (imageUrl) {
      try {
        const parsedUrl = new URL(imageUrl)
        if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
          throw new Error('Choose an image URL that starts with http:// or https://.')
        }
      } catch {
        formError.textContent = 'Enter a valid image URL, or leave the image field blank.'
        return
      }
    }

    const newRecipe: NewRecipe = {
      title,
      ingredients,
      instructions,
      description: descriptionInput.value.trim(),
      category: categoryInput.value || 'From my kitchen',
      imageUrl,
    }

    try {
      this.collection.addRecipe(newRecipe)
      this.setFilter('all')
      this.searchTerm = ''
      this.searchInputs.forEach((input) => (input.value = ''))
      this.form.reset()
      this.closeAddDialog()
      this.onMessage(`${title} has been tucked into your collection.`)
    } catch (error) {
      formError.textContent = errorMessage(error)
    }
  }

  private openAddDialog(): void {
    requiredElement<HTMLElement>('#formError').textContent = ''
    this.addDialog.showModal()
    requiredElement<HTMLInputElement>('#recipeTitle').focus()
  }

  private closeAddDialog(): void {
    if (this.addDialog.open) this.addDialog.close()
    this.form.reset()
    requiredElement<HTMLElement>('#formError').textContent = ''
  }

  private openRecipeDetails(recipeId: string): void {
    const recipe = this.collection.getRecipes().find((item) => item.id === recipeId)
    if (!recipe) return

    this.detailContent.replaceChildren()
    const closeButton = document.createElement('button')
    closeButton.className = 'dialog-close detail-close'
    closeButton.type = 'button'
    closeButton.dataset.action = 'close-detail'
    closeButton.setAttribute('aria-label', 'Close recipe details')
    closeButton.textContent = '×'

    const layout = document.createElement('div')
    layout.className = 'detail-layout'
    const image = createRecipeImage(recipe.imageUrl, recipe.title, 'detail-photo')
    const copy = document.createElement('div')
    copy.className = 'detail-copy'

    const category = document.createElement('p')
    category.className = 'eyebrow'
    category.textContent = recipe.category
    const title = document.createElement('h2')
    title.id = 'detailTitle'
    title.textContent = recipe.title
    const description = document.createElement('p')
    description.className = 'detail-description'
    description.textContent =
      recipe.description || `A favorite from my kitchen, made with ${recipe.ingredients.length} simple ingredients.`

    const ingredientsHeading = document.createElement('h3')
    ingredientsHeading.textContent = 'What you’ll need'
    const ingredients = document.createElement('ul')
    ingredients.className = 'detail-ingredients'
    recipe.ingredients.forEach((ingredient) => {
      const item = document.createElement('li')
      item.textContent = ingredient
      ingredients.append(item)
    })

    const instructionsHeading = document.createElement('h3')
    instructionsHeading.textContent = 'A little how-to'
    const instructions = document.createElement('p')
    instructions.className = 'detail-instructions'
    instructions.textContent = recipe.instructions

    const actions = document.createElement('div')
    actions.className = 'detail-actions'
    const favoriteButton = document.createElement('button')
    favoriteButton.className = `button button-outline${recipe.isFavorite ? ' is-favorite' : ''}`
    favoriteButton.type = 'button'
    favoriteButton.dataset.action = 'favorite'
    favoriteButton.dataset.recipeId = recipe.id
    favoriteButton.setAttribute('aria-pressed', String(recipe.isFavorite))
    favoriteButton.textContent = recipe.isFavorite ? '♥ Saved to favorites' : '♡ Add to favorites'

    const deleteButton = document.createElement('button')
    deleteButton.className = 'text-button delete-detail-button'
    deleteButton.type = 'button'
    deleteButton.dataset.action = 'delete'
    deleteButton.dataset.recipeId = recipe.id
    deleteButton.textContent = 'Delete recipe'
    actions.append(favoriteButton, deleteButton)
    copy.append(category, title, description, ingredientsHeading, ingredients, instructionsHeading, instructions, actions)
    layout.append(image, copy)
    this.detailContent.append(closeButton, layout)
    this.detailDialog.showModal()
  }

  private toggleFavorite(recipeId: string): void {
    try {
      const detailsWereOpen = this.detailDialog.open
      if (detailsWereOpen) this.detailDialog.close()
      this.collection.toggleFavorite(recipeId)
      this.render()
      if (detailsWereOpen) this.openRecipeDetails(recipeId)
      const recipe = this.collection.getRecipes().find((item) => item.id === recipeId)
      if (recipe) {
        this.onMessage(
          recipe.isFavorite
            ? `${recipe.title} is one of your favorites.`
            : `${recipe.title} was removed from favorites.`,
        )
      }
    } catch (error) {
      this.onMessage(errorMessage(error), true)
    }
  }

  private deleteRecipe(recipeId: string): void {
    const recipe = this.collection.getRecipes().find((item) => item.id === recipeId)
    if (!recipe || !window.confirm(`Remove “${recipe.title}” from your recipe book?`)) return

    try {
      this.collection.removeRecipe(recipeId)
      if (this.detailDialog.open) this.detailDialog.close()
      this.render()
      this.onMessage(`${recipe.title} was removed from your collection.`)
    } catch (error) {
      this.onMessage(errorMessage(error), true)
    }
  }

  private clearAll(): void {
    if (this.collection.getRecipes().length === 0) return
    if (!window.confirm('Clear every recipe from your collection? This cannot be undone.')) return

    try {
      this.collection.clearRecipes()
      this.render()
      this.onMessage('Your recipe book is ready for a fresh start.')
    } catch (error) {
      this.onMessage(errorMessage(error), true)
    }
  }

  private createEmptyState(hasRecipes: boolean): HTMLElement {
    const state = document.createElement('div')
    state.className = 'empty-state'
    const heading = document.createElement('h3')
    const description = document.createElement('p')

    if (hasRecipes && this.filter === 'favorites') {
      heading.textContent = 'No favorites just yet.'
      description.textContent = 'Tap the little heart on a recipe to keep it close.'
    } else if (this.searchTerm) {
      heading.textContent = 'Nothing in the recipe box by that name.'
      description.textContent = 'Try another title or ingredient.'
    } else if (hasRecipes && this.filter === 'recent') {
      heading.textContent = 'No recent recipes.'
      description.textContent = 'Add a recipe and it will find a place here.'
    } else if (!hasRecipes) {
      heading.textContent = 'A little room for something lovely.'
      description.textContent = 'Your collection is waiting for its first recipe.'
    } else {
      heading.textContent = 'Nothing to see here yet.'
      description.textContent = 'Add a recipe to start your collection.'
    }

    state.append(heading, description)
    if (!hasRecipes) {
      const button = document.createElement('button')
      button.className = 'button button-primary'
      button.type = 'button'
      button.dataset.action = 'open-add'
      button.textContent = 'Add your first recipe'
      state.append(button)
    }
    return state
  }

  private createCard(recipe: RecipeItem, index: number): HTMLElement {
    const card = document.createElement('article')
    card.className = 'recipe-card'
    card.style.setProperty('--card-index', String(index))

    const photo = document.createElement('div')
    photo.className = 'card-photo'
    const image = createRecipeImage(recipe.imageUrl, recipe.title, 'recipe-image')
    const category = document.createElement('span')
    category.className = 'category-tag'
    category.textContent = recipe.category
    const favoriteButton = document.createElement('button')
    favoriteButton.className = `favorite-button${recipe.isFavorite ? ' is-favorite' : ''}`
    favoriteButton.type = 'button'
    favoriteButton.dataset.action = 'favorite'
    favoriteButton.dataset.recipeId = recipe.id
    favoriteButton.setAttribute('aria-pressed', String(recipe.isFavorite))
    favoriteButton.setAttribute(
      'aria-label',
      recipe.isFavorite ? `Remove ${recipe.title} from favorites` : `Add ${recipe.title} to favorites`,
    )
    favoriteButton.textContent = recipe.isFavorite ? '♥' : '♡'
    photo.append(image, category, favoriteButton)

    const content = document.createElement('div')
    content.className = 'recipe-card-content'
    const meta = document.createElement('p')
    meta.className = 'recipe-meta'
    meta.textContent = `${recipe.ingredients.length} ingredients · ${recipe.isFavorite ? 'A favorite' : 'From my kitchen'}`
    const title = document.createElement('h3')
    title.textContent = recipe.title
    const description = document.createElement('p')
    description.className = 'recipe-description'
    description.textContent =
      recipe.description || recipe.ingredients.slice(0, 3).join(' · ')
    const viewButton = document.createElement('button')
    viewButton.className = 'view-recipe'
    viewButton.type = 'button'
    viewButton.dataset.action = 'view-recipe'
    viewButton.dataset.recipeId = recipe.id
    viewButton.innerHTML = 'View recipe <span aria-hidden="true">↗</span>'
    content.append(meta, title, description, viewButton)
    card.append(photo, content)
    return card
  }
}

function createRecipeImage(src: string, alt: string, className: string): HTMLImageElement {
  const image = document.createElement('img')
  image.className = className
  image.src = src || fallbackImage
  image.alt = alt
  image.loading = 'lazy'
  image.addEventListener('error', () => {
    if (image.dataset.fallbackApplied !== 'true') {
      image.dataset.fallbackApplied = 'true'
      image.src = fallbackImage
    } else {
      image.classList.add('image-unavailable')
      image.removeAttribute('src')
    }
  })
  return image
}

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) throw new Error(`The page is missing a required element: ${selector}`)
  return element
}

function isRecipeFilter(value: string | undefined): value is RecipeFilter {
  return value === 'all' || value === 'favorites' || value === 'recent'
}

function isTextEntry(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Something went wrong while updating your recipes.'
}
