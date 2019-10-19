import axios from "axios"
import axiosWithDelimiter from "./axiosWithDelimiter"

import { format, addDays, isSameYear } from "date-fns"
import cleanFetchedData from "./cleanFetchedData"
import { formatIdNetwork, rhAdjustmentICAOStations } from "./utils"

const protocol = window.location.protocol

const errorFromAcis = data => {
  const keyList = Object.keys(data)
  if (keyList.includes("error")) {
    console.error("ACIS returned an error")
  }
  return data
}

// Fetch selected station hourly data ---------------------------------------------------
export const fetchCurrentStationHourlyData = params => {
  const url = `${protocol}//data.rcc-acis.org/StnData`
  return axios
    .post(url, params)
    .then(res => errorFromAcis(res.data))
    .catch(err => console.log("Failed to load station data ", err))
}

// Fetch sister station Id and network -----------------------------------------------------
const fetchSisterStationIdAndNetwork = params => {
  const url = `${protocol}//newa2.nrcc.cornell.edu/newaUtil/stationSisterInfo`
  const [id, network] = params.sid.split(" ")
  return axios(`${url}/${id}/${network}`)
    .then(res => formatIdNetwork(res.data, params.eleList))
    .catch(err =>
      console.log("Failed to load sister station id and network", err)
    )
}

// Fetch sister station hourly data --------------------------------------------------------
export const fetchSisterStationHourlyData = async (params, idAndNetwork) => {
  const url = `${protocol}//data.rcc-acis.org/StnData`

  let req = Object.keys(idAndNetwork).map(idNet => {
    let currentParams = { ...params }
    currentParams.sid = idNet
    return axiosWithDelimiter
      .post(url, currentParams)
      .then(res => {
        // console.log(res.data.data)
        return res.data.data.map(day =>
          idAndNetwork[idNet].map(idx => [idx, day[idx]])
        )
      })
      .catch(err => console.log("Failed to load sister station data ", err))
  })

  const stns = await Promise.all(req)

  let res = new Array(stns[0].length).fill([])
  stns.forEach(stn =>
    stn.map((day, i) => day.map(el => (res[i][el[0]] = el[1])))
  )
  if (params.network === "newa") {
    console.log("get inside")
    // get rhum index
    const rhumIdx = params.eleList.findIndex(el => el === "rhum")
    if (rhumIdx !== -1) {
      res.forEach(
        row => (row[rhumIdx + 1] = rhAdjustmentICAOStations(row[rhumIdx + 1]))
      )
    }
  }
  console.log(res)
  return res
}

// Fetch forecast hourly data --------------------------------------------------------------
const fetchHourlyForcestData = async params => {
  const url = `${protocol}//newa2.nrcc.cornell.edu/newaUtil/getFcstData`
  // always need to add 5 days
  const plusFiveDays = format(addDays(new Date(), 5), "yyyy-MM-dd")
  const [id, network] = params.sid.split(" ")

  let req = params.eleList.map(el =>
    axiosWithDelimiter
      .get(`${url}/${id}/${network}/${el}/${params.sdate}/${plusFiveDays}`)
      .then(res => {
        // console.log(res.data)
        return [el, res.data]
      })
      .catch(err =>
        console.log(`Failed to load ${el} hourly forecast data`, err)
      )
  )

  const data = await Promise.all(req)
  console.log(data)
  let results = data[0].data

  data.forEach((el, i) => {
    if (i > 0) {
      el.data.forEach((day, t) => {
        results[t].push(day[1])
      })
    }
  })
  // console.log(results)
  return results
}

// Main Function
export default async params => {
  // console.log(params)
  let results = {}

  // get current station hourly data
  const currentStation = await fetchCurrentStationHourlyData(params)

  // get sister station id and network
  const sisterStationIdAndNetworks = await fetchSisterStationIdAndNetwork(
    params
  )

  // get sister station hourly data
  const sisterStation = await fetchSisterStationHourlyData(
    params,
    sisterStationIdAndNetworks
  )

  if (isSameYear(new Date(), new Date(params.edate))) {
    // get forecast hourly data
    const forecastData = await fetchHourlyForcestData(params)
    results["forecast"] = forecastData
  }

  results["currentStn"] = currentStation.data
  results["tzo"] = currentStation.meta.tzo
  results["sisterStn"] = sisterStation

  // clean data
  console.log(results, params)
  const cleaned = cleanFetchedData(results, params)

  // console.log(cleaned)
  return cleaned
}
