import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  FaTshirt,
  FaClock,
  FaTools,
  FaDownload,
  FaFilter,
} from "react-icons/fa";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import "./OperatorStyles.css";

const OperatorReport = ({ operator_name, fromDate, toDate, allTableData }) => {
  const [reportData, setReportData] = useState({
    totalProductionHours: 0,
    totalNonProductionHours: 0,
    totalIdleHours: 0,
    totalHours: 0,
    totalPT: 0,
    totalNPT: 0,
    totalReworkHours: 0,
    totalNeedleBreakHours: 0,
    tableData: [],
    allTableData: [],
    needleRuntimePercentage: 0,
    averageSewingSpeed: 0,
    productionPercentage: 0,
    nptPercentage: 0,
    totalStitchCount: 0,
    totalNeedleRuntime: 0,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [tableFilter, setTableFilter] = useState({
    fromDate: "",
    toDate: "",
  });

  const [dateError, setDateError] = useState("");
  const isAllOperators =
    operator_name === "All" || operator_name === "" || !operator_name;
  const modeKeys = [
    "Sewing Hours",
    "No Feeding Hours",
    "Maintenance Hours",
    "Meeting Hours",
    "Idle Hours",
    "Rework Hours",
    "Needle Break Hours",
  ];
  const sourceData =
    isAllOperators && allTableData && allTableData.length > 0
      ? allTableData
      : reportData.tableData;

  // Utility to convert decimal hours or "HH:MM" string to "H hours M minutes" format
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
      const decimalHours = Number(input);
      hours = Math.floor(decimalHours);
      minutes = Math.round((decimalHours - hours) * 60);
    } else {
      return "-";
    }
    // Always show both hours and minutes, even if one is zero
    return `${hours}h ${minutes}m`;
  };

  // Utility to convert seconds to "H hours M minutes" format
  const formatSecondsToHoursMinutes = (seconds) => {
    if (isNaN(seconds) || seconds === null || seconds === undefined) return "-";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Helper function to safely convert to number and format
  const safeToFixed = (value, decimals = 2) => {
    const num = parseFloat(value);
    return isNaN(num) ? "0.00" : num.toFixed(decimals);
  };

  useEffect(() => {
    if (!operator_name) return;

    const params = new URLSearchParams({
      from_date: fromDate || "",
      to_date: toDate || "",
    });

    fetch(
      `https://oceanatlantic.pinesphere.co.in/api/operator_report_by_name/${operator_name}/?${params}`
    )
      .then((response) => response.json())
      .then((data) => {
        setReportData({
          ...data,
          tableData: data.tableData,
          allTableData: data.tableData,
        });

        // Reset to first page when new data is loaded
        setCurrentPage(1);
      })
      .catch((error) => console.error("Error fetching report:", error));
  }, [operator_name, fromDate, toDate]);

  // Pagination calculations
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = reportData.tableData.slice(
    indexOfFirstRow,
    indexOfLastRow
  );
  const totalPages = Math.ceil(reportData.tableData.length / rowsPerPage);

  // Pagination navigation handlers
  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToPage = (pageNumber) => {
    setCurrentPage(Math.min(Math.max(1, pageNumber), totalPages));
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5; // Show maximum 5 page numbers at a time

    if (totalPages <= maxVisiblePages) {
      // Show all page numbers if total pages are less than or equal to maxVisiblePages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show first page, last page, current page and pages around current page
      const leftOffset = Math.min(
        Math.floor(maxVisiblePages / 2),
        currentPage - 1
      );
      const rightOffset = Math.min(
        Math.floor(maxVisiblePages / 2),
        totalPages - currentPage
      );

      const startPage = Math.max(1, currentPage - leftOffset);
      const endPage = Math.min(totalPages, currentPage + rightOffset);

      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) pageNumbers.push("...");
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  const handleTableFilterChange = (e) => {
    const { name, value } = e.target;
    setTableFilter((prev) => ({ ...prev, [name]: value }));
  };

  const applyTableFilter = () => {
    const { fromDate, toDate } = tableFilter;
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      setDateError("From date must be earlier than or equal to To date.");
      return;
    }
    const filteredData = reportData.allTableData.filter((row) => {
      const rowDate = new Date(row.Date);
      const fromDateObj = fromDate ? new Date(fromDate) : null;
      const toDateObj = toDate ? new Date(toDate) : null;
      let valid = true;
      if (fromDateObj) valid = valid && rowDate >= fromDateObj;
      if (toDateObj) valid = valid && rowDate <= toDateObj;
      return valid;
    });
    setReportData((prev) => ({
      ...prev,
      tableData: filteredData,
    }));
    setCurrentPage(1);
  };

  const resetTableFilter = () => {
    setTableFilter({ fromDate: "", toDate: "" });
    setReportData((prev) => ({
      ...prev,
      tableData: prev.allTableData,
    }));

    // Reset to first page when clearing filter
    setCurrentPage(1);
  };

  /*   const downloadCSV = () => {
    const headers = [
      'Date', 'Operator ID', 'Operator Name', 'Total Hours', 
      'Sewing Hours', 'Idle Hours', 'Meeting Hours', 'No Feeding Hours', 
      'Maintenance Hours', 'Rework Hours', 'Needle Break Hours', 'Productive Time (%)', 'NPT (%)', 
      'Sewing Speed', 'Stitch Count', 'Needle Runtime'
    ];
    
    const csvRows = [
      headers.join(','),
      ...reportData.tableData.map(row => 
        headers.map(header => {
          const value = row[header] !== undefined ? 
            (header.includes('%') ? safeToFixed(row[header]) : 
             typeof row[header] === 'number' ? safeToFixed(row[header]) : 
             row[header]) : '';
          return `"${value}"`;
        }).join(',')
      )
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${operator_name}_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }; */

  // Add this function in OperatorReport.jsx above your return

  const downloadCSV = () => {
    const SUMMARY_TABLE_HEADS = [
      { label: "Date", key: "Date" },
      { label: "Operator ID", key: "Operator ID" },
      { label: "Operator Name", key: "Operator Name" },
      { label: "Total Hours", key: "Total Hours" },
      { label: "Sewing", key: "Sewing Hours" },
      { label: "Idle", key: "Idle Hours" },
      { label: "Rework", key: "Rework Hours" },
      { label: "No Feeding", key: "No Feeding Hours" },
      { label: "Meeting", key: "Meeting Hours" },
      { label: "Maintenance", key: "Maintenance Hours" },
      { label: "Needle Break", key: "Needle Break Hours" },
      { label: "PT(%)", key: "Productive Time %" },
      { label: "NPT(%)", key: "NPT %" },
      { label: "Needle Runtime (%)", key: "Needle Runtime" },
      { label: "Sewing Speed", key: "Sewing Speed" },
      { label: "Stitch Count", key: "Stitch Count" },
    ];

    const timeKeys = [
      "Total Hours",
      "Sewing Hours",
      "Idle Hours",
      "Rework Hours",
      "No Feeding Hours",
      "Meeting Hours",
      "Maintenance Hours",
      "Needle Break Hours",
    ];

    const headers = SUMMARY_TABLE_HEADS.map((head) => head.label);

    const rows = (reportData.tableData || []).map((row) => {
      // Calculate Needle Runtime % for this row
      let sewingHours = row["Sewing Hours"] || 0;
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
        head.key === "Needle Runtime"
          ? needleRuntimePercent.toFixed(2) + "%"
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
      `${operator_name}_report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <h2 class="title">Operator Report: ${operator_name}</h2>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Operator ID: ${
            reportData.tableData[0]?.["Operator ID"] || "N/A"
          }</p>
          <p>Total Production Hours: ${safeToFixed(
            reportData.totalProductionHours
          )}</p>
          <p>Total Non-Production Hours: ${safeToFixed(
            reportData.totalNonProductionHours
          )}</p>
          <p>Total Idle Hours: ${safeToFixed(reportData.totalIdleHours)}</p>
          <p>Total Rework Hours: ${safeToFixed(reportData.totalReworkHours)}</p>
          <p>Total Needle Break Hours: ${safeToFixed(
            reportData.totalNeedleBreakHours
          )}</p>
          <p>Needle Runtime Percentage: ${safeToFixed(
            reportData.needleRuntimePercentage
          )}%</p>
        </div>
        <table>
          <thead>
            <tr>
              ${[
                "Date",
                "Operator ID",
                "Operator Name",
                "Total Hours",
                "Sewing Hours",
                "Idle Hours",
                "Meeting Hours",
                "No Feeding Hours",
                "Maintenance Hours",
                "Rework Hours",
                "Needle Break Hours",
                "Productive Time (%)",
                "NPT (%)",
                "Sewing Speed",
                "Stitch Count",
                "Needle Runtime",
              ]
                .map((header) => `<th>${header}</th>`)
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${reportData.tableData
              .map(
                (row) =>
                  `<tr>
                ${[
                  "Date",
                  "Operator ID",
                  "Operator Name",
                  "Total Hours",
                  "Sewing Hours",
                  "Idle Hours",
                  "Meeting Hours",
                  "No Feeding Hours",
                  "Maintenance Hours",
                  "Rework Hours",
                  "Needle Break Hours",
                  "Productive Time (%)",
                  "NPT (%)",
                  "Sewing Speed",
                  "Stitch Count",
                  "Needle Runtime",
                ]
                  .map((header) => {
                    const value =
                      row[header] !== undefined
                        ? header.includes("%")
                          ? safeToFixed(row[header]) + "%"
                          : typeof row[header] === "number"
                          ? safeToFixed(row[header])
                          : row[header]
                        : "";
                    return `<td>${value}</td>`;
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
      `${operator_name}_report_${new Date().toISOString().slice(0, 10)}.html`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Utility to convert any hour input (decimal or "HH:MM") to total minutes
  const toTotalMinutes = (input) => {
    if (input === null || input === undefined || input === "") return 0;
    if (typeof input === "string" && input.includes(":")) {
      const [h, m] = input.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
    } else if (!isNaN(Number(input))) {
      const decimalHours = Number(input);
      return Math.round(decimalHours * 60);
    }
    return 0;
  };

  // Prepare data for Recharts
  const firstRow = reportData.tableData[0] || {};
  // Define consistent color mapping
  const colorMap = {
    "Sewing Hours": "#27ae60", // green
    "No Feeding Hours": "#2980b9", // blue
    "Maintenance Hours": "#f1c40f", // yellow
    "Meeting Hours": "#e74c3c", // red
    "Idle Hours": "#7f8c8d", // gray
    "Rework Hours": "#f39c12", // orange
    "Needle Break Hours": "#8e44ad", // purple
  };

  // --- FIX: Use cumulative for all operators ---
  // Cumulative pie chart for "All" operators
  const cumulativeRow =
    isAllOperators && sourceData && sourceData.length > 0
      ? sourceData.reduce((acc, row) => {
          [
            "Sewing Hours",
            "No Feeding Hours",
            "Maintenance Hours",
            "Meeting Hours",
            "Idle Hours",
            "Rework Hours",
            "Needle Break Hours",
          ].forEach((key) => {
            const toMinutes = (val) => {
              if (val === null || val === undefined || val === "") return 0;
              if (typeof val === "string" && val.includes(":")) {
                const [h, m] = val.split(":").map(Number);
                if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
              } else if (!isNaN(Number(val))) {
                return Math.round(Number(val) * 60);
              }
              return 0;
            };
            acc[key] = (acc[key] || 0) + toMinutes(row[key]);
          });
          return acc;
        }, {})
      : null;

  const chartData = [
    {
      name: "Sewing Hours",
      value: toTotalMinutes(firstRow["Sewing Hours"]),
      color: colorMap["Sewing Hours"],
    },
    {
      name: "No Feeding Hours",
      value: toTotalMinutes(firstRow["No Feeding Hours"]),
      color: colorMap["No Feeding Hours"],
    },
    {
      name: "Maintenance Hours",
      value: toTotalMinutes(firstRow["Maintenance Hours"]),
      color: colorMap["Maintenance Hours"],
    },
    {
      name: "Meeting Hours",
      value: toTotalMinutes(firstRow["Meeting Hours"]),
      color: colorMap["Meeting Hours"],
    },
    {
      name: "Idle Hours",
      value: toTotalMinutes(firstRow["Idle Hours"]),
      color: colorMap["Idle Hours"],
    },
    {
      name: "Rework Hours",
      value: toTotalMinutes(firstRow["Rework Hours"]),
      color: colorMap["Rework Hours"],
    },
    {
      name: "Needle Break Hours",
      value: toTotalMinutes(firstRow["Needle Break Hours"]),
      color: colorMap["Needle Break Hours"],
    },
  ].filter((item) => item.value > 0); // Only include items with values > 0

  const cumulativeChartData =
    isAllOperators && cumulativeRow
      ? [
          {
            name: "Sewing Hours",
            value: cumulativeRow["Sewing Hours"] || 0,
            color: colorMap["Sewing Hours"],
          },
          {
            name: "No Feeding Hours",
            value: cumulativeRow["No Feeding Hours"] || 0,
            color: colorMap["No Feeding Hours"],
          },
          {
            name: "Maintenance Hours",
            value: cumulativeRow["Maintenance Hours"] || 0,
            color: colorMap["Maintenance Hours"],
          },
          {
            name: "Meeting Hours",
            value: cumulativeRow["Meeting Hours"] || 0,
            color: colorMap["Meeting Hours"],
          },
          {
            name: "Idle Hours",
            value: cumulativeRow["Idle Hours"] || 0,
            color: colorMap["Idle Hours"],
          },
          {
            name: "Rework Hours",
            value: cumulativeRow["Rework Hours"] || 0,
            color: colorMap["Rework Hours"],
          },
          {
            name: "Needle Break Hours",
            value: cumulativeRow["Needle Break Hours"] || 0,
            color: colorMap["Needle Break Hours"],
          },
        ].filter((item) => item.value > 0)
      : null;

  return (
    <div className="operator-container">
      {dateError && (
        <div className="popup-overlay">
          <div className="popup-modal">
            <p>{dateError}</p>
            <button onClick={() => setDateError("")}>Close</button>
          </div>
        </div>
      )}
      <div className="table-section">
        <div className="table-header">
          <h3>Operator Report</h3>
          <div className="table-controls">
            <div className="filter-row"></div>

            <div className="actions-row">
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
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Operator ID</th>
                <th>Operator Name</th>
                <th>Total Hours</th>
                <th>Sewing</th>
                <th>Idle</th>
                <th>Rework</th>
                <th>No Feeding</th>
                <th>Meeting</th>
                <th>Maintenance</th>
                <th>Needle Break</th>
                <th>PT(%)</th>
                <th>NPT (%)</th>
                <th>Needle Runtime (%)</th>
                <th>Sewing Speed</th>
                <th>Stitch Count</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((row, index) => (
                <tr key={index}>
                  <td>{row.Date}</td>
                  <td>{row["Operator ID"]}</td>
                  <td>{row["Operator Name"]}</td>
                  <td>{formatHoursMinutes(row["Total Hours"])}</td>
                  <td>{formatHoursMinutes(row["Sewing Hours"])}</td>
                  <td>{formatHoursMinutes(row["Idle Hours"])}</td>
                  <td>{formatHoursMinutes(row["Rework Hours"])}</td>
                  <td>{formatHoursMinutes(row["No Feeding Hours"])}</td>
                  <td>{formatHoursMinutes(row["Meeting Hours"])}</td>
                  <td>{formatHoursMinutes(row["Maintenance Hours"])}</td>
                  <td>{formatHoursMinutes(row["Needle Break Hours"])}</td>
                  <td>{safeToFixed(row["Productive Time %"])}%</td>
                  <td>{safeToFixed(row["NPT %"])}%</td>
                  <td>
                    {(() => {
                      // Calculate Needle Runtime % = (Needle Runtime / Sewing Hours) * 100
                      const needleRuntime = Number(row["Needle Runtime"]);
                      const sewingHours = (() => {
                        const val = row["Sewing Hours"];
                        if (val === null || val === undefined || val === "")
                          return 0;
                        if (typeof val === "string" && val.includes(":")) {
                          const [h, m] = val.split(":").map(Number);
                          if (!isNaN(h) && !isNaN(m)) return h * 3600 + m * 60;
                        } else if (!isNaN(Number(val))) {
                          return Number(val) * 3600;
                        }
                        return 0;
                      })();
                      if (!needleRuntime || !sewingHours) return "-";
                      return (
                        safeToFixed((needleRuntime / sewingHours) * 100) + "%"
                      );
                    })()}
                  </td>
                  <td>{safeToFixed(row["Sewing Speed"])}</td>
                  <td>{row["Stitch Count"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="pagination-controls">
          <div className="rows-per-page">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              className="rows-select"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="pagination-info">
            <span>
              {indexOfFirstRow + 1}-
              {Math.min(indexOfLastRow, reportData.tableData.length)} of{" "}
              {reportData.tableData.length}
            </span>
          </div>

          <div className="pagination-buttons">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="page-button"
            >
              <FaAngleLeft />
            </button>

            {getPageNumbers().map((page, index) =>
              page === "..." ? (
                <span key={index} className="ellipsis">
                  ...
                </span>
              ) : (
                <button
                  key={index}
                  onClick={() => goToPage(page)}
                  className={`page-number ${
                    currentPage === page ? "active" : ""
                  }`}
                >
                  {page}
                </button>
              )
            )}

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="page-button"
            >
              <FaAngleRight />
            </button>
          </div>
        </div>
      </div>

      {/* Remove top indicators */}

      {/* Tiles section with updated names and Total Hours */}
      <div className="summary-tiles">
        <div className="tile production-percentage">
          <p>{safeToFixed(reportData.productionPercentage)}%</p>
          <span>Productive Time</span>
        </div>
        <div className="tile needle-runtime-percentage">
          <p>{safeToFixed(reportData.needleRuntimePercentage)}%</p>
          <span>Needle Time</span>
        </div>
        <div className="tile sewing-speed">
          <p>{safeToFixed(reportData.averageSewingSpeed)}</p>
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
                  data={
                    isAllOperators && cumulativeChartData
                      ? cumulativeChartData
                      : chartData
                  }
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(isAllOperators && cumulativeChartData
                    ? cumulativeChartData
                    : chartData
                  ).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => {
                    const hours = Math.floor(value / 60);
                    const minutes = value % 60;
                    let label = "";
                    if (hours > 0 && minutes > 0)
                      label = `${hours}h ${minutes}m`;
                    else if (hours > 0) label = `${hours}h 0m`;
                    else label = `0h ${minutes}m`;
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
          </div>
        </div>

        <div className="hour-breakdown">
          {[
            { key: "Sewing Hours", label: "Sewing Hours" },
            { key: "Idle Hours", label: "Idle Hours" },
            { key: "Rework Hours", label: "Rework Hours" },
            { key: "No Feeding Hours", label: "No Feeding Hours" },
            { key: "Meeting Hours", label: "Meeting Hours" },
            { key: "Maintenance Hours", label: "Maintenance Hours" },
            { key: "Needle Break Hours", label: "Needle Break Hours" },
          ].map(({ key, label }) => {
            let value;
            if (isAllOperators && cumulativeRow) {
              // Use cumulative total (in minutes) for all operators
              const totalMinutes = Math.round(Number(cumulativeRow[key]) || 0);
              const hours = Math.floor(totalMinutes / 60);
              const minutes = totalMinutes % 60;
              value = `${hours}h ${minutes}m`;
            } else {
              value = formatHoursMinutes(firstRow[key]);
            }
            if (
              value === "0" ||
              value === "-" ||
              value === "0m" ||
              value === "0h"
            )
              value = "0h 0m";
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
                  {value}
                </span>
                <span className="hour-desc" style={{ marginLeft: 8 }}>
                  : {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OperatorReport;
