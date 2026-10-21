import { RecipeCollection } from './model/RecipeCollection'
import type { NewRecipe } from './model/RecipeItem'
import { RecipeTemplate } from './templates/RecipeTemplate'
import './style.css'

const recipes: NewRecipe[] = [
  {
    title: 'Creamy Tuscan Pasta',
    description: 'Sun-dried tomatoes, a silky little sauce, and plenty of parmesan.',
    category: 'Dinner',
    imageUrl:
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1000&q=80',
    ingredients: [
      '12 oz rigatoni or your favorite pasta',
      '2 tbsp olive oil',
      '3 cloves garlic, thinly sliced',
      '½ cup sun-dried tomatoes',
      '¾ cup heavy cream',
      '2 handfuls baby spinach',
      '½ cup freshly grated parmesan',
      'A little flaky salt and black pepper',
    ],
    instructions:
      'Bring a big pot of well-salted water to a boil and cook the pasta until just shy of al dente. Save a mug of pasta water before draining.\n\nWarm the olive oil in a skillet. Add the garlic and sun-dried tomatoes and let everything sizzle for a minute. Pour in the cream, add a splash of pasta water, then fold in the spinach until it just wilts.\n\nToss the pasta through the sauce with the parmesan. Finish with black pepper and take it straight to the table.',
  },
  {
    title: 'Sunday Banana Pancakes',
    description: 'Soft in the middle, golden at the edges, best eaten in pajamas.',
    category: 'Breakfast',
    imageUrl:
      'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1000&q=80',
    ingredients: [
      '1 ripe banana, mashed',
      '1 cup buttermilk',
      '1 large egg',
      '1 cup all-purpose flour',
      '1 tbsp melted butter, plus more for the pan',
      '1 tsp baking powder',
      'A pinch of cinnamon',
      'Maple syrup and berries, to serve',
    ],
    instructions:
      'Whisk the mashed banana, buttermilk, egg, and melted butter together. In another bowl, stir the flour, baking powder, cinnamon, and a pinch of salt.\n\nFold the dry ingredients into the banana mixture just until combined; a few lumps are lovely. Let the batter sit while a buttered skillet warms over medium heat.\n\nSpoon in small pancakes and flip when bubbles appear. Serve warm with maple syrup and whatever berries are in season.',
  },
  {
    title: 'Garlic Butter Chicken',
    description: 'A one-pan supper with crisp golden edges and a lemony pan sauce.',
    category: 'Dinner',
    imageUrl:
      'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=1000&q=80',
    ingredients: [
      '4 chicken thighs, skin on',
      '4 tbsp salted butter',
      '5 cloves garlic, lightly crushed',
      '1 lemon, zested and juiced',
      '3 sprigs fresh thyme',
      '½ cup chicken stock',
      'A handful of chopped parsley',
      'Sea salt and plenty of black pepper',
    ],
    instructions:
      'Pat the chicken dry, then season generously on both sides. Set a skillet over medium heat and place the chicken skin-side down. Let it turn deeply golden before you turn it over.\n\nAdd the butter, garlic, and thyme to the pan. Baste the chicken for a minute, then pour in the stock and lemon juice. Cover and cook gently until the chicken is cooked through.\n\nFinish with lemon zest, parsley, and the buttery pan juices spooned over everything.',
  },
  {
    title: 'Roasted Vegetable Bowl',
    description: 'A bright, generous bowl for clearing out the market basket.',
    category: 'Lunch',
    imageUrl:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=80',
    ingredients: [
      '1 sweet potato, cut into wedges',
      '1 red onion, cut into petals',
      '1 tin chickpeas, drained and dried',
      '2 tbsp olive oil',
      '1 tsp ground cumin',
      '2 handfuls leafy greens',
      '½ cup thick yogurt',
      'A squeeze of lemon and fresh herbs',
    ],
    instructions:
      'Heat the oven to 425°F / 220°C. Toss the sweet potato, onion, and chickpeas with olive oil, cumin, salt, and pepper. Spread everything out on a baking tray.\n\nRoast for 25–30 minutes, turning once, until the sweet potato is tender and the chickpeas are crisp at the edges.\n\nStir lemon juice into the yogurt. Pile the warm vegetables onto greens, add a generous spoonful of lemon yogurt, and finish with fresh herbs.',
  },
  {
    title: 'Fresh Tomato Bruschetta',
    description: 'Juicy tomatoes, good olive oil, and toast rubbed with garlic.',
    category: 'Little bites',
    imageUrl:
      'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=1000&q=80',
    ingredients: [
      '4 ripe tomatoes, finely chopped',
      '1 small handful fresh basil',
      '1 tbsp extra-virgin olive oil',
      '1 tsp red wine vinegar',
      '1 small loaf crusty bread',
      '1 clove garlic, peeled',
      'A little flaky salt',
    ],
    instructions:
      'Put the chopped tomatoes in a bowl with the torn basil, olive oil, vinegar, and a pinch of salt. Leave them for ten minutes so the juices gather at the bottom.\n\nSlice the bread and toast it until crisp and golden. Rub each warm slice with the cut side of the garlic clove.\n\nSpoon the tomatoes onto the toast just before serving. A little extra olive oil on top never hurts.',
  },
]

const message = document.querySelector<HTMLElement>('#appMessage')
const container = document.querySelector<HTMLElement>('#recipeContainer')
if (!message || !container) throw new Error('The recipe collection page is missing required elements.')

const heroImage = document.querySelector<HTMLImageElement>('.hero-photo img')
heroImage?.addEventListener('error', () => {
  if (heroImage.dataset.fallbackApplied !== 'true') {
    heroImage.dataset.fallbackApplied = 'true'
    heroImage.src =
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1500&q=80'
  } else {
    heroImage.dataset.imageUnavailable = 'true'
    heroImage.removeAttribute('src')
  }
})

let messageTimer: number | undefined
const showMessage = (text: string, isError = false): void => {
  message.textContent = text
  message.classList.toggle('is-error', isError)
  message.classList.add('is-visible')
  if (messageTimer !== undefined) window.clearTimeout(messageTimer)
  if (!isError) {
    messageTimer = window.setTimeout(() => {
      message.textContent = ''
      message.classList.remove('is-visible')
    }, 5000)
  }
}

const collection = new RecipeCollection()
try {
  collection.loadFromLocalStorage(recipes)
} catch (error) {
  collection.loadStarterRecipes(recipes)
  const reason = error instanceof Error ? error.message : 'The saved data could not be read.'
  showMessage(
    `Your saved recipes could not be loaded (${reason}). The sample collection is shown for now.`,
    true,
  )
}

const template = new RecipeTemplate(container, collection, showMessage)
template.render()
