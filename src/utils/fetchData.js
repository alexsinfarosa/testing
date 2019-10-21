import axios from "axios"
import axiosWithDelimiter from "./axiosWithDelimiter"

import { format, addDays, isSameYear } from "date-fns"
import cleanFetchedData from "./cleanFetchedData"
import {
  formatIdNetwork,
  rhAdjustmentICAOStations,
  arrToObj,
  setParams,
} from "./utils"

const protocol = window.location.protocol

const errorFromAcis = acis => {
  const keyList = Object.keys(acis)
  if (keyList.includes("error")) {
    throw new Error("ACIS returned an error")
  }
  return acis
}

// Fetch selected station hourly data ---------------------------------------------------
export const fetchCurrentStationHourlyData = params => {
  const url = `${protocol}//data.rcc-acis.org/StnData`
  return axios
    .post(url, params)
    .then(res => arrToObj(errorFromAcis(res.data), params.eleList))
    .catch(err => console.log("Failed to load station data ", err))
}

// Fetch sister station Id and network -----------------------------------------------------
const fetchSisterStationIdAndNetwork = params => {
  const { id, network } = params
  const url = `${protocol}//newa2.nrcc.cornell.edu/newaUtil/stationSisterInfo`
  return axios(`${url}/${id}/${network}`)
    .then(res => formatIdNetwork(res.data, params.eleList))
    .catch(err =>
      console.log("Failed to load sister station id and network", err)
    )
}

// Fetch sister station hourly data --------------------------------------------------------
export const fetchSisterStationHourlyData = async (
  params,
  idAndNetwork,
  allStations
) => {
  const url = `${protocol}//data.rcc-acis.org/StnData`

  let sisStations = []
  for (let [key, val] of Object.entries(idAndNetwork)) {
    const [id, network] = key.split(" ")
    allStations.forEach(stn => {
      if (stn.id === id && stn.network === network) {
        const sisStn = setParams(stn, params.sdate, params.edate, val)
        sisStations.push(sisStn)
      }
    })
  }

  let req = sisStations.map(stn => {
    return axiosWithDelimiter
      .post(url, stn)
      .then(res => arrToObj(errorFromAcis(res.data), stn.eleList))
      .catch(err => console.log("Failed to load sister station data ", err))
  })

  const res = await Promise.all(req)
  if (res.length > 1) {
    let first = [...res[0]]
    res.slice(1)[0].forEach((day, i) => {
      delete day.date
      first[i] = { ...first[i], ...day }
    })
    return first
  } else {
    return res[0]
  }
}

// Fetch forecast hourly data --------------------------------------------------------------
const fetchHourlyForcestData = async params => {
  const url = `${protocol}//newa2.nrcc.cornell.edu/newaUtil/getFcstData`
  // always need to add 5 days
  const plusFiveDays = format(addDays(new Date(), 5), "yyyy-MM-dd")
  const [id, network] = params.sid.split(" ")

  let elements = [...params.eleList, "pop"]

  let req = elements.map(el =>
    axiosWithDelimiter
      .get(`${url}/${id}/${network}/${el}/${params.sdate}/${plusFiveDays}`)
      .then(res => {
        // console.log(res.data)
        let data = res.data.data
        if (el === "rhum") {
          data = res.data.data.map(day => [
            day[0],
            rhAdjustmentICAOStations(day[1]),
          ])
        }

        return [el, data]
      })
      .catch(err =>
        console.log(`Failed to load ${el} hourly forecast data`, err)
      )
  )

  const data = await Promise.all(req)

  let results = new Array(data[0][1].length)
    .fill([])
    .map(d => new Array(elements.length + 1).fill([]))

  data.forEach((el, j) => {
    const idx = elements.findIndex(e => e === el[0])
    if (idx !== -1 && el[1].length !== 0) {
      if (j === 0) {
        data[0][1].forEach((d, i) => (results[i][0] = el[1][i][0]))
      }
      data[0][1].forEach((d, i) => (results[i][idx + 1] = el[1][i][1]))
    }
  })

  // console.log(results)
  return results
}

// Main Function
export default async (params, allStations) => {
  // console.log(params)
  let results = {}

  // get current station hourly data
  const currentStation = await fetchCurrentStationHourlyData(params)
  console.log({ currentStation })

  // get sister station id and network
  const sisterStationIdAndNetworks = await fetchSisterStationIdAndNetwork(
    params
  )

  // get sister station hourly data
  const sisterStation = await fetchSisterStationHourlyData(
    params,
    sisterStationIdAndNetworks,
    allStations
  )
  console.log({ sisterStation })

  if (isSameYear(new Date(), new Date(params.edate))) {
    // get forecast hourly data
    const forecastData = await fetchHourlyForcestData(params)
    results["forecast"] = forecastData
  }

  results["currentStn"] = currentStation.data
  results["tzo"] = currentStation.meta.tzo
  results["sisterStn"] = sisterStation

  // clean data
  // console.log(results, params)
  const cleaned = cleanFetchedData(results, params)

  // console.log(cleaned)
  return cleaned
}
