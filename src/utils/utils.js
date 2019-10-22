import moment from "moment-timezone"
import vXdef from "../utils/vXdef.json"
import invertBy from "lodash.invertby"

export const arrToObj = (acis, eleList) => {
  const { meta, data } = acis
  const res = data.map(day => {
    let p = { date: day[0] }
    day.slice(1).map((el, i) => (p[eleList[i]] = el))
    return p
  })
  return { meta, data: res }
}

export const arrToObjForecast = (acis, element) => {
  return acis.data.map(day => {
    return { date: day[0], [element]: day[1] }
  })
}

export const setParams = (stn, sdate, edate, eleList) => {
  const vX = JSON.parse(JSON.stringify(vXdef)).find(
    e => e.network === stn.network
  )
  delete vX["network"]

  const sid = `${stationIdAdjustment(stn)} ${stn.network}`

  const elems = eleList.map(el => {
    if (el === "temp") {
      return { vX: vX[el], prec: 1, units: "degreeF" }
    } else if (el === "rhum") {
      return { vX: vX[el] }
    } else {
      return { vX: vX[el] }
    }
  })

  return {
    ...stn,
    sid,
    meta: "tzo",
    sdate,
    edate,
    elems,
    eleList,
  }
}

export const calculateGdd = (dailyData, base = 50) => {
  let cdd = 0

  return dailyData.map(obj => {
    const { date, temps } = obj
    const countMissingValues = temps.filter(t => isNaN(t) || t === "M").length
    let p = {}

    if (countMissingValues < 5) {
      const filtered = temps.filter(d => d)
      const min = Math.min(...filtered)
      const max = Math.max(...filtered)
      const avg = (min + max) / 2

      const dd = avg - base > 0 ? avg - base : 0

      cdd += dd
      p.missingData = false
      p.date = date
      p.min = min
      p.avg = avg
      p.max = max
      p.dd = dd
      p.cdd = cdd
    } else {
      p.missingData = true
      p.date = date
      p.min = "N/A"
      p.avg = "N/A"
      p.max = "N/A"
      p.dd = "N/A"
      p.cdd = "N/A"
    }
    // console.log(p, missingDays)
    return { ...p }
  })
}

/////////////////////////////////////////////////////////
// Handling Relative Humidity Adjustment for ICAO stations
export const rhAdjustmentICAOStations = rhArrValues =>
  rhArrValues.map(rh => {
    const val = (Number(rh) / (0.0047 * Number(rh) + 0.53)).toFixed(0)
    return rh === "M" ? rh : typeof rh === "string" ? val : Number(val)
  })

/////////////////////////////////////////////////////////

// Handling station ID adjustment for some networks or states
export const stationIdAdjustment = stn => {
  // Michigan
  if (
    stn.state === "MI" &&
    stn.network === "miwx" &&
    stn.id.slice(0, 3) === "ew_"
  ) {
    // example: ew_ITH
    return stn.id.slice(3, 6)
  }

  // NY mesonet
  if (
    stn.state === "NY" &&
    stn.network === "nysm" &&
    stn.id.slice(0, 5) === "nysm_"
  ) {
    // example: nysm_spra
    return stn.id.slice(5, 9)
  }

  return stn.id
}

// // DARKSKY API -------------------------------------------------
// export const fetchDarkSkyAPI = async (lat, lon) => {
//   const removeMe = `https://cors-anywhere.herokuapp.com/` // DEVELOPMENT
//   const url = `${removeMe}https://api.darksky.net/forecast/${process.env.GATSBY_DARK_SKY_KEY}/${lat},${lon}`
//   return axios.get(url)
// }

export const avgTwoStringNumbers = (a, b) => {
  const aNum = parseFloat(a)
  const bNum = parseFloat(b)
  return ((aNum + bNum) / 2).toFixed(1)
}

const weightedMean = res => {
  // ex: [2,M,M,5] => [2,3,45]
  const arr = res.map(d => Number(d))
  const firstM = ((arr[0] + arr[0] + arr[3]) / 3).toPrecision(2)
  const secondM = ((arr[0] + arr[3] + arr[3]) / 3).toPrecision(2)
  return [firstM, secondM]
}

