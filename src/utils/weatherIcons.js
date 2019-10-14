export default function(icon) {
  switch (icon) {
    case "clear-day":
      return "sun"
    case "clear-night":
      return "moon"
    case "cloudy":
      return "clouds"
    case "fog":
      return "fog"
    case "partly-cloudy-day":
      return "cloud-sun"
    case "partly-cloudy-night":
      return "cloud-moon"
    case "rain":
      return "cloud-rain"
    case "sleet":
      return "sleet"
    case "snow":
      return "snowflakes"
    case "wind":
      return "wind"
    default:
      break
  }
}
