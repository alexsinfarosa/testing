import React from "react"

import fetchData from "../utils/fetchData"
import useFetchAllStations from "../utils/hooks/useFetchAllStations"

import { setParams } from "../utils/utils"
import { format } from "date-fns"
import dataFetchReducer from "../utils/reducers/dataFetchReducer"

import Select from "react-select"

const IndexPage = () => {
  // ALL STATIONS ---------------------------------------------------
  const { data: stations } = useFetchAllStations()

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
        payload: { ...params, ...res },
      })
    } catch (error) {
      dispatchSelectedStation({ type: "FETCH_FAILURE", error })
    }
  }

  // console.log(selectedStation)
  const handleChange = stn => {
    const station = stations.find(s => s.id === stn.value)
    fetchHourlyData(station)
  }

  const options = stations.map(stn => {
    return { value: stn.id, label: stn.name }
  })
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: 24,
      }}
    >
      <div style={{ width: 300 }}>
        <Select
          options={options}
          onChange={handleChange}
          autoFocus
          isClearable
          closeMenuOnSelect={false}
        ></Select>
      </div>

      <div
        style={{
          minWidth: 300,
          height: "100vh",
          overflowY: "scroll",
          overflowX: "hidden",
        }}
      >
        <pre>{JSON.stringify(selectedStation, null, 2)}</pre>
      </div>
    </div>
  )
}

export default IndexPage
