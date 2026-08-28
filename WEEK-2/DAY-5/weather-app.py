import os
from collections import defaultdict
from datetime import datetime


def get_api_key():
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Set your OpenWeatherMap API key first: "
            "$env:OPENWEATHER_API_KEY = 'your-api-key'"
        )
    return api_key


def create_managers():
    try:
        import pyowm
    except ImportError as error:
        raise RuntimeError(
            "Install PyOWM with: pip install pyowm matplotlib"
        ) from error

    open_weather_map = pyowm.OWM(get_api_key())
    return open_weather_map.weather_manager(), open_weather_map.airpollution_manager()


def find_city_id(weather_manager, location):
    matches = weather_manager.city_id_registry().ids_for(location)
    if not matches:
        raise ValueError(f"No city found for '{location}'.")

    first_match = matches[0]
    return first_match[0] if isinstance(first_match, tuple) else first_match


def format_time(value):
    return value.strftime("%Y-%m-%d %H:%M")


def display_weather(weather, city_name):
    temperature = weather.temperature("celsius")
    wind = weather.wind()

    print(f"\nCurrent weather in {city_name}")
    print(f"Condition: {weather.detailed_status.title()}")
    print(f"Temperature: {temperature['temp']:.1f} C")
    print(f"Feels like: {temperature.get('feels_like', temperature['temp']):.1f} C")
    print(f"Humidity: {weather.humidity}%")
    print(f"Wind: {wind.get('speed', 0):.1f} m/s, direction {wind.get('deg', 0)} degrees")
    print(f"Sunrise: {format_time(weather.sunrise_time())}")
    print(f"Sunset: {format_time(weather.sunset_time())}")


def show_current_weather(weather_manager, city_name):
    city_id = find_city_id(weather_manager, city_name)
    weather = weather_manager.weather_at_id(city_id).weather
    display_weather(weather, city_name)
    return city_id


def show_forecast(weather_manager, city_name):
    city_id = find_city_id(weather_manager, city_name)
    forecast = weather_manager.forecast_at_id(city_id, "3h")
    by_day = defaultdict(list)

    for weather in forecast.forecast.weathers:
        by_day[weather.reference_time("date").date()].append(weather)

    print(f"\nFive-day forecast for {city_name}")
    for day, readings in list(by_day.items())[:5]:
        temperatures = [reading.temperature("celsius")["temp"] for reading in readings]
        conditions = readings[0].detailed_status.title()
        print(
            f"{day}: {conditions}, "
            f"{min(temperatures):.1f} to {max(temperatures):.1f} C"
        )


def show_air_pollution(weather_manager, air_pollution_manager, city_name):
    city_id = find_city_id(weather_manager, city_name)
    weather = weather_manager.weather_at_id(city_id).weather
    air_quality = air_pollution_manager.air_quality_at_coords(
        weather.lat, weather.lon
    )

    print(f"\nAir pollution in {city_name}")
    print(f"Air Quality Index: {air_quality.get_air_quality()}")
    print(f"Pollutants: {air_quality.get_pollutants()}")


def init_plot(axis):
    axis.set_ylabel("Humidity (%)")
    axis.set_title("Three-day humidity forecast")
    axis.set_ylim(0, 100)
    axis.grid(axis="y", alpha=0.25)


def write_humidity_on_bar_chart(axis, bars, humidities):
    for bar, humidity in zip(bars, humidities):
        axis.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 2,
            f"{humidity}%",
            ha="center",
        )


def plot_temperatures(weather_manager, city_name):
    try:
        import matplotlib.pyplot as plt
    except ImportError as error:
        raise RuntimeError(
            "Install Matplotlib with: pip install matplotlib"
        ) from error

    city_id = find_city_id(weather_manager, city_name)
    forecast = weather_manager.forecast_at_id(city_id, "3h")
    readings = forecast.forecast.weathers[:24]
    labels = [
        reading.reference_time("date").strftime("%a %H:%M")
        for reading in readings
    ]
    humidities = [reading.humidity for reading in readings]

    figure, axis = plt.subplots(figsize=(12, 5))
    init_plot(axis)
    bars = axis.bar(labels, humidities, color="#2a9d8f")
    write_humidity_on_bar_chart(axis, bars, humidities)
    axis.tick_params(axis="x", rotation=60)
    figure.tight_layout()
    plt.show()


def get_city_name():
    while True:
        city_name = input("Enter a city: ").strip()
        if city_name:
            return city_name
        print("Please enter a city name.")


def main():
    try:
        weather_manager, air_pollution_manager = create_managers()
    except RuntimeError as error:
        print(error)
        return

    city_name = "Paris"
    while True:
        print("\nWeather App")
        print(f"Current city: {city_name}")
        print("1. Show current weather")
        print("2. Choose another city")
        print("3. Show five-day forecast")
        print("4. Show air pollution")
        print("5. Show humidity chart")
        print("6. Exit")
        choice = input("Choose an option: ").strip()

        try:
            if choice == "1":
                show_current_weather(weather_manager, city_name)
            elif choice == "2":
                city_name = get_city_name()
                show_current_weather(weather_manager, city_name)
            elif choice == "3":
                show_forecast(weather_manager, city_name)
            elif choice == "4":
                show_air_pollution(weather_manager, air_pollution_manager, city_name)
            elif choice == "5":
                plot_temperatures(weather_manager, city_name)
            elif choice == "6":
                print("Goodbye!")
                break
            else:
                print("Please choose an option from 1 to 6.")
        except (ValueError, RuntimeError, KeyError) as error:
            print(f"Error: {error}")


if __name__ == "__main__":
    main()