import random


# Exercise 1: Temperature
class Temperature:
    def __init__(self, value):
        self.value = value

    def to_celsius(self):
        raise NotImplementedError

    def to_kelvin(self):
        raise NotImplementedError

    def to_fahrenheit(self):
        raise NotImplementedError

    def __str__(self):
        return f"{self.value}"


class Celsius(Temperature):
    def to_celsius(self):
        return self.value

    def to_kelvin(self):
        return self.value + 273.15

    def to_fahrenheit(self):
        return (self.value * 9 / 5) + 32


class Kelvin(Temperature):
    def to_celsius(self):
        return self.value - 273.15

    def to_kelvin(self):
        return self.value

    def to_fahrenheit(self):
        return (self.value - 273.15) * 9 / 5 + 32


class Fahrenheit(Temperature):
    def to_celsius(self):
        return (self.value - 32) * 5 / 9

    def to_kelvin(self):
        return (self.value - 32) * 5 / 9 + 273.15

    def to_fahrenheit(self):
        return self.value


# Demo for temperature conversions
c = Celsius(25)
print(c.to_kelvin())
print(c.to_fahrenheit())

k = Kelvin(300)
print(k.to_celsius())

f = Fahrenheit(77)
print(f.to_celsius())


# Exercise 2: In the Quantum Realm
class QuantumParticle:
    def __init__(self, x=None, y=None, p=None, spin=None):
        self.position_value = x if x is not None else random.randint(1, 10000)
        self.momentum_value = y if y is not None else round(random.uniform(0, 1), 2)
        self.spin_value = p if p is not None else random.choice([0.5, -0.5])
        self.entangled_with = None

    def measure_position(self):
        self.position_value = random.randint(1, 10000)
        self._disturbance()
        return self.position_value

    def measure_momentum(self):
        self.momentum_value = round(random.uniform(0, 1), 2)
        self._disturbance()
        return self.momentum_value

    def measure_spin(self):
        self.spin_value = random.choice([0.5, -0.5])
        self._disturbance()
        if self.entangled_with is not None:
            self.entangled_with.spin_value = -self.spin_value
        return self.spin_value

    def _disturbance(self):
        self.position_value = random.randint(1, 10000)
        self.momentum_value = round(random.uniform(0, 1), 2)
        print('Quantum Interferences!!')

    def entangle(self, other):
        if not isinstance(other, QuantumParticle):
            raise TypeError('A quantum particle can only be entangled to another quantum particle')
        self.entangled_with = other
        other.entangled_with = self
        print('Spooky Action at a Distance !!')
        return 'Particle p1 is now in quantum entanglement with Particle p2'

    def __repr__(self):
        return (
            f"QuantumParticle(position={self.position_value}, "
            f"momentum={self.momentum_value}, spin={self.spin_value})"
        )


# Example usage
p1 = QuantumParticle(x=1, y=5.0, p=0.5)
p2 = QuantumParticle(x=2, y=5.0, p=-0.5)
print(p1.entangle(p2))
print(repr(p1))
