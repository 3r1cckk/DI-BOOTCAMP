class BankAccount:
	def __init__(self, balance=0, username="", password=""):
		self.balance = balance
		self.username = username
		self.password = password
		self.authenticated = False

	@staticmethod
	def _validate_amount(amount):
		if isinstance(amount, bool) or not isinstance(amount, int) or amount <= 0:
			raise Exception("Amount must be a positive integer")

	def authenticate(self, username, password):
		if username == self.username and password == self.password:
			self.authenticated = True
			return True
		return False

	def _require_authentication(self):
		if not self.authenticated:
			raise Exception("Account is not authenticated")

	def deposit(self, amount):
		self._require_authentication()
		self._validate_amount(amount)
		self.balance += amount

	def withdraw(self, amount):
		self._require_authentication()
		self._validate_amount(amount)
		self.balance -= amount


class MinimumBalanceAccount(BankAccount):
	def __init__(self, balance=0, username="", password="", minimum_balance=0):
		super().__init__(balance, username, password)
		self.minimum_balance = minimum_balance

	def withdraw(self, amount):
		self._require_authentication()
		self._validate_amount(amount)
		if self.balance - amount < self.minimum_balance:
			raise Exception("Withdrawal would fall below the minimum balance")
		self.balance -= amount


class ATM:
	def __init__(self, account_list, try_limit):
		if not isinstance(account_list, list) or not all(
			isinstance(account, BankAccount) for account in account_list
		):
			raise Exception("account_list must contain bank accounts")

		self.account_list = account_list
		try:
			if isinstance(try_limit, bool) or not isinstance(try_limit, (int, float)):
				raise Exception("try_limit must be a positive number")
			if try_limit <= 0:
				raise Exception("try_limit must be a positive number")
			self.try_limit = try_limit
		except Exception as error:
			print(error)
			self.try_limit = 2

		self.current_tries = 0
		self.running = True
		self.show_main_menu()

	def show_main_menu(self):
		while self.running:
			print("\n1. Log in\n2. Exit")
			choice = input("Choose an option: ").strip()
			if choice == "1":
				username = input("Username: ")
				password = input("Password: ")
				self.log_in(username, password)
			elif choice == "2":
				self.running = False
				print("Goodbye")
			else:
				print("Invalid option")

	def log_in(self, username, password):
		for account in self.account_list:
			if account.authenticate(username, password):
				self.current_tries = 0
				print(f"Welcome, {account.username}")
				self.show_account_menu(account)
				return True

		self.current_tries += 1
		print("Invalid username or password")
		if self.current_tries >= self.try_limit:
			print("You reached the maximum number of tries")
			self.running = False
		return False

	def show_account_menu(self, account):
		while self.running and account.authenticated:
			print("\n1. Deposit\n2. Withdraw\n3. Exit")
			choice = input("Choose an option: ").strip()
			try:
				if choice == "1":
					account.deposit(int(input("Amount: ")))
					print(f"New balance: {account.balance}")
				elif choice == "2":
					account.withdraw(int(input("Amount: ")))
					print(f"New balance: {account.balance}")
				elif choice == "3":
					account.authenticated = False
					print("Logged out")
				else:
					print("Invalid option")
			except (ValueError, Exception) as error:
				print(error)


if __name__ == "__main__":
	account = BankAccount(100, "sara", "secret")
	account.authenticate("sara", "secret")
	account.deposit(50)
	print(f"Balance: {account.balance}")
