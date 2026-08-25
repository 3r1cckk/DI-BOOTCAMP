class GameOfLife:
	"""Conway's Game of Life on a fixed or automatically expanding board."""

	def __init__(self, initial_grid, expandable=False, max_size=10_000):
		if not initial_grid or not all(initial_grid):
			raise ValueError("initial_grid must be a non-empty rectangular grid")
		if not all(len(row) == len(initial_grid[0]) for row in initial_grid):
			raise ValueError("initial_grid must be rectangular")
		if max_size <= 0:
			raise ValueError("max_size must be positive")

		self.grid = [[bool(cell) for cell in row] for row in initial_grid]
		self.expandable = expandable
		self.max_size = max_size

	@property
	def height(self):
		return len(self.grid)

	@property
	def width(self):
		return len(self.grid[0])

	def _live_neighbours(self, row, column):
		live_count = 0
		for row_offset in (-1, 0, 1):
			for column_offset in (-1, 0, 1):
				if row_offset == 0 and column_offset == 0:
					continue
				neighbour_row = row + row_offset
				neighbour_column = column + column_offset
				if (
					0 <= neighbour_row < self.height
					and 0 <= neighbour_column < self.width
					and self.grid[neighbour_row][neighbour_column]
				):
					live_count += 1
		return live_count

	def _expand_if_needed(self):
		if not self.expandable:
			return

		needs_top = any(self.grid[0])
		needs_bottom = any(self.grid[-1])
		needs_left = any(row[0] for row in self.grid)
		needs_right = any(row[-1] for row in self.grid)
		new_height = self.height + int(needs_top) + int(needs_bottom)
		new_width = self.width + int(needs_left) + int(needs_right)

		if new_height > self.max_size or new_width > self.max_size:
			raise OverflowError("maximum board size reached")

		if needs_top:
			self.grid.insert(0, [False] * self.width)
		if needs_bottom:
			self.grid.append([False] * self.width)
		if needs_left:
			for row in self.grid:
				row.insert(0, False)
		if needs_right:
			for row in self.grid:
				row.append(False)

	def next_generation(self):
		"""Advance the board by one generation and return a copy of the grid."""
		next_grid = []
		for row in range(self.height):
			next_row = []
			for column in range(self.width):
				neighbours = self._live_neighbours(row, column)
				is_alive = self.grid[row][column]
				next_row.append(neighbours == 3 or (is_alive and neighbours == 2))
			next_grid.append(next_row)

		self.grid = next_grid
		self._expand_if_needed()
		return [row[:] for row in self.grid]

	def display(self):
		"""Print live cells as O and dead cells as a blank space."""
		for row in self.grid:
			print(" ".join("O" if cell else "." for cell in row))

	def run(self, generations, display=True):
		if generations < 0:
			raise ValueError("generations must not be negative")

		for generation in range(generations + 1):
			if display:
				print(f"Generation {generation}")
				self.display()
			if generation < generations:
				self.next_generation()


BLINKER = [
	[False, False, False, False, False],
	[False, False, True, False, False],
	[False, False, True, False, False],
	[False, False, True, False, False],
	[False, False, False, False, False],
]

BLOCK = [
	[False, False, False, False],
	[False, False, True, True],
	[False, False, True, True],
	[False, False, False, False],
]

GLIDER = [
	[False, True, False, False, False],
	[False, False, True, False, False],
	[True, True, True, False, False],
	[False, False, False, False, False],
	[False, False, False, False, False],
]


if __name__ == "__main__":
	print("Blinker")
	GameOfLife(BLINKER).run(2)

	print("\nBlock")
	GameOfLife(BLOCK).run(2)

	print("\nExpandable glider")
	GameOfLife(GLIDER, expandable=True).run(4)
