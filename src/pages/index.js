import React from "react"

import fetchData from "../utils/fetchData"
import useFetchAllStations from "../utils/hooks/useFetchAllStations"

import { setParams } from "../utils/utils"
import { format } from "date-fns"
import dataFetchReducer from "../utils/reducers/dataFetchReducer"

const IndexPage = () => {
  // ALL STATIONS ---------------------------------------------------
  const { data: stations, isLoading, isError } = useFetchAllStations()
  const myStation = stations.find(stn => stn.name === "Geneva")
  // const myStation = stations.find(stn => stn.id === "kalb")

  // SLECTED STATION ------------------------------------------------
  const [selectedStation, dispatchSelectedStation] = React.useReducer(
    dataFetchReducer,
    {
      isLoading: false,
      isError: false,
      data: null,
    }
  )

  const fetchHourlyData = async stn => {
    const sdate = `${new Date().getFullYear() - 1}-12-31`
    const edate = `${format(new Date(), "yyyy-MM-dd")}`
    const eleList = ["temp", "rhum", "pcpn"]
    const params = setParams(stn, sdate, edate, eleList)

    dispatchSelectedStation({ type: "FETCH_INIT" })
    try {
      const res = await fetchData(params, stations)
      dispatchSelectedStation({
        type: "FETCH_SUCCESS",
        payload: res,
      })
    } catch (error) {
      dispatchSelectedStation({ type: "FETCH_FAILURE" })
    }
  }

  React.useEffect(() => {
    if (stations.length !== 0) {
      fetchHourlyData(myStation)
    }
  }, [myStation])

  // console.log(selectedStation)
  return (
    <div>
      {isLoading && <div style={{ color: "red" }}>Loading..</div>}
      {isError ? (
        <div>There was an error</div>
      ) : (
        <div>
          <pre>{JSON.stringify(myStation, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default IndexPage
