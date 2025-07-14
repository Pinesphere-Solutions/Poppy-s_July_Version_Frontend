import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  FaTshirt,
  FaClock,
  FaTools,
  FaDownload,
  FaTable,
  FaChartBar,
  FaAngleLeft,
  FaAngleRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from "react-icons/fa";
import "./MachineStyles.css";

const SUMMARY_TABLE_HEADS = [
  { label: "Date", key: "Date" },
  { label: "Machine ID", key: "Machine ID" },
  { label: "Total Hours", key: "Total Hours" },
  { label: "Sewing", key: "Sewing Hours (PT)" },
  { label: "Idle", key: "Idle Hours" },
  { label: "Rework Hours", key: "Rework Hours" }, // Added
  { label: "No Feeding", key: "No Feeding Hours" },
  { label: "Meeting", key: "Meeting Hours" },
  { label: "Maintenance", key: "Maintenance Hours" },
  { label: "Needle Break", key: "Needle Break Hours" }, // Added
  { label: "PT %", key: "Productive Time (PT) %" },
  { label: "NPT %", key: "Non-Productive Time (NPT) %" },
  { label: "Needle Runtime %", key: "Needle Runtime" }, // Inserted here
  { label: "Sewing Speed", key: "Sewing Speed" },
  { label: "Stitch Count", key: "Stitch Count" },
];

const DETAILED_TABLE_HEADS = [
  { label: "S.No", key: "serial_number" },
  { label: "Machine ID", key: "MACHINE_ID" },
  { label: "Line Number", key: "LINE_NUMB" },
  { label: "Operator ID", key: "OPERATOR_ID" },
  { label: "Date", key: "DATE" },
  { label: "Start Time", key: "START_TIME" },
  { label: "End Time", key: "END_TIME" },
  { label: "Mode", key: "MODE" },
  { label: "Mode Description", key: "mode_description" },
  { label: "Stitch Count", key: "STITCH_COUNT" },
  { label: "Needle Runtime", key: "NEEDLE_RUNTIME" },
  { label: "Needle Stop Time", key: "NEEDLE_STOPTIME" },
  { label: "Duration", key: "DEVICE_ID" },
  { label: "SPM", key: "RESERVE" },
  { label: "Calculation Value", key: "calculation_value" },
  { label: "TX Log ID", key: "Tx_LOGID" },
  { label: "STR Log ID", key: "Str_LOGID" },
  { label: "Created At", key: "created_at" },
];

