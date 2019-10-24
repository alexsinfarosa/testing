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

  //Add your search logic here.
  // const customFilter = (option, searchText) => {
  //   console.log(option, searchText)
  //   if (option.data.value.toLowerCase() === searchText) {
  //     return true
  //   } else {
  //     return false
  //   }
  // }

  const stationsFormatted = stations.map(stn => {
    return { ...stn, value: stn.id, label: `${stn.name}, ${stn.state}` }
  })

  // const options = stationsFormatted.map(stn => {
  //   const Item = ({ stn }) => (
  //     <div style={{ display: "flex", justifyContent: "space-between" }}>
  //       <span>
  //         {stn.label},{" "}
  //         <span
  //           style={{
  //             fontWeight: "bold",
  //             fontStyle: "italic",
  //             fontSize: "0.8rem",
  //           }}
  //         >
  //           {stn.state}
  //         </span>
  //       </span>
  //       <span
  //         style={{ textAlign: "right", color: "#CCCCCC", fontSize: "0.8rem" }}
  //       >
  //         {stn.network}
  //       </span>
  //     </div>
  //   )

  //   return { value: stn.id, label: <Item stn={stn}></Item> }
  // })

  return (
    <div
      style={{
        padding: 24,
      }}
    >
      <div style={{ margin: "auto", width: 400, marginBottom: 48 }}>
        <Select
          placeholder={"Select or Search a Station..."}
          name="stations"
          isSearchable
          isClearable
          isLoading={selectedStation.isLoading}
          options={stationsFormatted}
          onChange={handleChange}
          autoFocus
          loadingMessage={() => "Loading data"}
          // filterOption={customFilter}
          theme={theme => ({
            ...theme,
            borderRadius: 20,
            colors: {
              ...theme.colors,
              // primary25: "orange",
              // primary: "black",
            },
          })}
        ></Select>
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
