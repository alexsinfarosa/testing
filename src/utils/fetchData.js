import axios from "axios"
import axiosWithDelimiter from "./axiosWithDelimiter"

import { format, addDays, isSameYear } from "date-fns"
import cleanFetchedData from "./cleanFetchedData"
import { formatIdNetwork, arrToObj, arrToObjForecast, setParams } from "./utils"

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
    .then(res => {
      // console.log(res.data)
      return arrToObj(errorFromAcis(res.data), params.eleList)
    })
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
      .then(res => {
        // console.log(res.data)
        return arrToObj(errorFromAcis(res.data), stn.eleList)
      })
      .catch(err => console.log("Failed to load sister station data ", err))
  })

  const res = await Promise.all(req)
  if (res.length > 1) {
    let first = [...res[0].data]
    res.slice(1)[0].data.forEach((day, i) => {
      delete day.date
      first[i] = { ...first[i], ...day }
    })
    return first
  } else {
    return res[0].data
  }
}

// Fetch forecast hourly data --------------------------------------------------------------
const fetchHourlyForecastData = async params => {
  const url = `${protocol}//newa2.nrcc.cornell.edu/newaUtil/getFcstData`
  // always need to add 5 days
  const plusFiveDays = format(addDays(new Date(), 5), "yyyy-MM-dd")
  const { id, network } = params

  let forecastElementList = [...params.eleList]
  if (forecastElementList.includes("pcpn")) {
    forecastElementList = [
      ...forecastElementList.filter(e => e !== "pcpn"),
      "pop12",
      "qpf",
    ]
  }

  let req = forecastElementList.map(el =>
    axiosWithDelimiter
      .get(`${url}/${id}/${network}/${el}/${params.sdate}/${plusFiveDays}`)
      .then(res => {
        // console.log(el, res.data)
        return arrToObjForecast(errorFromAcis(res.data), el)
      })
      .catch(err =>
        console.log(`Failed to load ${el} hourly forecast data`, err)
      )
  )

  const res = await Promise.all(req)
  if (res.length > 1) {
    let first = [...res[0]]
    res.slice(1).forEach(stn => {
      stn.forEach((day, j) => {
        delete day.date
        first[j] = { ...first[j], ...day }
      })
    })
    return first
  } else {
    return res[0]
  }
}

// Main Function
export default async (params, allStations) => {
  let results = {}

  // get current station hourly data
  const currentStation = await fetchCurrentStationHourlyData(params)
  results["currentStn"] = currentStation.data
  results["tzo"] = currentStation.meta.tzo

  // get sister station id and network
  const sisterStationIdAndNetworks = await fetchSisterStationIdAndNetwork(
    params
  )

  // get sister station hourly data
  const sisterStn = await fetchSisterStationHourlyData(
    params,
    sisterStationIdAndNetworks,
    allStations
  )
  results["sisterStn"] = sisterStn

  if (isSameYear(new Date(), new Date(params.edate))) {
    // get forecast hourly data
    results["forecast"] = await fetchHourlyForecastData(params)
  }

  // clean data
  console.log(results)
  const cleaned = cleanFetchedData(results, params)

  // console.log(cleaned)
  return cleaned
}
