import {
  averageMissingValues,
  flatten,
  addHourToDate,
  formatTime,
  rhAdjustmentICAOStations,
} from "./utils"

export default (acisData, params) => {
  const { currentStn, sisterStn, forecast, tzo } = acisData
  let data = params.eleList.map((el, i) => {
    let results = []

    // current station -------------------------
    const currentStnValues = averageMissingValues(
      flatten(currentStn.map(arr => arr[i + 1]))
    )

    // sister station ---------------------------
    if (sisterStn) {
      // console.log(sisterStn)
      // relative humidity adjustments for icao stations
      // if (params.eleList.includes("rhum")) {
      // const rhum = sisterStn.map(d => {
      //   return rhAdjustmentICAOStations(d[2])
      // })
      // }

      const sisterStnValues = averageMissingValues(
        flatten(sisterStn.map(arr => arr[i + 1]))
      )
      // replace missing values with sister station
      results = currentStnValues.map((val, j) =>
        val === "M" ? sisterStnValues[j] : val
      )
    }

    // forecast -----------------------------------
    if (forecast) {
      const forecastValues = flatten(forecast.map(arr => arr[i + 1]))
      // replace missing values with forecast data. Adding 5 days as well
      results = [...results, ...new Array(120).fill("M")]
      results = results.map((val, j) => (val === "M" ? forecastValues[j] : val))
    }

    return results
  })

  // dates --------------------
  let dates = currentStn.map(d => d[0])

  if (forecast) {
    dates = forecast.map(d => d[0])
  }
  const hourlyDates = dates
    .map(date => addHourToDate(date))
    .reduce((acc, results) => [...acc, ...results], [])
  data = [hourlyDates, ...data]

  // Shifting one hour forward (from UTC to local time)
  // and selecting the range of dates: (from yyyy-01-01 00:00 to current date + 5)
  const shifted = data.map((arr, i) => {
    if (i !== 0) {
      // weather parameters
      return [arr[23], ...arr.slice(24, -1)]
    }
    // dates
    return [arr[24], ...arr.slice(25)]
  })

  // convert UTC dates to DST
  const datesWithDST = shifted[0].map((date, i) => {
    const dd = date.split(" ")
    const ddd = dd[0]
    const hour = Number(dd[1].slice(0, 2))

    return formatTime(ddd, hour, tzo)
  })

  const hourlyData = datesWithDST.map((date, i) => {
    let arr = [date]
    shifted.slice(1).forEach(el => arr.push(Number(el[i])))
    return arr
  })

  let dailyData = []
  hourlyData.forEach(hour => {
    const h = Number(hour[0].slice(11, 13))
    if (h === 0) {
      let p = []
      p.push(hour[0].slice(0, 10))
      params.eleList.forEach((el, j) => {
        p.push([hour[j + 1]])
      })
      dailyData.push(p)
    } else {
      const index = dailyData.length - 1
      params.eleList.forEach((el, j) => {
        dailyData[index][j + 1].push(hour[j + 1])
      })
    }
  })

  // console.log(dailyData)
  return { dailyData, hourlyData }
}
