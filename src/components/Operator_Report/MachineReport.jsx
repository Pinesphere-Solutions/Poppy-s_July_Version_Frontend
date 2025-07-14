import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { FaTshirt, FaClock, FaTools, FaDownload } from "react-icons/fa";
import "./MachineStyles.css";
import { useLocation } from "react-router-dom";

const MachineReport = ({ machine_id, fromDate, toDate }) => {
 
  const location = useLocation();
  const [retryCount, setRetryCount] = useState(0); // Add this at the top, after useState declarations

  const [reportData, setReportData] = useState({
    machineId: "",
    totalAvailableHours: 0,
    totalWorkingDays: 0,
    totalHours: 0,
    totalProductiveTime: {
      hours: 0,
      percentage: 0,
    },
    totalNonProductiveTime: {
      hours: 0,
      percentage: 0,
      breakdown: {
        noFeedingHours: 0,
        meetingHours: 0,
        maintenanceHours: 0,
        idleHours: 0,
        reworkHours: 0, // Mode 6
        needleBreakHours: 0, // Mode 7
      },
    },
    totalStitchCount: 0,
    totalNeedleRuntime: 0,
    tableData: [],
    allTableData: [],
  });

  const [tableFilter, setTableFilter] = useState({
    fromDate: "",
    toDate: "",
  });

  const triggerRetry = () => setRetryCount((c) => c + 1);

  useEffect(() => {
    let isMounted = true; // Track if component is still mounted
    if (!machine_id) return;

    const params = new URLSearchParams();
    if (fromDate) params.append("from_date", fromDate);
    if (toDate) params.append("to_date", toDate);

    fetch(
      `https://oceanatlantic.pinesphere.co.in/api/api/machines/${machine_id}/reports/?${params}`
    )
      .then((response) => response.json())
      .then((data) => {
        const allTableData = data.tableData || [];

        setReportData({
          ...data,
          tableData: allTableData,
          allTableData: allTableData,
        });
      })
      .catch((error) => {
        console.error("Error fetching machine report data:", error);
        // Handle error state, e.g., show a message to the user
        // Retry after 2 seconds, up to 5 times
        if (isMounted && retryCount < 5) {
          setTimeout(() => setRetryCount((c) => c + 1), 2000);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [machine_id, fromDate, toDate, location, retryCount]);

  const handleTableFilterChange = (e) => {
    const { name, value } = e.target;
    setTableFilter((prev) => ({ ...prev, [name]: value }));
  };

  const applyTableFilter = () => {
    const filteredData = reportData.allTableData.filter((row) => {
      const rowDate = new Date(row.Date);
      const fromDate = tableFilter.fromDate
        ? new Date(tableFilter.fromDate)
        : null;
      const toDate = tableFilter.toDate ? new Date(tableFilter.toDate) : null;

      let valid = true;
      if (fromDate) valid = valid && rowDate >= fromDate;
      if (toDate) valid = valid && rowDate <= toDate;
      return valid;
    });

    setReportData((prev) => ({
      ...prev,
      tableData: filteredData,
    }));
  };

  const resetTableFilter = () => {
    setTableFilter({ fromDate: "", toDate: "" });
    setReportData((prev) => ({
      ...prev,
      tableData: prev.allTableData,
    }));
  };

  
  /*  const downloadCSV = () => {
    const headers = Object.keys(reportData.tableData[0] || {});
    const csvRows = [
      headers.join(','),
      ...reportData.tableData.map(row => 
        headers.map(header => 
          `"${row[header] !== undefined ? row[header] : ''}"`
        ).join(',')
      )
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `machine_${machine_id}_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }; */

  // Add this function (anywhere above your return)
  // Add this function above your return in MachineReport.jsx

  const downloadCSV = () => {
    const SUMMARY_TABLE_HEADS = [
      { label: "Date", key: "Date" },
      { label: "Machine ID", key: "Machine ID" },
      { label: "Total Hours", key: "Total Hours" },
      { label: "Sewing", key: "Sewing Hours (PT)" },
      { label: "Idle", key: "Idle Hours" },
      { label: "Rework", key: "Rework Hours" },
      { label: "No Feeding", key: "No Feeding Hours" },
      { label: "Meeting", key: "Meeting Hours" },
      { label: "Maintenance", key: "Maintenance Hours" },
      { label: "Needle Break", key: "Needle Break Hours" },
      { label: "PT %", key: "Productive Time (PT) %" },
      { label: "NPT %", key: "Non-Productive Time (NPT) %" },
      { label: "Needle Time %", key: "Needle Runtime" },
      { label: "Sewing Speed", key: "Sewing Speed" },
      { label: "Stitch Count", key: "Stitch Count" },
    ];

    const timeKeys = [
      "Total Hours",
      "Sewing Hours (PT)",
      "Idle Hours",
      "Rework Hours",
      "No Feeding Hours",
      "Meeting Hours",
      "Maintenance Hours",
      "Needle Break Hours",
    ];

    const headers = SUMMARY_TABLE_HEADS.map((head) => head.label);

    const rows = (reportData.tableData || []).map((row) => {
      // Calculate Needle Time % for this row
      let sewingHours = row["Sewing Hours (PT)"] || 0;
      let needleRuntime = row["Needle Runtime"] || 0;
      let sewingSeconds = 0;
      if (typeof sewingHours === "string" && sewingHours.includes(":")) {
        const [h, m] = sewingHours.split(":").map(Number);
        sewingSeconds = (isNaN(h) ? 0 : h) * 3600 + (isNaN(m) ? 0 : m) * 60;
      } else if (!isNaN(Number(sewingHours))) {
        const num = Number(sewingHours);
        if (num > 10000) sewingSeconds = num; // already seconds
        else sewingSeconds = num * 3600; // decimal hours
      }
      let needleRuntimePercent =
        sewingSeconds > 0 ? (needleRuntime / sewingSeconds) * 100 : 0;

      return SUMMARY_TABLE_HEADS.map((head) =>
        head.key === "Machine ID"
          ? row["Machine ID"] || machine_id
          /* : head.key === "Needle Runtime"
          ? needleRuntimePercent.toFixed(2) + "%" */
          : head.key === "Needle Runtime"
            ? safeToFixed(reportData.needleRuntimePercentage || 0) + "%"
          : timeKeys.includes(head.key)
          ? formatHoursMinutes(row[head.key])
          : row[head.key]?.toFixed
          ? row[head.key].toFixed(2)
          : row[head.key] !== undefined
          ? row[head.key]
          : ""
      );
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `machine_${machine_id}_report_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Utility to convert seconds or decimal hours or "HH:MM" string to "H hours M minutes" format
  const formatHoursMinutes = (input) => {
    if (input === null || input === undefined || input === "") return "-";
    let hours = 0,
      minutes = 0;
    if (typeof input === "string" && input.includes(":")) {
      const [h, m] = input.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        hours = h;
        minutes = m;
      }
    } else if (!isNaN(Number(input))) {
      const num = Number(input);
      if (num > 10000) {
        // treat as seconds if very large
        hours = Math.floor(num / 3600);
        minutes = Math.round((num % 3600) / 60);
      } else {
        const decimalHours = num;
        hours = Math.floor(decimalHours);
        minutes = Math.round((decimalHours - hours) * 60);
      }
    } else {
      return "-";
    }
    if (hours === 0 && minutes === 0) return "0";
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const downloadHTML = () => {
    const htmlContent = `<!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .title { text-align: center; }
          .summary { margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="summary">
          <h2>Machine ${machine_id} Report</h2>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Total Available Hours: ${formatHoursMinutes(
            reportData.totalAvailableHours || 0
          )} (${reportData.totalWorkingDays || 0} days × 11 hrs)</p>
          <p>Productive Time: ${formatHoursMinutes(
            reportData.totalProductiveTime.hours || 0
          )} (${reportData.totalProductiveTime.percentage.toFixed(2)}%)</p>
          <p>Non-Productive Time: ${formatHoursMinutes(
            reportData.totalNonProductiveTime.hours || 0
          )} (${reportData.totalNonProductiveTime.percentage.toFixed(2)}%)</p>
        </div>
        <table>
          <thead>
            <tr>
              ${Object.keys(reportData.tableData[0] || {})
                .map((header) => `<th>${header}</th>`)
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${reportData.tableData
              .map(
                (row) =>
                  `<tr>
                ${Object.entries(row)
                  .map(([header, value]) => {
                    if (
                      [
                        "Sewing Hours (PT)",
                        "No Feeding Hours",
                        "Meeting Hours",
                        "Maintenance Hours",
                        "Idle Hours",
                        "Rework Hours",
                        "Needle Break Hours",
                        "Total Hours",
                        "Needle Runtime",
                        "Run Time",
                        "Needle Stop Time",
                      ].includes(header)
                    ) {
                      return `<td>${formatHoursMinutes(value)}</td>`;
                    }
                    return `<td>${value !== undefined ? value : ""}</td>`;
                  })
                  .join("")}
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `machine_${machine_id}_report_${new Date()
        .toISOString()
        .slice(0, 10)}.html`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper function to safely convert to number and format
  const safeToFixed = (value, decimals = 2) => {
    const num = parseFloat(value);
    return isNaN(num) ? "0.00" : num.toFixed(decimals);
  };

  // Color map for breakdown (matching OperatorReport)
  const colorMap = {
    "Sewing Hours": "#27ae60", // green
    "No Feeding Hours": "#2980b9", // blue
    "Maintenance Hours": "#f1c40f", // yellow
    "Meeting Hours": "#e74c3c", // red
    "Idle Hours": "#7f8c8d", // gray
    "Rework Hours": "#f39c12", // orange
    "Needle Break Hours": "#8e44ad", // purple
  };

  const firstRow = reportData.tableData[0] || {};

  return (
    <div className="operator-container">
      <div className="table-section">
        <div className="table-header">
          <h3>Machine {machine_id} Report</h3>
          <div className="table-controls">
            <div className="download-buttons">
              <button onClick={downloadCSV} className="download-button csv">
                <FaDownload /> CSV
              </button>
              <button onClick={downloadHTML} className="download-button html">
                <FaDownload /> HTML
              </button>
            </div>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Total Hours</th>
                <th>Sewing</th>
                <th>Idle</th>
                <th>Rework</th>
                <th>No Feeding</th>
                <th>Meeting </th>
                <th>Maintenance </th>
                <th>Needle Break</th>
                <th>PT %</th>
                <th>NPT %</th>
                <th>Needle Runtime %</th>
                <th>Sewing Speed</th>
                <th>Stitch Count</th>
              </tr>
            </thead>
            <tbody>
              {reportData.tableData.map((row, index) => {
                // Calculate Needle Runtime % for each row
                let sewingHours = row["Sewing Hours (PT)"] || 0;
                let needleRuntime = row["Needle Runtime"] || 0;
                // Convert sewingHours to seconds if in HH:MM or decimal
                let sewingSeconds = 0;
                if (
                  typeof sewingHours === "string" &&
                  sewingHours.includes(":")
                ) {
                  const [h, m] = sewingHours.split(":").map(Number);
                  sewingSeconds =
                    (isNaN(h) ? 0 : h) * 3600 + (isNaN(m) ? 0 : m) * 60;
                } else if (!isNaN(Number(sewingHours))) {
                  const num = Number(sewingHours);
                  if (num > 10000) sewingSeconds = num; // already seconds
                  else sewingSeconds = num * 3600; // decimal hours
                }
                let needleRuntimePercent =
                  sewingSeconds > 0 ? (needleRuntime / sewingSeconds) * 100 : 0;

                return (
                  <tr key={index}>
                    <td>{row.Date || "-"}</td>
                    <td>{formatHoursMinutes(row["Total Hours"] || 0)}</td>
                    <td>{formatHoursMinutes(row["Sewing Hours (PT)"] || 0)}</td>
                    <td>{formatHoursMinutes(row["Idle Hours"] || 0)}</td>
                    <td>{formatHoursMinutes(row["Rework Hours"] || 0)}</td>
                    <td>{formatHoursMinutes(row["No Feeding Hours"] || 0)}</td>
                    <td>{formatHoursMinutes(row["Meeting Hours"] || 0)}</td>
                    <td>{formatHoursMinutes(row["Maintenance Hours"] || 0)}</td>
                    <td>
                      {formatHoursMinutes(row["Needle Break Hours"] || 0)}
                    </td>
                    <td>{(row["Productive Time (PT) %"] || 0).toFixed(2)}%</td>
                    <td>
                      {(row["Non-Productive Time (NPT) %"] || 0).toFixed(2)}%
                    </td>
                    <td>{safeToFixed(reportData.needleRuntimePercentage || 0)}%</td>
                    <td>{(row["Sewing Speed"] || 0).toFixed(2)}</td>
                    <td>{row["Stitch Count"] || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="summary-tiles">
        <div className="tile production-percentage">
          <p>{safeToFixed(reportData.totalProductiveTime.percentage)}%</p>
          <span>Productive Time</span>
        </div>
        {/* Tile Calculation Block */}
        <div className="tile needle-runtime-percentage">
          <p>{safeToFixed(reportData.needleRuntimePercentage || 0)}%</p>
          <span>Needle Runtime %</span>
        </div>

        <div className="tile sewing-speed">
          <p>
            {reportData.tableData.length > 0
              ? safeToFixed(
                  reportData.tableData.reduce(
                    (sum, row) => sum + (row["Sewing Speed"] || 0),
                    0
                  ) / reportData.tableData.length
                )
              : "0.00"}
          </p>
          <span>Sewing Speed</span>
        </div>
        <div className="tile total-hours">
          <p>{formatHoursMinutes(reportData.totalHours)}</p>
          <span>Total Hours</span>
        </div>
      </div>

      <div className="chart-breakdown-container">
        <div className="graph-section">
          <h3>Hours Breakdown</h3>
          <div style={{ width: "100%", height: "320px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    {
                      name: "Sewing Hours",
                      value: firstRow["Sewing Hours (PT)"]
                        ? typeof firstRow["Sewing Hours (PT)"] === "string"
                          ? parseFloat(firstRow["Sewing Hours (PT)"]) * 60
                          : firstRow["Sewing Hours (PT)"] * 60
                        : 0,
                      color: colorMap["Sewing Hours"],
                    },
                    {
                      name: "No Feeding Hours",
                      value: firstRow["No Feeding Hours"]
                        ? typeof firstRow["No Feeding Hours"] === "string"
                          ? parseFloat(firstRow["No Feeding Hours"]) * 60
                          : firstRow["No Feeding Hours"] * 60
                        : 0,
                      color: colorMap["No Feeding Hours"],
                    },
                    {
                      name: "Maintenance Hours",
                      value: firstRow["Maintenance Hours"]
                        ? typeof firstRow["Maintenance Hours"] === "string"
                          ? parseFloat(firstRow["Maintenance Hours"]) * 60
                          : firstRow["Maintenance Hours"] * 60
                        : 0,
                      color: colorMap["Maintenance Hours"],
                    },
                    {
                      name: "Meeting Hours",
                      value: firstRow["Meeting Hours"]
                        ? typeof firstRow["Meeting Hours"] === "string"
                          ? parseFloat(firstRow["Meeting Hours"]) * 60
                          : firstRow["Meeting Hours"] * 60
                        : 0,
                      color: colorMap["Meeting Hours"],
                    },
                    {
                      name: "Idle Hours",
                      value: firstRow["Idle Hours"]
                        ? typeof firstRow["Idle Hours"] === "string"
                          ? parseFloat(firstRow["Idle Hours"]) * 60
                          : firstRow["Idle Hours"] * 60
                        : 0,
                      color: colorMap["Idle Hours"],
                    },
                    {
                      name: "Rework Hours",
                      value: firstRow["Rework Hours"]
                        ? typeof firstRow["Rework Hours"] === "string"
                          ? parseFloat(firstRow["Rework Hours"]) * 60
                          : firstRow["Rework Hours"] * 60
                        : 0,
                      color: colorMap["Rework Hours"],
                    },
                    {
                      name: "Needle Break Hours",
                      value: firstRow["Needle Break Hours"]
                        ? typeof firstRow["Needle Break Hours"] === "string"
                          ? parseFloat(firstRow["Needle Break Hours"]) * 60
                          : firstRow["Needle Break Hours"] * 60
                        : 0,
                      color: colorMap["Needle Break Hours"],
                    },
                  ].filter((item) => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[
                    {
                      name: "Sewing Hours",
                      value: firstRow["Sewing Hours (PT)"]
                        ? typeof firstRow["Sewing Hours (PT)"] === "string"
                          ? parseFloat(firstRow["Sewing Hours (PT)"]) * 60
                          : firstRow["Sewing Hours (PT)"] * 60
                        : 0,
                      color: colorMap["Sewing Hours"],
                    },
                    {
                      name: "No Feeding Hours",
                      value: firstRow["No Feeding Hours"]
                        ? typeof firstRow["No Feeding Hours"] === "string"
                          ? parseFloat(firstRow["No Feeding Hours"]) * 60
                          : firstRow["No Feeding Hours"] * 60
                        : 0,
                      color: colorMap["No Feeding Hours"],
                    },
                    {
                      name: "Maintenance Hours",
                      value: firstRow["Maintenance Hours"]
                        ? typeof firstRow["Maintenance Hours"] === "string"
                          ? parseFloat(firstRow["Maintenance Hours"]) * 60
                          : firstRow["Maintenance Hours"] * 60
                        : 0,
                      color: colorMap["Maintenance Hours"],
                    },
                    {
                      name: "Meeting Hours",
                      value: firstRow["Meeting Hours"]
                        ? typeof firstRow["Meeting Hours"] === "string"
                          ? parseFloat(firstRow["Meeting Hours"]) * 60
                          : firstRow["Meeting Hours"] * 60
                        : 0,
                      color: colorMap["Meeting Hours"],
                    },
                    {
                      name: "Idle Hours",
                      value: firstRow["Idle Hours"]
                        ? typeof firstRow["Idle Hours"] === "string"
                          ? parseFloat(firstRow["Idle Hours"]) * 60
                          : firstRow["Idle Hours"] * 60
                        : 0,
                      color: colorMap["Idle Hours"],
                    },
                    {
                      name: "Rework Hours",
                      value: firstRow["Rework Hours"]
                        ? typeof firstRow["Rework Hours"] === "string"
                          ? parseFloat(firstRow["Rework Hours"]) * 60
                          : firstRow["Rework Hours"] * 60
                        : 0,
                      color: colorMap["Rework Hours"],
                    },
                    {
                      name: "Needle Break Hours",
                      value: firstRow["Needle Break Hours"]
                        ? typeof firstRow["Needle Break Hours"] === "string"
                          ? parseFloat(firstRow["Needle Break Hours"]) * 60
                          : firstRow["Needle Break Hours"] * 60
                        : 0,
                      color: colorMap["Needle Break Hours"],
                    },
                  ]
                    .filter((item) => item.value > 0)
                    .map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>

                <Tooltip
                  formatter={(value, name) => {
                    // Always show as "Idle Hours: 0h 10m" (formatted time, no decimals)
                    const totalMinutes = Math.round(Number(value));
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    const timeStr =
                      hours > 0 && minutes > 0
                        ? `${hours}h ${minutes}m`
                        : hours > 0
                        ? `${hours}h 0m`
                        : `0h ${minutes}m`;
                    const label = `${name}: ${timeStr}`;
                    return [label];
                  }}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="hour-breakdown">
          {[
            { key: "Sewing Hours", value: firstRow["Sewing Hours (PT)"] },
            { key: "Idle Hours", value: firstRow["Idle Hours"] },
            { key: "Rework Hours", value: firstRow["Rework Hours"] },
            { key: "No Feeding Hours", value: firstRow["No Feeding Hours"] },
            { key: "Meeting Hours", value: firstRow["Meeting Hours"] },
            { key: "Maintenance Hours", value: firstRow["Maintenance Hours"] },
            {
              key: "Needle Break Hours",
              value: firstRow["Needle Break Hours"],
            },
          ].map(({ key, value }) => {
            let formatted = formatHoursMinutes(value);
            // Always show as '0h 0m' if zero or invalid
            if (
              formatted === "0" ||
              formatted === "-" ||
              formatted === "0m" ||
              formatted === "0h"
            )
              formatted = "0h 0m";
            // If only hours or only minutes, force both
            if (/^\d+h$/.test(formatted))
              formatted = formatted.replace(/(\d+)h/, "$1h 0m");
            if (/^\d+m$/.test(formatted))
              formatted = formatted.replace(/(\d+)m/, "0h $1m");
            // If already in 'xh ym' format, keep as is
            return (
              <div
                className="hour-box"
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  minHeight: "32px",
                }}
              >
                <span
                  className="dot"
                  style={{
                    marginRight: 8,
                    backgroundColor: colorMap[key],
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    display: "inline-block",
                  }}
                ></span>
                <span
                  className="hour-label"
                  style={{
                    minWidth: 60,
                    display: "inline-block",
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatted}
                </span>
                <span className="hour-desc" style={{ marginLeft: 8 }}>
                  : {key}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MachineReport;
