import React from "react"
import BaseTable, { Column } from "react-base-table"
import "react-base-table/styles.css"

const Table = ({ data }) => {
  console.log(data)

  // const overlay = {
  //   background: "lightgray",
  //   position: "absolute",
  //   top: "50%",
  //   left: "50%",
  //   transform: "translateX(-50%) translateY(-50%)",
  //   padding: "5px 15px",
  //   borderRadius: "10px",
  //   color: "red",
  // }

  return (
    <div>
      <BaseTable
        data={data.hourlyDataDST}
        width={600}
        height={1000}
        rowKey="date"
        // overlayRenderer={
        //   <div>
        //     <div style={{ ...overlay }}>Loading...</div>
        //   </div>
        // }
      >
        <Column
          key={"date"}
          dataKey={"date"}
          title="Date"
          width={200}
          align="center"
        />
        <Column
          key={"temp"}
          dataKey={"temp"}
          title="Temp ˚F"
          width={80}
          align="center"
        />
        <Column
          key={"rhum"}
          dataKey={"rhum"}
          title="Rhum %"
          width={80}
          align="center"
        />
        <Column
          key={"pcpn"}
          dataKey={"pcpn"}
          title="Pcpn"
          width={80}
          align="center"
        />
      </BaseTable>
    </div>
  )
}

export default Table
