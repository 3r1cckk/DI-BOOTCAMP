import math


class Pagination:
	def __init__(self, items=None, page_size=10):
		if isinstance(page_size, bool) or not isinstance(page_size, int) or page_size <= 0:
			raise ValueError("page_size must be a positive integer")

		self.items = [] if items is None else list(items)
		self.page_size = page_size
		self.current_idx = 0
		self.total_pages = math.ceil(len(self.items) / self.page_size)

	def get_visible_items(self):
		start = self.current_idx * self.page_size
		end = start + self.page_size
		return self.items[start:end]

	def go_to_page(self, page_num):
		if (
			isinstance(page_num, bool)
			or not isinstance(page_num, int)
			or page_num < 1
			or page_num > self.total_pages
		):
			raise ValueError("page_num is out of range")
		self.current_idx = page_num - 1
		return self

	def first_page(self):
		if self.total_pages:
			self.current_idx = 0
		return self

	def last_page(self):
		if self.total_pages:
			self.current_idx = self.total_pages - 1
		return self

	def next_page(self):
		if self.current_idx < self.total_pages - 1:
			self.current_idx += 1
		return self

	def previous_page(self):
		if self.current_idx > 0:
			self.current_idx -= 1
		return self

	def __str__(self):
		return "\n".join(str(item) for item in self.get_visible_items())

	# CamelCase aliases for the chaining form from the exercise.
	def getVisibleItems(self):
		return self.get_visible_items()

	def nextPage(self):
		return self.next_page()

	def previousPage(self):
		return self.previous_page()

	def firstPage(self):
		return self.first_page()

	def lastPage(self):
		return self.last_page()


if __name__ == "__main__":
	alphabet_list = list("abcdefghijklmnopqrstuvwxyz")
	pagination = Pagination(alphabet_list, 4)

	print(pagination.get_visible_items())
	pagination.next_page()
	print(pagination.get_visible_items())
	pagination.last_page()
	print(pagination.get_visible_items())
	print(str(Pagination(alphabet_list, 4)))
	print(
		Pagination(alphabet_list, 4)
		.nextPage()
		.nextPage()
		.nextPage()
		.getVisibleItems()
	)
