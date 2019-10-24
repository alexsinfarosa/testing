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
  const { data: stations, isLoading, isError } = useFetchAllStations()

  // SLECTED STATION ------------------------------------------------
  const [selectedStation, dispatchSelectedStation] = React.useReducer(
    dataFetchReducer,
    {
      isLoading: false,
      isError: false,
      data: null,
    }
  )
  // console.log(selectedStation)

  const fetchHourlyData = async stn => {
    const sdate = `${new Date().getFullYear() - 1}-12-31`
    const edate = `${format(new Date(), "yyyy-MM-dd")}`
    const eleList = ["temp", "rhum", "pcpn"]
    const params = setParams(stn, sdate, edate, eleList)

    dispatchSelectedStation({ type: "FETCH_INIT" })
    try {
      const res = await fetchData(params, stations)
      // console.log(res)
      dispatchSelectedStation({
        type: "FETCH_SUCCESS",
        payload: { res, params },
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
        padding: 24,
      }}
    >
      <div style={{ margin: "auto", width: 400, marginBottom: 48 }}>
        <Select options={options} onChange={handleChange} autoFocus></Select>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center" }}>Loading all stations...</div>
      )}

      {isError ? (
        <div>There was an error loading the stations</div>
      ) : (
        <div>
          {selectedStation.isLoading ? (
            <div style={{ textAlign: "center" }}>Loading data...</div>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              {selectedStation.data && (
                <>
                  <Table data={selectedStation.data.res}></Table>

                  <pre>
                    {JSON.stringify(selectedStation.data.params, null, 2)}
                  </pre>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default IndexPage
