import React from "react"

import fetchData from "../utils/fetchData"
import useFetchAllStations from "../utils/hooks/useFetchAllStations"

import { setParams } from "../utils/utils"
import { format } from "date-fns"
import dataFetchReducer from "../utils/reducers/dataFetchReducer"

import Select from "react-select"
import Table from "../components/table"

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

  const [stn, setStn] = React.useState(null)

  const fetchHourlyData = async stn => {
    const sdate = `${new Date().getFullYear() - 1}-12-31`
    const edate = `${format(new Date(), "yyyy-MM-dd")}`
    const eleList = ["temp", "rhum", "pcpn"]
    const params = setParams(stn, sdate, edate, eleList)
    setStn(params)

    dispatchSelectedStation({ type: "FETCH_INIT" })
    try {
      const res = await fetchData(params, stations)
      console.log(res)
      dispatchSelectedStation({
        type: "FETCH_SUCCESS",
        payload: res,
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
    const Item = ({ stn }) => (
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>
          {stn.name},{" "}
          <span
            style={{
              fontWeight: "bold",
              fontStyle: "italic",
              fontSize: "0.8rem",
            }}
          >
            {stn.state}
          </span>
        </span>
        <span
          style={{ textAlign: "right", color: "#CCCCCC", fontSize: "0.8rem" }}
        >
          {stn.network}
        </span>
      </div>
    )

    return { value: stn.id, label: <Item stn={stn}></Item> }
  })
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 24,
      }}
    >
      <div style={{ width: 400, marginBottom: 148, background: "pink" }}>
        <Select options={options} onChange={handleChange} autoFocus></Select>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          {selectedStation.data && <Table data={selectedStation.data}></Table>}
        </div>
        <div>{stn && <pre>{JSON.stringify(stn, null, 2)}</pre>}</div>
      </div>
    </div>
  )
}

export default IndexPage
