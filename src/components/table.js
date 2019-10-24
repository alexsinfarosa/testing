import React from "react"
import BaseTable, { Column } from "react-base-table"
import "react-base-table/styles.css"

const Table = ({ data }) => {
  return (
    <div>
      <BaseTable
        data={data.hourlyDataDST}
        width={600}
        height={1200}
        rowKey="date"
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
