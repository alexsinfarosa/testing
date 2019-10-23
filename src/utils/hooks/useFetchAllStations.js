import React from "react"
import axios from "axios"
import dataFetchReducer from "../reducers/dataFetchReducer"

export default function useFetchAllStations() {
  const [state, dispatch] = React.useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: [],
  })

  React.useEffect(() => {
    let didCancel = false

    const fetchData = async () => {
      dispatch({ type: "FETCH_INIT" })
      try {
        const result = await axios.get(
          `${window.location.protocol}//newa2.nrcc.cornell.edu/newaUtil/stateStationList/all`
        )

        // const xxx = result.data.stations.filter(
        //   s => s.network === "newa" && s.state === "NY"
        // )
        // console.log(xxx)
        if (!didCancel) {
          dispatch({
            type: "FETCH_SUCCESS",
            payload: result.data.stations,
          })
        }
      } catch (error) {
        if (!didCancel) {
          dispatch({ type: "FETCH_FAILURE" })
        }
      }
    }

    fetchData()

    return () => {
      didCancel = true
    }
  }, [])

  return { ...state }
}