export const averageMissingValues = d => {
  if (d.includes("M")) {
    if (d[0] === "M" && d[1] !== "M") d[0] = d[1]
    if (d[0] === "M" && d[1] === "M" && d[2] !== "M") {
      d[0] = d[2]
      d[1] = d[2]
    }

    const len = d.length - 1
    if (d[len] === "M" && d[len - 1] !== "M") d[len] = d[len - 1]
    if (d[len] === "M" && d[len - 1] === "M" && d[len - 2] !== "M") {
      d[len] = d[len - 2]
      d[len - 1] = d[len - 2]
    }

    return d.map((val, i) => {
      if (d[i - 1] !== "M" && val === "M" && d[i + 1] !== "M") {
        return avgTwoStringNumbers(d[i - 1], d[i + 1])
      }

      if (
        d[i - 1] !== "M" &&
        val === "M" &&
        d[i + 1] === "M" &&
        d[i + 2] !== "M"
      ) {
        const arr = [d[i - 1], d[i], d[i + 1], d[i + 2]]
        const rep = weightedMean(arr)
        val = rep[0]
        d[i + 1] = rep[1]
      }

      return val
    })
  }
  return d
}

export const formatTime = (day, hour, tzo) => {
  var time_zone_name = {
    5: "America/New_York",
    6: "America/Chicago",
    7: "America/Denver",
    8: "America/Los_Angeles",
  }

  return moment
    .utc(day)
    .hour(hour)
    .add(Math.abs(tzo), "hours")
    .tz(time_zone_name[Math.abs(tzo)])
    .format("YYYY-MM-DD HH:00 z")
}

export const addHourToDate = date => {
  const numOfHours = Array.from(new Array(24).keys())
  return numOfHours.map(h => {
    if (h >= 0 && h <= 9) return `${date} 0${h}:00`
    return `${date} ${h}:00`
  })
}

// export const dailyToHourlyDatesLST = (sdate, edate) => {
//   let startDay = sdate
//   let endDay = edate

//   let results = []
//   results.push(startDay)

//   while (isBefore(new Date(startDay), new Date(endDay))) {
//     startDay = addHours(new Date(startDay), 1)
//     if (
//       isBefore(new Date(startDay), new Date(endDay)) ||
//       isEqual(new Date(startDay), new Date(endDay))
//     ) {
//       results.push(startDay)
//     }
//   }
//   return results
// }

// export const dailyToHourlyDates = date => {
//   const numOfHours = dailyToHourlyDatesLST(
//     startOfDay(new Date(date)),
//     endOfDay(new Date(date))
//   )
//   const hoursArr = numOfHours.map(h => getHours(new Date(h)))
//   let results = hoursArr.map(hour => {
//     if (hour >= 0 && hour <= 9) hour = `0${hour}`
//     return `${date} ${hour}:00`
//   })
//   // console.log(results);
//   return results
// }

export const flatten = arr => Array.prototype.concat(...arr)

export const unflatten = array => {
  let res = []
  while (array.length > 0) res.push(array.splice(0, 24))
  return res
}

// Convert Fahrenheit to Celcius
export const fahrenheitToCelcius = (t, missing) =>
  t === missing ? t : ((t - 32) * 5) / 9

// Convert Celcius to Fahrenheit
export const celciusToFahrenheit = (t, missing) =>
  t === missing ? t : t * (9 / 5) + 32

// This formula is used to calculate the growing degree day
export const baskervilleEmin = (min, max, base) => {
  if (min >= base) {
    const avg = (max + min) / 2
    return avg - base
  } else if (max <= base) {
    return 0
  } else {
    const avg = (max + min) / 2
    const amt = (max - min) / 2
    const t1 = Math.sin((base - avg) / amt)
    return avg < 0
      ? 0
      : (amt * Math.cos(t1) - (base - avg) * (3.14 / 2 - t1)) / 3.14
  }
}

export const formatIdNetwork = (dataObj, eleList) => {
  let data = { ...dataObj }

  // replacing old abbreviations with new ones
  if (Object.keys(data).includes("prcp")) {
    data["pcpn"] = data["prcp"]
    delete data["prcp"]
  }

  let inverted = invertBy(data)

  let results = {}
  for (let [key, value] of Object.entries(inverted)) {
    eleList.forEach(el => {
      if (value.includes(el)) {
        const filteredValues = value.filter(el => eleList.includes(el))
        results[key] = filteredValues
      }
    })
  }

  return results
}
