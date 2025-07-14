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

const OperatorReport = ({ operator_name, fromDate, toDate }) => {
  const [reportData, setReportData] = useState({
    totalProductionHours: 0,
    totalNonProductionHours: 0,
    totalIdleHours: 0,
    todayProductionHours: 0,
    todayNonProductionHours: 0,
    todayIdleHours: 0,
    todaySewingHours: 0,
    todayNoFeedingHours: 0,
    todayMaintenanceHours: 0,
    todayMeetingHours: 0,
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

  useEffect(() => {
    if (!operator_name) return;

    const params = new URLSearchParams({
      from_date: fromDate || "",
      to_date: toDate || "",
    });

    fetch(
      `http://127.0.0.1:8000/api/operator_report_by_name/${operator_name}/?${params}`
    )
      .then((response) => response.json())
      .then((data) => {
        const allTableData = data.tableData;

        const totalSewingHours = allTableData.reduce(
          (sum, row) => sum + row["Sewing Hours"],
          0
        );
        const totalIdleHours = allTableData.reduce(
          (sum, row) => sum + row["Idle Hours"],
          0
        );
        const totalMeetingHours = allTableData.reduce(
          (sum, row) => sum + row["Meeting Hours"],
          0
        );
        const totalNoFeedingHours = allTableData.reduce(
          (sum, row) => sum + row["No Feeding Hours"],
          0
        );
        const totalMaintenanceHours = allTableData.reduce(
          (sum, row) => sum + row["Maintenance Hours"],
          0
        );

        setReportData({
          ...data,
          todaySewingHours: totalSewingHours,
          todayIdleHours: totalIdleHours,
          todayMeetingHours: totalMeetingHours,
          todayNoFeedingHours: totalNoFeedingHours,
          todayMaintenanceHours: totalMaintenanceHours,
          tableData: allTableData,
          allTableData: allTableData,
        });

        // Log summary table data
        console.log("==== OPERATOR SUMMARY TABLE DATA ====");
        console.log("Operator Name:", operator_name);
        console.log(
          "Total Production Hours:",
          data.totalProductionHours.toFixed(2)
        );
        console.log(
          "Total Non-Production Hours:",
          data.totalNonProductionHours.toFixed(2)
        );
        console.log("Total Idle Hours:", data.totalIdleHours.toFixed(2));
        console.log(
          "Total Hours:",
          data.totalHours ? data.totalHours.toFixed(2) : "0.00"
        );
        console.log(
          "Production Percentage:",
          data.productionPercentage.toFixed(2) + "%"
        );
        console.log("NPT Percentage:", data.nptPercentage.toFixed(2) + "%");
        console.log(
          "Average Sewing Speed:",
          data.averageSewingSpeed.toFixed(2)
        );
        console.log(
          "Needle Runtime Percentage:",
          data.needleRuntimePercentage.toFixed(2) + "%"
        );
        console.log("Total Stitch Count:", data.totalStitchCount.toFixed(2));
        console.log(
          "Total Needle Runtime:",
          data.totalNeedleRuntime.toFixed(2)
        );
        console.log("Hours Breakdown:");
        console.log("- Sewing Hours:", totalSewingHours.toFixed(2));
        console.log("- No Feeding Hours:", totalNoFeedingHours.toFixed(2));
        console.log("- Maintenance Hours:", totalMaintenanceHours.toFixed(2));
        console.log("- Meeting Hours:", totalMeetingHours.toFixed(2));
        console.log("- Idle Hours:", totalIdleHours.toFixed(2));
        console.log("================================");

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

    // Reset to first page when filtering
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

  const downloadCSV = () => {
    const headers = [
      "Date",
      "Operator ID",
      "Operator Name",
      "Total Hours",
      "Sewing Hours",
      "Idle Hours",
      "Meeting Hours",
      "No Feeding Hours",
      "Maintenance Hours",
      "Productive Time (%)",
      "NPT (%)",
      "Sewing Speed",
      "Stitch Count",
      "Needle Runtime",
    ];

    const csvRows = [
      headers.join(","),
      ...reportData.tableData.map((row) =>
        headers
          .map((header) => {
            const value =
              row[header] !== undefined
                ? header.includes("%")
                  ? row[header]
                  : typeof row[header] === "number"
                  ? row[header].toFixed(2)
                  : row[header]
                : "";
            return `"${value}"`;
          })
          .join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");
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

  const logTableData = () => {
    console.log("==== CURRENT TABLE DATA ====");
    console.log(
      "Showing rows:",
      indexOfFirstRow + 1,
      "to",
      Math.min(indexOfLastRow, reportData.tableData.length),
      "of",
      reportData.tableData.length
    );
    console.log("Current page:", currentPage, "of", totalPages);

    console.table(currentRows);

    // Additional summary for current page
    const pageSummary = {
      totalSewingHours: currentRows.reduce(
        (sum, row) => sum + row["Sewing Hours"],
        0
      ),
      totalIdleHours: currentRows.reduce(
        (sum, row) => sum + row["Idle Hours"],
        0
      ),
      totalMeetingHours: currentRows.reduce(
        (sum, row) => sum + row["Meeting Hours"],
        0
      ),
      totalNoFeedingHours: currentRows.reduce(
        (sum, row) => sum + row["No Feeding Hours"],
        0
      ),
      totalMaintenanceHours: currentRows.reduce(
        (sum, row) => sum + row["Maintenance Hours"],
        0
      ),
      averageProductiveTime:
        currentRows.reduce((sum, row) => sum + row["Productive Time in %"], 0) /
        currentRows.length,
      averageNPT:
        currentRows.reduce((sum, row) => sum + row["NPT in %"], 0) /
        currentRows.length,
    };

    console.log("Current page summary:");
    console.log(
      "- Total Sewing Hours:",
      pageSummary.totalSewingHours.toFixed(2)
    );
    console.log("- Total Idle Hours:", pageSummary.totalIdleHours.toFixed(2));
    console.log(
      "- Total Meeting Hours:",
      pageSummary.totalMeetingHours.toFixed(2)
    );
    console.log(
      "- Total No Feeding Hours:",
      pageSummary.totalNoFeedingHours.toFixed(2)
    );
    console.log(
      "- Total Maintenance Hours:",
      pageSummary.totalMaintenanceHours.toFixed(2)
    );
    console.log(
      "- Average Productive Time:",
      pageSummary.averageProductiveTime.toFixed(2) + "%"
    );
    console.log("- Average NPT:", pageSummary.averageNPT.toFixed(2) + "%");
    console.log("================================");
  };

  const downloadHTML = () => {
    const htmlContent = `<!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .title { text-align: center; }
          .summary { margin-bottom: 20px; }
          .summary-header { color: #3E3561; margin: 20px 0 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
          .summary-table th, .summary-table td { text-align: center; }
        </style>
      </head>
      <body>
        <div class="summary">
          <h2 class="title">Operator Report: ${operator_name}</h2>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Operator ID: ${
            reportData.tableData[0]?.["Operator ID"] || "N/A"
          }</p>
          
          <h3 class="summary-header">Consolidated Summary</h3>
          <table class="summary-table">
            <thead>
              <tr>
                <th>Total Hours</th>
                <th>Production Hours</th>
                <th>Non-Production Hours</th>
                <th>Production %</th>
                <th>NPT %</th>
                <th>Average Speed</th>
                <th>Needle Runtime %</th>
                <th>Total Stitch Count</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${reportData.totalHours?.toFixed(2) || "0.00"}</td>
                <td>${reportData.totalProductionHours.toFixed(2)}</td>
                <td>${reportData.totalNonProductionHours.toFixed(2)}</td>
                <td>${reportData.productionPercentage.toFixed(2)}%</td>
                <td>${reportData.nptPercentage.toFixed(2)}%</td>
                <td>${reportData.averageSewingSpeed.toFixed(2)}</td>
                <td>${reportData.needleRuntimePercentage.toFixed(2)}%</td>
                <td>${reportData.totalStitchCount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <h3 class="summary-header">Hours Breakdown Summary</h3>
          <table class="summary-table">
            <thead>
              <tr>
                <th>Sewing Hours</th>
                <th>Idle Hours</th>
                <th>Meeting Hours</th>
                <th>No Feeding Hours</th>
                <th>Maintenance Hours</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${reportData.todaySewingHours.toFixed(2)}</td>
                <td>${reportData.todayIdleHours.toFixed(2)}</td>
                <td>${reportData.todayMeetingHours.toFixed(2)}</td>
                <td>${reportData.todayNoFeedingHours.toFixed(2)}</td>
                <td>${reportData.todayMaintenanceHours.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <h3 class="summary-header">Detailed Data</h3>
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
                  "Productive Time in %",
                  "NPT in %",
                  "Sewing Speed",
                  "Stitch Count",
                  "Needle Runtime",
                ]
                  .map((header) => {
                    const value =
                      row[header] !== undefined
                        ? header.includes("%")
                          ? row[header].toFixed(2) + "%"
                          : typeof row[header] === "number"
                          ? row[header].toFixed(2)
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

  const totalTodayHours =
    reportData.todaySewingHours +
    reportData.todayIdleHours +
    reportData.todayMeetingHours +
    reportData.todayNoFeedingHours +
    reportData.todayMaintenanceHours;

  // Prepare data for Recharts
  const chartData = [
    {
      name: "Sewing Hours",
      value: reportData.todaySewingHours,
      color: "#3E3561",
    },
    {
      name: "No Feeding Hours",
      value: reportData.todayNoFeedingHours,
      color: "#118374",
    },
    {
      name: "Maintenance Hours",
      value: reportData.todayMaintenanceHours,
      color: "#F8A723",
    },
    {
      name: "Meeting Hours",
      value: reportData.todayMeetingHours,
      color: "#E74C3C",
    },
    { name: "Idle Hours", value: reportData.todayIdleHours, color: "#8E44AD" },
  ].filter((item) => item.value > 0); // Only include items with values > 0

  // Log hours breakdown when chart data changes
  useEffect(() => {
    if (chartData.length > 0) {
      console.log("==== HOURS BREAKDOWN CHART DATA ====");
      console.log("Total Hours:", totalTodayHours.toFixed(2));
      chartData.forEach((item) => {
        console.log(
          `- ${item.name}: ${item.value.toFixed(2)} (${(
            (item.value / totalTodayHours) *
            100
          ).toFixed(2)}%)`
        );
      });
      console.log("================================");
    }
  }, [chartData, totalTodayHours]);

  return (
    <div className="operator-container">
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
                <button onClick={logTableData} className="download-button">
                  Log Data
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Table with Consolidated Data */}
        <div className="summary-table-section">
          <h4>Consolidated Summary for {operator_name}</h4>
          <table className="summary-table">
            <thead>
              <tr>
                <th>Total Hours</th>
                <th>Production Hours</th>
                <th>Non-Production Hours</th>
                <th>Production %</th>
                <th>NPT %</th>
                <th>Average Speed</th>
                <th>Needle Runtime %</th>
                <th>Total Stitch Count</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{reportData.totalHours?.toFixed(2) || "0.00"}</td>
                <td>{reportData.totalProductionHours.toFixed(2)}</td>
                <td>{reportData.totalNonProductionHours.toFixed(2)}</td>
                <td>{reportData.productionPercentage.toFixed(2)}%</td>
                <td>{reportData.nptPercentage.toFixed(2)}%</td>
                <td>{reportData.averageSewingSpeed.toFixed(2)}</td>
                <td>{reportData.needleRuntimePercentage.toFixed(2)}%</td>
                <td>{reportData.totalStitchCount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <h4>Hours Breakdown Summary</h4>
          <table className="summary-table">
            <thead>
              <tr>
                <th>Sewing Hours</th>
                <th>Idle Hours</th>
                <th>Meeting Hours</th>
                <th>No Feeding Hours</th>
                <th>Maintenance Hours</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{reportData.todaySewingHours.toFixed(2)}</td>
                <td>{reportData.todayIdleHours.toFixed(2)}</td>
                <td>{reportData.todayMeetingHours.toFixed(2)}</td>
                <td>{reportData.todayNoFeedingHours.toFixed(2)}</td>
                <td>{reportData.todayMaintenanceHours.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Operator ID</th>
                <th>Operator Name</th>
                <th>Total Hours</th>
                <th>Sewing Hours</th>
                <th>Idle Hours</th>
                <th>Meeting Hours</th>
                <th>No Feeding Hours</th>
                <th>Maintenance Hours</th>
                <th>Productive Time (%)</th>
                <th>NPT (%)</th>
                <th>Sewing Speed</th>
                <th>Stitch Count</th>
                <th>Needle Runtime</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((row, index) => (
                <tr key={index}>
                  <td>{row.Date}</td>
                  <td>{row["Operator ID"]}</td>
                  <td>{row["Operator Name"]}</td>
                  <td>{row["Total Hours"]?.toFixed(2) || "0.00"}</td>
                  <td>{row["Sewing Hours"].toFixed(2)}</td>
                  <td>{row["Idle Hours"].toFixed(2)}</td>
                  <td>{row["Meeting Hours"].toFixed(2)}</td>
                  <td>{row["No Feeding Hours"].toFixed(2)}</td>
                  <td>{row["Maintenance Hours"].toFixed(2)}</td>
                  <td>{row["Productive Time in %"].toFixed(2)}%</td>
                  <td>{row["NPT in %"].toFixed(2)}%</td>
                  <td>{row["Sewing Speed"].toFixed(2)}</td>
                  <td>{row["Stitch Count"].toFixed(2)}</td>
                  <td>{row["Needle Runtime"].toFixed(2)}</td>
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

      <div className="top-indicators">
        <div className="indicator">
          <h4>
            <FaTshirt /> Total Sewing Hours
          </h4>
          <p>{reportData.totalProductionHours.toFixed(2)} Hrs</p>
        </div>
        <div className="indicator">
          <h4>
            <FaTools /> Total Non-Production Hours
          </h4>
          <p>{reportData.totalNonProductionHours.toFixed(2)} Hrs</p>
        </div>
        <div className="indicator">
          <h4>
            <FaClock /> Total Hours
          </h4>
          <p>{reportData.totalHours?.toFixed(2) || "0.00"} Hrs</p>
        </div>
      </div>

      <div className="summary-tiles">
        <div className="tile production-percentage">
          <p>{reportData.productionPercentage.toFixed(2)}%</p>
          <span>Production Percentage</span>
        </div>
        <div className="tile average-speed">
          <p>{reportData.averageSewingSpeed.toFixed(2)}</p>
          <span>Average Sewing Speed</span>
        </div>
        <div className="tile needle-runtime-percentage">
          <p>{reportData.needleRuntimePercentage.toFixed(2)}%</p>
          <span>Needle Runtime Percentage</span>
        </div>
      </div>

      <div className="chart-breakdown-container">
        <div className="graph-section">
          <h3>Hours Breakdown</h3>
          <div style={{ width: "100%", height: "320px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => value.toFixed(2) + " Hrs"}
                  labelFormatter={(_, payload) => payload[0]?.name || ""}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div
            className="total-hours"
            style={{ textAlign: "center", marginTop: "10px" }}
          >
            <strong>Total Hours: {totalTodayHours.toFixed(2)} Hrs</strong>
          </div>
        </div>

        <div className="hour-breakdown">
          <div className="hour-box">
            <span className="dot production"></span>
            <p>{reportData.todaySewingHours.toFixed(2)} Hrs: Sewing Hours</p>
          </div>
          <div className="hour-box">
            <span className="dot non-production"></span>
            <p>
              {reportData.todayNoFeedingHours.toFixed(2)} Hrs: No Feeding Hours
            </p>
          </div>
          <div className="hour-box">
            <span className="dot idle"></span>
            <p>
              {reportData.todayMaintenanceHours.toFixed(2)} Hrs: Maintenance
              Hours
            </p>
          </div>
          <div className="hour-box">
            <span className="dot meeting"></span>
            <p>{reportData.todayMeetingHours.toFixed(2)} Hrs: Meeting Hours</p>
          </div>
          <div className="hour-box">
            <span className="dot no-feeding"></span>
            <p>{reportData.todayIdleHours.toFixed(2)} Hrs: Idle Hours</p>
          </div>
          {/* Debug button to log hours breakdown data */}
          <div className="hour-box">
            <button
              onClick={() => {
                console.log("==== HOURS BREAKDOWN DATA ====");
                console.log(
                  "Production (Sewing Hours):",
                  reportData.todaySewingHours.toFixed(2)
                );
                console.log(
                  "Non-Production (No Feeding Hours):",
                  reportData.todayNoFeedingHours.toFixed(2)
                );
                console.log(
                  "Idle (Maintenance Hours):",
                  reportData.todayMaintenanceHours.toFixed(2)
                );
                console.log(
                  "Meeting Hours:",
                  reportData.todayMeetingHours.toFixed(2)
                );
                console.log(
                  "No Feeding (Idle Hours):",
                  reportData.todayIdleHours.toFixed(2)
                );
                console.log("Total Hours:", totalTodayHours.toFixed(2));
                console.log("================================");
              }}
              className="download-button"
            >
              Log Hours
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorReport;
