import random


class Gene:
	def __init__(self, value=None):
		self.value = random.randint(0, 1) if value is None else self._validate(value)

	@staticmethod
	def _validate(value):
		if value not in (0, 1):
			raise ValueError("A gene must be 0 or 1")
		return value

	def mutate(self):
		self.value = 1 - self.value

	def __repr__(self):
		return str(self.value)


class Chromosome:
	def __init__(self, genes=None):
		self.genes = (
			[Gene() for _ in range(10)]
			if genes is None
			else [gene if isinstance(gene, Gene) else Gene(gene) for gene in genes]
		)
		if len(self.genes) != 10:
			raise ValueError("A chromosome must contain exactly 10 genes")

	def mutate(self):
		mutation_count = random.randint(1, len(self.genes))
		for gene in random.sample(self.genes, mutation_count):
			if random.choice((True, False)):
				gene.mutate()

	def is_all_ones(self):
		return all(gene.value == 1 for gene in self.genes)

	def __repr__(self):
		return "".join(str(gene.value) for gene in self.genes)


class DNA:
	def __init__(self, chromosomes=None):
		self.chromosomes = (
			[Chromosome() for _ in range(10)]
			if chromosomes is None
			else [
				chromosome
				if isinstance(chromosome, Chromosome)
				else Chromosome(chromosome)
				for chromosome in chromosomes
			]
		)
		if len(self.chromosomes) != 10:
			raise ValueError("DNA must contain exactly 10 chromosomes")

	def mutate(self):
		mutation_count = random.randint(1, len(self.chromosomes))
		for chromosome in random.sample(self.chromosomes, mutation_count):
			chromosome.mutate()

	def is_all_ones(self):
		return all(chromosome.is_all_ones() for chromosome in self.chromosomes)

	def count_ones(self):
		return sum(
			gene.value
			for chromosome in self.chromosomes
			for gene in chromosome.genes
		)

	def __repr__(self):
		return "-".join(map(str, self.chromosomes))


class Organism:
	def __init__(self, dna, environment):
		if not isinstance(dna, DNA):
			raise TypeError("dna must be a DNA object")
		if not 0 <= environment <= 1:
			raise ValueError("environment must be between 0 and 1")
		self.dna = dna
		self.environment = environment

	def mutate(self):
		if random.random() < self.environment:
			self.dna.mutate()


def run_experiment(organism_count=20, environment=0.5, max_generations=100_000):
	"""Mutate organisms until one reaches the all-ones DNA or the cap."""
	if organism_count <= 0:
		raise ValueError("organism_count must be positive")

	organisms = [Organism(DNA(), environment) for _ in range(organism_count)]
	for generation in range(max_generations + 1):
		winner = next((organism for organism in organisms if organism.dna.is_all_ones()), None)
		if winner is not None:
			return {
				"organisms": organism_count,
				"environment": environment,
				"generations": generation,
				"winner": winner,
			}
		for organism in organisms:
			organism.mutate()

	return {
		"organisms": organism_count,
		"environment": environment,
		"generations": None,
		"winner": None,
	}


if __name__ == "__main__":
	random.seed(42)
	report = run_experiment()
	print("Personal Biology Research Notebook")
	print("=" * 36)
	print(f"Organisms observed: {report['organisms']}")
	print(f"Mutation probability: {report['environment']}")
	if report["winner"] is None:
		print("Result: no all-ones organism before the generation limit.")
		print("Conclusion: random mutation alone does not reliably reach a "
			  "specific 100-gene target in a practical number of generations.")
	else:
		print(f"Generations: {report['generations']}")
		print(f"Winning DNA: {report['winner'].dna}")
		print("Conclusion: this run produced the target DNA through mutation.")
