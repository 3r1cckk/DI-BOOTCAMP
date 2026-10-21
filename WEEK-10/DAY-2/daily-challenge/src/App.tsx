import { useMemo, useState } from 'react'
import { buildRecipeSearchRequest, parseRecipeResults } from './api/api'
import { DataFetcher } from './components/DataFetcher'
import type { FetchRequest, SpoonacularRecipe } from './types/types'

const fallbackImage =
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=900&q=80'

function App() {
  const [query, setQuery] = useState('')
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_RAPIDAPI_KEY ?? '')
  const [search, setSearch] = useState<{ query: string; apiKey: string } | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<SpoonacularRecipe | null>(null)
  const [formError, setFormError] = useState('')

  const request = useMemo<FetchRequest | null>(() => {
    if (!search) return null
    return buildRecipeSearchRequest({ query: search.query, apiKey: search.apiKey })
  }, [search])

  const onSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const cleanQuery = query.trim()
    const cleanKey = apiKey.trim()

    if (!cleanQuery) {
      setFormError('Add an ingredient or dish to search for.')
      return
    }
    if (!cleanKey) {
      setFormError('Add your Spoonacular RapidAPI key to search.')
      return
    }

    setFormError('')
    setSearch({ query: cleanQuery, apiKey: cleanKey })
  }

  return (
    <div className="page-shell">
      <header className="site-header">
        <a className="wordmark" href="#home" aria-label="The Recipe Drawer home">
          <span className="wordmark-mark">r.</span>
          <span>the recipe drawer<span className="wordmark-period">.</span></span>
        </a>
        <nav className="site-nav" aria-label="Main navigation">
          <a className="nav-link is-active" href="#home">Recipe finder</a>
          <a className="nav-link" href="#about">How it works</a>
        </nav>
        <a className="header-note" href="#search">Have a look around <span aria-hidden="true">↘</span></a>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-rule" />A HAND WITH THE EVERYDAY QUESTION</p>
            <h1>What should we<br /><em>cook tonight?</em></h1>
            <p className="hero-description">
              Tell us what’s in the fridge, or what you’re in the mood for.
              We’ll find a few recipes to get you started.
            </p>
            <a className="text-link" href="#search">Find a recipe <span aria-hidden="true">↓</span></a>
            <p className="handwritten-note">A little inspiration for the weeknight table.</p>
          </div>
          <figure className="hero-image-wrap">
            <img
              className="hero-image"
              src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1500&q=85"
              alt="Fresh ingredients ready for a home-cooked meal"
              onError={(event) => handleImageError(event.currentTarget)}
            />
            <figcaption><span>IN THE KITCHEN</span> Simple food, shared well</figcaption>
            <span className="hero-seal" aria-hidden="true">GOOD<br />FOOD<br />AT HOME</span>
          </figure>
        </section>

        <section className="search-section" id="search" aria-labelledby="search-title">
          <div className="section-intro">
            <p className="eyebrow">START WITH WHAT YOU HAVE</p>
            <h2 id="search-title">What are you <em>craving?</em></h2>
            <p>Search by dish or ingredient. Either is a good place to start.</p>
          </div>

          <form className="search-form" onSubmit={onSubmit} noValidate>
            <label htmlFor="recipeQuery">What would you like to cook?</label>
            <div className="query-control">
              <span aria-hidden="true">⌕</span>
              <input
                id="recipeQuery"
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.currentTarget.value)
                  if (formError) setFormError('')
                }}
                placeholder="chickpeas, pasta, lemon chicken..."
                required
              />
              <button className="button button-search" type="submit">
                Find recipes <span aria-hidden="true">↗</span>
              </button>
            </div>

            <div className="key-control">
              <label htmlFor="rapidApiKey">Spoonacular RapidAPI key</label>
              <input
                id="rapidApiKey"
                type="password"
                value={apiKey}
                onChange={(event) => {
                  setApiKey(event.currentTarget.value)
                  if (formError) setFormError('')
                }}
                placeholder="Your Spoonacular RapidAPI key"
                autoComplete="off"
                spellCheck={false}
                aria-describedby="rapidApiKeyNote"
              />
              <span className="key-note" id="rapidApiKeyNote">
                Sent with your search. This app doesn’t save it.
              </span>
            </div>
            {formError && <p className="form-error" role="alert">{formError}</p>}
          </form>

          <div className="result-heading">
            <div>
              <p className="eyebrow">FROM SPOONACULAR</p>
              <h3>{search ? `Recipes for “${search.query}”` : 'Ready when you are'}</h3>
            </div>
            <span className="source-note">Powered by Spoonacular</span>
          </div>

          <DataFetcher<SpoonacularRecipe>
            request={request}
            parseItems={parseRecipeResults}
            getKey={(recipe) => recipe.id}
            renderItem={(recipe) => (
              <RecipeCard recipe={recipe} onOpen={() => setSelectedRecipe(recipe)} />
            )}
            emptyMessage="Try another ingredient or a broader search, such as “chicken” or “pasta”."
          />
        </section>

        <section className="about-note" id="about">
          <span className="about-mark" aria-hidden="true">✳</span>
          <div>
            <p className="eyebrow">A QUICK NOTE ABOUT YOUR KEY</p>
            <p>
              Recipes come from Spoonacular, through RapidAPI. You’ll need an
              active subscription and API key. The key is sent with each search
              and isn’t stored by this app.
            </p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="wordmark footer-wordmark" href="#home">
          <span>the recipe drawer</span><span className="wordmark-period">.</span>
        </a>
        <p>Hope you find something good to make.</p>
        <a className="back-to-top" href="#home">Back to top ↑</a>
      </footer>

      {selectedRecipe && (
        <RecipeDialog recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
      )}
    </div>
  )
}