const formatConsistentDateTime = (dateTimeString) => {
  if (!dateTimeString) return "-";
  try {
    const dateTime = new Date(dateTimeString);
    const year = dateTime.getFullYear();
    const month = String(dateTime.getMonth() + 1).padStart(2, "0");
    const day = String(dateTime.getDate()).padStart(2, "0");
    const hours = String(dateTime.getHours()).padStart(2, "0");
    const minutes = String(dateTime.getMinutes()).padStart(2, "0");
    const seconds = String(dateTime.getSeconds()).padStart(2, "0");
    const ms = String(dateTime.getMilliseconds()).padStart(3, "0").slice(0, 2);
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
  } catch (e) {
    console.error("Date formatting error:", e);
    return dateTimeString;
  }
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

// Color map for breakdown (matching MachineReport/OperatorReport)
const colorMap = {
  "Sewing Hours": "#27ae60", // green
  "No Feeding Hours": "#2980b9", // blue
  "Maintenance Hours": "#f1c40f", // yellow
  "Meeting Hours": "#e74c3c", // red
  "Idle Hours": "#7f8c8d", // gray
  "Rework Hours": "#f39c12", // orange
  "Needle Break Hours": "#8e44ad", // purple
};

// Consistent hour formatting for breakdown
const consistentFormatHoursMinutes = (input) => {
  let formatted = formatHoursMinutes(input);
  if (
    formatted === "0" ||
    formatted === "-" ||
    formatted === "0m" ||
    formatted === "0h"
  )
    formatted = "0h 0m";
  if (/^\d+h$/.test(formatted))
    formatted = formatted.replace(/(\d+)h/, "$1h 0m");
  if (/^\d+m$/.test(formatted))
    formatted = formatted.replace(/(\d+)m/, "0h $1m");
  return formatted;
};

const AllMachinesReport = ({ reportData = [], fromDate, toDate, detailedData = [] }) => {
  const [showTableView, setShowTableView] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Reset state when reportData changes
  useEffect(() => {
    if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
      setShowTableView(false);
      setCurrentPage(1);
      console.log("Resetting state for All Machines view");
    }
  }, [reportData]);

  // Fallback for invalid or empty data
  if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
    return <div className="error-message">No data available. Please refresh or try again.</div>;
  }

  // Loading state
  if (!reportData && !detailedData) {
    return <div className="loading-message">Loading report data...</div>;
  }

  const toggleView = () => {
    setShowTableView(!showTableView);
    setCurrentPage(1);
  };

  // Add filtering logic based on the provided fromDate and toDate
  const filteredReportData = Array.isArray(reportData) ? reportData : [];
  console.log("Filtered Report Data:", filteredReportData);

  const filteredDetailedData =
    fromDate && toDate
      ? detailedData.filter((row) => {
          const rowDate = new Date(row.DATE);
          return rowDate >= new Date(fromDate) && rowDate <= new Date(toDate);
        })
      : detailedData;

  // Pagination calculations
  const totalRows = filteredDetailedData.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredDetailedData.slice(
    indexOfFirstRow,
    indexOfLastRow
  );

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToFirstPage = () => paginate(1);
  const goToLastPage = () => paginate(totalPages);
  const goToNextPage = () =>
    currentPage < totalPages && paginate(currentPage + 1);
  const goToPreviousPage = () => currentPage > 1 && paginate(currentPage - 1);

  // Process data to include machine IDs in each row with null checks
  const processedData = filteredReportData
    ? filteredReportData.map((machine) => ({
        ...machine,
        tableData: (machine.tableData || []).map((row) => ({
          ...row,
          "Machine ID": machine.machineId, // Add machine ID to each row
        })),
      }))
    : [];

  // Add this validation check
  const hasValidData =
    processedData &&
    processedData.length > 0 &&
    processedData.some(
      (machine) => machine.tableData && machine.tableData.length > 0
    );

  console.log("Processed Data:", processedData);
  console.log("Filtered Detailed Data:", filteredReportData);
  console.log("Has Valid Data:", hasValidData);
  console.log("Report Data Props:", reportData);
  console.log("Detailed Data Props:", detailedData);

  // Calculate totals with null checks - only process if we have valid data structure
  const totals = hasValidData
    ? filteredReportData.reduce(
        (acc, machine) => {
          // Add extra safety checks for machine data structure
          if (!machine || typeof machine !== "object") return acc;

          acc.totalHours += machine.totalHours || 0;
          acc.totalProductiveHours += machine.totalProductiveTime?.hours || 0;
          acc.totalNonProductiveHours +=
            machine.totalNonProductiveTime?.hours || 0;
          acc.totalNoFeedingHours +=
            machine.totalNonProductiveTime?.breakdown?.noFeedingHours || 0;
          acc.totalMeetingHours +=
            machine.totalNonProductiveTime?.breakdown?.meetingHours || 0;
          acc.totalMaintenanceHours +=
            machine.totalNonProductiveTime?.breakdown?.maintenanceHours || 0;
          acc.totalIdleHours +=
            machine.totalNonProductiveTime?.breakdown?.idleHours || 0;
          acc.totalReworkHours +=
            machine.totalNonProductiveTime?.breakdown?.reworkHours || 0;
          acc.totalNeedleBreakHours +=
            machine.totalNonProductiveTime?.breakdown?.needleBreakHours || 0;
          return acc;
        },
        {
          totalHours: 0,
          totalProductiveHours: 0,
          totalNonProductiveHours: 0,
          totalNoFeedingHours: 0,
          totalMeetingHours: 0,
          totalMaintenanceHours: 0,
          totalIdleHours: 0,
          totalReworkHours: 0,
          totalNeedleBreakHours: 0,
        }
      )
    : {
        totalHours: 0,
        totalProductiveHours: 0,
        totalNonProductiveHours: 0,
        totalNoFeedingHours: 0,
        totalMeetingHours: 0,
        totalMaintenanceHours: 0,
        totalIdleHours: 0,
        totalReworkHours: 0,
        totalNeedleBreakHours: 0,
      };

  const averageProductivePercentage =
    totals.totalHours > 0
      ? (totals.totalProductiveHours / totals.totalHours) * 100
      : 0;
  const averageNonProductivePercentage =
    totals.totalHours > 0
      ? (totals.totalNonProductiveHours / totals.totalHours) * 100
      : 0;
  const averageNeedleRuntimePercentage =
    filteredReportData && filteredReportData.length > 0
      ? filteredReportData.reduce(
          (sum, machine) => sum + (machine.needleRuntimePercentage || 0),
          0
        ) / filteredReportData.length
      : 0;
  const averageSewingSpeed =
    filteredReportData && filteredReportData.length > 0
      ? filteredReportData.reduce(
          (sum, machine) => sum + (machine.averageSewingSpeed || 0),
          0
        ) / filteredReportData.length
      : 0;

  // Calculate average Needle Runtime % across all summary rows
  const allSummaryRows = processedData.flatMap(
    (machine) => machine.tableData || []
  );
  const needleRuntimePercentages = allSummaryRows.map((row) => {
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
    return sewingSeconds > 0 ? (needleRuntime / sewingSeconds) * 100 : 0;
  });
  const averageRowNeedleRuntimePercentage = (() => {
    // Filter out values <= 2%
    const filtered = needleRuntimePercentages.filter(val => val > 2);
    if (filtered.length === 0) return 0;
    return filtered.reduce((sum, val) => sum + val, 0) / filtered.length;
  })();

  /*  const downloadCSV = () => {
    const headers = showTableView
      ? DETAILED_TABLE_HEADS.map(head => head.label)
      : SUMMARY_TABLE_HEADS.map(head => head.label);

    const rows = showTableView
      ? (filteredDetailedData || []).map((row, index) =>
        DETAILED_TABLE_HEADS.map(head =>
          head.key === "serial_number" ? index + 1 :
            head.key === "created_at" && row[head.key] ? formatConsistentDateTime(row[head.key]) :
              head.key === "calculation_value" && row[head.key] !== undefined && row[head.key] !== null ? row[head.key] :
                row[head.key] || ""
        )
      )
      : processedData.flatMap(machine => machine.tableData || []).map(row => {
        // Calculate Needle Runtime % like MachineReport.jsx
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
        let needleRuntimePercent = sewingSeconds > 0 ? (needleRuntime / sewingSeconds) * 100 : 0;
        return SUMMARY_TABLE_HEADS.map(head =>
          head.key === "Needle Runtime"
            ? needleRuntimePercent.toFixed(2) + '%'
            : row[head.key]?.toFixed ? row[head.key].toFixed(2) : row[head.key] || ""
        );
      });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `all_machines_${showTableView ? 'raw_data' : 'summary'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
 */

  /**
   * Download CSV function to export data in CSV format
   */

  const downloadCSV = () => {
    const headers = showTableView
      ? DETAILED_TABLE_HEADS.map((head) => head.label)
      : SUMMARY_TABLE_HEADS.map((head) => head.label);

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

    const rows = showTableView
      ? (filteredDetailedData || []).map((row, index) =>
          DETAILED_TABLE_HEADS.map((head) =>
            head.key === "serial_number"
              ? index + 1
              : head.key === "created_at" && row[head.key]
              ? formatConsistentDateTime(row[head.key])
              : head.key === "calculation_value" &&
                row[head.key] !== undefined &&
                row[head.key] !== null
              ? row[head.key]
              : row[head.key] || ""
          )
        )
      : processedData
          .flatMap((machine) => machine.tableData || [])
          .map((row) => {
            // Calculate Needle Runtime % like MachineReport.jsx
            let sewingHours = row["Sewing Hours (PT)"] || 0;
            let needleRuntime = row["Needle Runtime"] || 0;
            let sewingSeconds = 0;
            if (typeof sewingHours === "string" && sewingHours.includes(":")) {
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
            return SUMMARY_TABLE_HEADS.map((head) =>
              head.key === "Needle Runtime"
                ? needleRuntimePercent.toFixed(2) + "%"
                : timeKeys.includes(head.key)
                ? formatHoursMinutes(row[head.key])
                : row[head.key]?.toFixed
                ? row[head.key].toFixed(2)
                : row[head.key] || ""
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
      `all_machines_${showTableView ? "raw_data" : "summary"}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ...existing code...

  const downloadHTML = () => {
    const headers = showTableView
      ? DETAILED_TABLE_HEADS.map((head) => `<th>${head.label}</th>`).join("")
      : SUMMARY_TABLE_HEADS.map((head) => `<th>${head.label}</th>`).join("");

    const rows = showTableView
      ? (filteredDetailedData || [])
          .map(
            (row, index) => `
          <tr>
            ${DETAILED_TABLE_HEADS.map(
              (head) => `
              <td>$
                {head.key === "serial_number" ? index + 1 :
                head.key === "created_at" && row[head.key] ? formatConsistentDateTime(row[head.key]) :
                head.key === "calculation_value" && row[head.key] !== undefined && row[head.key] !== null ? row[head.key] :
                row[head.key] || ''
              }</td>
            `
            ).join("")}
          </tr>
        `
          )
          .join("")
      : processedData
          .flatMap((machine) => machine.tableData || [])
          .map((row) => {
            // Calculate Needle Runtime % like MachineReport.jsx
            let sewingHours = row["Sewing Hours (PT)"] || 0;
            let needleRuntime = row["Needle Runtime"] || 0;
            let sewingSeconds = 0;
            if (typeof sewingHours === "string" && sewingHours.includes(":")) {
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
            return `<tr>\n${SUMMARY_TABLE_HEADS.map(
              (head) =>
                `\n<td>${
                  head.key === "Needle Runtime"
                    ? needleRuntimePercent.toFixed(2) + "%"
                    : row[head.key]?.toFixed
                    ? row[head.key].toFixed(2)
                    : row[head.key] || ""
                }</td>`
            ).join("")}\n</tr>`;
          })
          .join("");

    const htmlContent = `<!DOCTYPE html>
      <html>
      <head>
        <title>${
          showTableView ? "All Machines Raw Data" : "All Machines Summary"
        }</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .report-info { margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>${ 
          showTableView
            ? "All Machines Raw Data Report"
            : "All Machines Summary Report"
        }</h1>
        <div className="report-info">
          <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
          ${
            fromDate
              ? `<p><strong>From Date:</strong> ${new Date(
                  fromDate
                ).toLocaleDateString()}</p>`
              : ""
          }
          ${
            toDate
              ? `<p><strong>To Date:</strong> ${new Date(
                  toDate
                ).toLocaleDateString()}</p>`
              : ""
          }
        </div>
        <table>
          <thead><tr>${headers}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
      </html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `all_machines_${showTableView ? "raw_data" : "summary"}_${new Date()
        .toISOString()
        .slice(0, 10)}.html`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Define chart data with explicit colors like in LineReport.jsx
  const chartData = [
    {
      name: "Sewing Hours",
      value: totals.totalProductiveHours,
      color: "#3E3561",
    },
    {
      name: "No Feeding Hours",
      value: totals.totalNoFeedingHours,
      color: "#8E44AD",
    },
    {
      name: "Meeting Hours",
      value: totals.totalMeetingHours,
      color: "#E74C3C",
    },
    {
      name: "Maintenance Hours",
      value: totals.totalMaintenanceHours,
      color: "#118374",
    },
    { name: "Idle Hours", value: totals.totalIdleHours, color: "#F8A723" },
    { name: "Rework Hours", value: totals.totalReworkHours, color: "#FF6F61" }, // Updated color
    {
      name: "Needle Break",
      value: totals.totalNeedleBreakHours,
      color: "#00B8D9",
    }, // Updated color
  ].filter((item) => item.value > 0);

  if (!reportData && !detailedData) {
    return <div className="loading-message">Loading report data...</div>;
  }

  if (showTableView) {
    return (
      <div className="machine-container">
        <div className="table-section">
          <div className="table-header">
            <h3>All Machines Raw Data</h3>
            <div className="table-controls">
              <button
                className="toggle-view-button view-toggle-button green-button"
                onClick={toggleView}
                title="View Summary"
              >
                <FaChartBar /> View Summary
              </button>
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
          <div className="pagination-controls">
            <div className="rows-per-page">
              <label>Rows per page:</label>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            <div className="page-info">
              Showing {indexOfFirstRow + 1}-
              {Math.min(indexOfLastRow, totalRows)} of {totalRows} rows
            </div>
            <div className="page-navigation">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="page-button"
              >
                <FaAngleDoubleLeft />
              </button>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="page-button"
              >
                <FaAngleLeft />
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="page-button"
              >
                <FaAngleRight />
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="page-button"
              >
                <FaAngleDoubleRight />
              </button>
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {DETAILED_TABLE_HEADS.map((th, index) => (
                    <th key={index}>{th.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDetailedData && filteredDetailedData.length > 0 ? (
                  currentRows.map((dataItem, index) => (
                    <tr key={indexOfFirstRow + index}>
                      <td>{indexOfFirstRow + index + 1}</td>
                      <td>{dataItem.MACHINE_ID || "-"}</td>
                      <td>{dataItem.LINE_NUMB || "-"}</td>
                      <td>{dataItem.OPERATOR_ID || "-"}</td>
                      <td>{dataItem.DATE || "-"}</td>
                      <td>{dataItem.START_TIME || "-"}</td>
                      <td>{dataItem.END_TIME || "-"}</td>
                      <td>{dataItem.MODE || "-"}</td>
                      <td>{dataItem.mode_description || "-"}</td>
                      <td>{dataItem.STITCH_COUNT || "-"}</td>
                      <td>{dataItem.NEEDLE_RUNTIME || "-"}</td>
                      <td>{dataItem.NEEDLE_STOPTIME || "-"}</td>
                      <td>{dataItem.DEVICE_ID || "-"}</td>
                      <td>{dataItem.RESERVE || "-"}</td>
                      <td>
                        {dataItem.calculation_value !== undefined &&
                        dataItem.calculation_value !== null
                          ? dataItem.calculation_value
                          : "-"}
                      </td>
                      <td>{dataItem.Tx_LOGID || "-"}</td>
                      <td>{dataItem.Str_LOGID || "-"}</td>
                      <td>
                        {dataItem.created_at
                          ? formatConsistentDateTime(dataItem.created_at)
                          : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={DETAILED_TABLE_HEADS.length}
                      className="no-data"
                    >
                      No detailed data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="pagination-controls bottom">
            <div className="page-navigation">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="page-button"
              >
                <FaAngleDoubleLeft />
              </button>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="page-button"
              >
                <FaAngleLeft />
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="page-button"
              >
                <FaAngleRight />
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="page-button"
              >
                <FaAngleDoubleRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  console.log("Processed Data:", processedData);

  return (
    <div className="machine-container">
      <div className="table-section">
        <div className="table-header">
          <h3>All Machines Report</h3>
          <div className="table-controls">
            <button
              className="toggle-view-button view-toggle-button green-button"
              onClick={toggleView}
              title="View Raw Data"
            >
              <FaTable /> View Raw Data
            </button>
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
                {SUMMARY_TABLE_HEADS.map((th, index) => (
                  <th key={index}>{th.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processedData &&
              processedData.flatMap((machine) => machine.tableData || [])
                .length > 0 ? (
                processedData
                  .flatMap((machine) => machine.tableData || [])
                  .map((row, index) => {
                    // Calculate Needle Runtime % like MachineReport.jsx
                    let sewingHours = row["Sewing Hours (PT)"] || 0;
                    let needleRuntime = row["Needle Runtime"] || 0;
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
                      sewingSeconds > 0
                        ? (needleRuntime / sewingSeconds) * 100
                        : 0;
                    return (
                      <tr key={index}>
                        {SUMMARY_TABLE_HEADS.map((head) => {
                          if (head.key === "Needle Runtime") {
                            return (
                              <td key={head.key}>
                                {needleRuntimePercent.toFixed(2)}%
                              </td>
                            );
                          }
                          if (
                            head.key === "Sewing Hours (PT)" ||
                            head.key.endsWith("Hours")
                          ) {
                            return (
                              <td key={head.key}>
                                {formatHoursMinutes(row[head.key] || 0)}
                              </td>
                            );
                          }
                          if (
                            head.key === "Productive Time (PT) %" ||
                            head.key === "Non-Productive Time (NPT) %"
                          ) {
                            return (
                              <td key={head.key}>
                                {row[head.key]?.toFixed(2) || "0.00"}%
                              </td>
                            );
                          }
                          if (head.key === "Sewing Speed") {
                            return (
                              <td key={head.key}>
                                {row[head.key]?.toFixed(2) || "0.00"}
                              </td>
                            );
                          }
                          if (head.key === "Stitch Count") {
                            return (
                              <td key={head.key}>{row[head.key] || "0"}</td>
                            );
                          }
                          return <td key={head.key}>{row[head.key] || "-"}</td>;
                        })}
                      </tr>
                    );
                  })
              ) : (
                <tr>
                  <td colSpan={SUMMARY_TABLE_HEADS.length} className="no-data">
                    No report data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
<div className="summary-tiles">
  <div className="tile production-percentage">
    <p>{(() => {
      // Calculate total productive time percentage correctly
      const totalProductiveHours = totals.totalProductiveHours || 0;
      const totalHours = totals.totalHours || 0;
      const ptPercentage = totalHours > 0 ? (totalProductiveHours / totalHours) * 100 : 0;
      return ptPercentage.toFixed(2) + "%";
    })()}</p>
    <span>Productive Time %</span>
  </div>
  <div className="tile needle-runtime-percentage">
    <p>{averageRowNeedleRuntimePercentage.toFixed(2)}%</p>
    <span>Needle Runtime %</span>
  </div>
  <div className="tile sewing-speed">
    <p>{averageSewingSpeed.toFixed(2)}</p>
    <span>Sewing Speed</span>
  </div>
  <div className="tile total-hours">
    <p>{formatHoursMinutes(totals.totalHours)}</p>
    <span>Total Hours</span>
  </div>
</div>

      <div className="chart-breakdown-container">
        <div className="graph-section">
          <h3>
            Hours Breakdown (All Machines Total:{" "}
            {formatHoursMinutes(totals.totalHours)})
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={[
                  {
                    name: "Sewing Hours",
                    value: totals.totalProductiveHours,
                    color: colorMap["Sewing Hours"],
                  },
                  {
                    name: "No Feeding Hours",
                    value: totals.totalNoFeedingHours,
                    color: colorMap["No Feeding Hours"],
                  },
                  {
                    name: "Meeting Hours",
                    value: totals.totalMeetingHours,
                    color: colorMap["Meeting Hours"],
                  },
                  {
                    name: "Maintenance Hours",
                    value: totals.totalMaintenanceHours,
                    color: colorMap["Maintenance Hours"],
                  },
                  {
                    name: "Idle Hours",
                    value: totals.totalIdleHours,
                    color: colorMap["Idle Hours"],
                  },
                  {
                    name: "Rework Hours",
                    value: totals.totalReworkHours,
                    color: colorMap["Rework Hours"],
                  },
                  {
                    name: "Needle Break",
                    value: totals.totalNeedleBreakHours,
                    color: colorMap["Needle Break Hours"],
                  },
                ].filter((item) => item.value > 0)}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
              >
                {[
                  {
                    name: "Sewing Hours",
                    value: totals.totalProductiveHours,
                    color: colorMap["Sewing Hours"],
                  },
                  {
                    name: "No Feeding Hours",
                    value: totals.totalNoFeedingHours,
                    color: colorMap["No Feeding Hours"],
                  },
                  {
                    name: "Meeting Hours",
                    value: totals.totalMeetingHours,
                    color: colorMap["Meeting Hours"],
                  },
                  {
                    name: "Maintenance Hours",
                    value: totals.totalMaintenanceHours,
                    color: colorMap["Maintenance Hours"],
                  },
                  {
                    name: "Idle Hours",
                    value: totals.totalIdleHours,
                    color: colorMap["Idle Hours"],
                  },
                  {
                    name: "Rework Hours",
                    value: totals.totalReworkHours,
                    color: colorMap["Rework Hours"],
                  },
                  {
                    name: "Needle Break Hours",
                    value: totals.totalNeedleBreakHours,
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
                  const hours = Math.floor(value);
                  const minutes = Math.round((value - hours) * 60);
                  let label = `${hours}h ${minutes}m`;
                  if (hours === 0 && minutes === 0) label = "0h 0m";
                  if (hours === 0) label = `0h ${minutes}m`;
                  if (minutes === 0) label = `${hours}h 0m`;
                  return [label, name];
                }}
                labelFormatter={(name) => `${name}`}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div
            className="total-hours"
            style={{ textAlign: "center", marginTop: "10px" }}
          >
            <strong>
              Total Hours: {formatHoursMinutes(totals.totalHours)}
            </strong>
          </div>
        </div>
        <div className="hour-breakdown">
          {[
            { key: "Sewing Hours", value: totals.totalProductiveHours },
            { key: "Idle Hours", value: totals.totalIdleHours },
            { key: "Rework Hours", value: totals.totalReworkHours },
            { key: "No Feeding Hours", value: totals.totalNoFeedingHours },
            { key: "Meeting Hours", value: totals.totalMeetingHours },
            { key: "Maintenance Hours", value: totals.totalMaintenanceHours },
            { key: "Needle Break Hours", value: totals.totalNeedleBreakHours },
          ].map(({ key, value }) => (
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
                {consistentFormatHoursMinutes(value)}
              </span>
              <span className="hour-desc" style={{ marginLeft: 8 }}>
                : {key}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllMachinesReport;
