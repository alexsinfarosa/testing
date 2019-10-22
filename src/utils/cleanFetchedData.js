import { averageMissingValues, formatTime } from "./utils"

export default acisData => {
  const { currentStn, sisterStn, forecast, tzo } = acisData

  // current station -------------------------
  let results = []
  currentStn.forEach(el => {
    let p = { ...el }
    for (let [key, val] of Object.entries(el)) {
      if (key !== "date") {
        p[key] = averageMissingValues(val)
      }
    }
    results.push(p)
  })
  // console.log(results)

  // sister station ---------------------------
  let sisterStnAveraged = []
  if (sisterStn) {
    sisterStn.forEach(el => {
      let p = { ...el }
      for (let [key, val] of Object.entries(el)) {
        if (key !== "date") {
          p[key] = averageMissingValues(val)
        }
      }
      sisterStnAveraged.push(p)
    })
    // console.log(sisterStnAveraged)
  }

  results = results.map((day, i) => {
    for (let [key, val] of Object.entries(day)) {
      if (typeof val !== "string") {
        val.map((d, j) => (d === "M" ? sisterStnAveraged[i][key][j] : d))
      }
      return day
    }
    return day
  })
  // console.log(results)

  // // forecast -----------------------------------
  if (forecast) {
    forecast.slice(-5).forEach(day => results.push(day))
    results = results.map((day, i) => {
      for (let [key, val] of Object.entries(day)) {
        if (typeof val !== "string") {
          val.map((d, j) => (d === "M" ? forecast[i][key][j] : d))
        }
        return day
      }
      return day
    })
  }
  // console.log(results)

  let shifted = [...results]
  shifted.forEach((day, i) => {
    for (let [key, val] of Object.entries(day)) {
      if (i !== shifted.length - 1) {
        if (typeof val !== "string") {
          const last = val.pop()
          shifted[i + 1][key].unshift(last)
        }
      } else {
        if (typeof val !== "string") {
          val.pop()
        }
      }
    }
  })

  let hourlyDataDST = []
  shifted.slice(1).forEach(day => {
    for (let h = 0; h < 24; h++) {
      let p = {}
      for (let [key, val] of Object.entries(day)) {
        if (typeof val === "string") {
          p[key] = formatTime(val, h, tzo)
        } else {
          p[key] = val[h]
        }
      }
      hourlyDataDST.push(p)
    }
  })

  // console.log(hourlyDataDST)

  let dailyDataDST = []
  hourlyDataDST.forEach(day => {
    const h = Number(day["date"].slice(11, 13))
    if (h === 0) {
      let p = {}
      Object.keys(day).forEach(key => {
        p[key] = [day[key][0]]
      })
      p["date"] = day["date"].slice(0, 10)
      dailyDataDST.push(p)
    } else {
      for (let [key, val] of Object.entries(day)) {
        if (key !== "date") {
          dailyDataDST[dailyDataDST.length - 1][key].push(val)
        }
      }
    }
  })
  // console.log(dailyDataDST)
  return { hourlyDataDST, dailyDataDST }
}