interface RecipeCardProps {
  recipe: SpoonacularRecipe
  onOpen: () => void
}

function RecipeCard({ recipe, onOpen }: RecipeCardProps) {
  const summary = recipe.summary ? stripHtml(recipe.summary) : ''
  const ingredients = recipe.extendedIngredients?.slice(0, 3).map((ingredient) => ingredient.original)
  const description = summary || ingredients?.join(' · ') || 'Open this recipe to see the details.'
  const category = recipe.dishTypes?.[0] ?? 'Recipe'

  return (
    <article className="recipe-card">
      <button className="card-image-button" type="button" onClick={onOpen} aria-label={`View ${recipe.title}`}>
        <img
          src={recipe.image || fallbackImage}
          alt={recipe.title}
          loading="lazy"
          onError={(event) => handleImageError(event.currentTarget)}
        />
        <span className="category-tag">{category}</span>
      </button>
      <div className="recipe-card-content">
        <p className="recipe-meta">
          {recipe.readyInMinutes ? `${recipe.readyInMinutes} min` : 'A recipe to try'}
          {recipe.servings ? ` · Serves ${recipe.servings}` : ''}
        </p>
        <h4>{recipe.title}</h4>
        <p className="recipe-description">{description}</p>
        <button className="view-recipe" type="button" onClick={onOpen}>
          View recipe <span aria-hidden="true">↗</span>
        </button>
      </div>
    </article>
  )
}

interface RecipeDialogProps {
  recipe: SpoonacularRecipe
  onClose: () => void
}

function RecipeDialog({ recipe, onClose }: RecipeDialogProps) {
  const instructions = recipe.analyzedInstructions?.flatMap((group) => group.steps) ?? []
  const ingredients = recipe.extendedIngredients ?? []

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="recipe-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose()
        }}
      >
        <button className="dialog-close" type="button" onClick={onClose} aria-label="Close recipe details">×</button>
        <img className="dialog-image" src={recipe.image || fallbackImage} alt={recipe.title} />
        <div className="dialog-copy">
          <p className="eyebrow">
            {recipe.dishTypes?.[0] ?? 'FROM THE RECIPE BOX'}
            {recipe.readyInMinutes ? ` · ${recipe.readyInMinutes} MINUTES` : ''}
          </p>
          <h2 id="dialog-title">{recipe.title}</h2>
          {recipe.summary && <p className="dialog-summary">{stripHtml(recipe.summary)}</p>}
          {ingredients.length > 0 && (
            <>
              <h3>What you’ll need</h3>
              <ul className="ingredient-list">
                {ingredients.map((ingredient, index) => (
                  <li key={`${ingredient.id}-${index}`}>{ingredient.original}</li>
                ))}
              </ul>
            </>
          )}
          {instructions.length > 0 ? (
            <>
              <h3>A little how-to</h3>
              <ol className="instruction-list">
                {instructions.map((step) => (
                  <li key={`${step.number}-${step.step}`}>{step.step}</li>
                ))}
              </ol>
            </>
          ) : (
            <p className="instruction-note">
              Full cooking instructions are available on the original recipe page.
            </p>
          )}
          {recipe.sourceUrl && (
            <a className="button button-primary source-button" href={recipe.sourceUrl} target="_blank" rel="noreferrer">
              Visit original recipe <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </section>
    </div>
  )
}

function stripHtml(value: string): string {
  const parsed = new DOMParser().parseFromString(value, 'text/html')
  return parsed.body.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

function handleImageError(image: HTMLImageElement): void {
  if (image.dataset.fallbackApplied !== 'true') {
    image.dataset.fallbackApplied = 'true'
    image.src = fallbackImage
    return
  }

  image.removeAttribute('src')
  image.classList.add('image-unavailable')
}

export default App
