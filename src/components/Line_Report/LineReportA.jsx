import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { FaTshirt, FaClock, FaTools, FaDownload } from "react-icons/fa";
import "./LineStyles.css";

const LineReportA = ({ lineNumber, fromDate, toDate }) => {
  const [reportData, setReportData] = useState({
    lineNumber: "",
    totalAvailableHours: 0,
    totalWorkingDays: 0,
    averageMachines: 0,
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
      },
    },
    totalStitchCount: 0,
    averageSewingSpeed: 0,
    totalNeedleRuntime: 0,
    needleRuntimePercentage: 0,
    tableData: [],
    allTableData: [],
  });

  const [tableFilter, setTableFilter] = useState({
    fromDate: "",
    toDate: "",
  });

  useEffect(() => {
    if (!lineNumber) return;
    const params = new URLSearchParams();
    if (fromDate) params.append("from_date", fromDate);
    if (toDate) params.append("to_date", toDate);

    fetch(
      `https://oceanatlantic.pinesphere.co.in/api/api/user-line-reports/${lineNumber}/?${params}`
    )
      .then((response) => response.json())
      .then((data) => {
        setReportData({
          ...data,
          tableData: data.tableData,
          allTableData: data.tableData,
        });
      })
      .catch((error) => console.error("Error fetching line report:", error));
  }, [lineNumber, fromDate, toDate]);

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

  const downloadCSV = () => {
    if (!reportData.tableData || reportData.tableData.length === 0) {
      console.error("No data available to download");
      return;
    }

    const headers = Object.keys(reportData.tableData[0] || {});
    const csvRows = [
      headers.join(","),
      ...reportData.tableData.map((row) =>
        headers
          .map((header) => `"${row[header] !== undefined ? row[header] : ""}"`)
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
      `line_${lineNumber}_report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const safeToFixed = (value, decimals = 2) => {
    if (value === undefined || value === null) return "0.00";
    if (typeof value !== "number") return value;
    return value.toFixed(decimals);
  };

  const downloadHTML = () => {
    if (!reportData.tableData || reportData.tableData.length === 0) {
      console.error("No data available to download");
      return;
    }

    const htmlContent = `<!DOCTYPE html>
      <html>
      <head>
        <title>Line ${lineNumber} Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .report-header { margin-bottom: 20px; }
          .summary-section { margin-bottom: 30px; }
          .summary-item { margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h1>Line ${lineNumber} Report</h1>
          <p>Date Range: ${fromDate || "N/A"} to ${toDate || "N/A"}</p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary-section">
          <h2>Summary</h2>
          <div class="summary-item">
            <strong>Total Available Hours:</strong> ${safeToFixed(
              reportData.totalAvailableHours
            )}
          </div>
          <div class="summary-item">
            <strong>Productive Time:</strong> ${safeToFixed(
              reportData.totalProductiveTime.hours
            )} Hrs (${safeToFixed(reportData.totalProductiveTime.percentage)}%)
          </div>
          <div class="summary-item">
            <strong>Non-Productive Time:</strong> ${safeToFixed(
              reportData.totalNonProductiveTime.hours
            )} Hrs (${safeToFixed(
      reportData.totalNonProductiveTime.percentage
    )}%)
          </div>
          <div class="summary-item">
            <strong>Average Sewing Speed:</strong> ${safeToFixed(
              reportData.averageSewingSpeed
            )}
          </div>
          <div class="summary-item">
            <strong>Needle Runtime:</strong> ${safeToFixed(
              reportData.needleRuntimePercentage
            )}%
          </div>
        </div>

        <h2>Detailed Data</h2>
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
                ${Object.values(row)
                  .map(
                    (value) =>
                      `<td>${
                        typeof value === "number"
                          ? safeToFixed(value)
                          : value || ""
                      }</td>`
                  )
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
      `line_${lineNumber}_report_${new Date().toISOString().slice(0, 10)}.html`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = [
    {
      name: "Sewing Hours",
      value: reportData.totalProductiveTime.hours,
      color: "#3E3561",
    },
    {
      name: "No Feeding Hours",
      value: reportData.totalNonProductiveTime.breakdown.noFeedingHours,
      color: "#8E44AD",
    },
    {
      name: "Meeting Hours",
      value: reportData.totalNonProductiveTime.breakdown.meetingHours,
      color: "#E74C3C",
    },
    {
      name: "Maintenance Hours",
      value: reportData.totalNonProductiveTime.breakdown.maintenanceHours,
      color: "#118374",
    },
    {
      name: "Idle Hours",
      value: reportData.totalNonProductiveTime.breakdown.idleHours,
      color: "#F8A723",
    },
  ].filter((item) => item.value > 0);

  return (
    <div className="line-container">
      <div className="table-section">
        <div className="table-header">
          <h3>Line {lineNumber} Report</h3>
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
                <th>Sewing Hours (PT)</th>
                <th>No Feeding Hours</th>
                <th>Meeting Hours</th>
                <th>Maintenance Hours</th>
                <th>Idle Hours</th>
                <th>Total Hours</th>
                <th>PT %</th>
                <th>NPT %</th>
                <th>Sewing Speed</th>
                <th>Stitch Count</th>
                <th>Needle Runtime</th>
                <th>Machine Count</th>
              </tr>
            </thead>
            <tbody>
              {reportData.tableData.map((row, index) => (
                <tr key={index}>
                  <td>{row.Date}</td>
                  <td>{safeToFixed(row["Sewing Hours (PT)"])}</td>
                  <td>{safeToFixed(row["No Feeding Hours"])}</td>
                  <td>{safeToFixed(row["Meeting Hours"])}</td>
                  <td>{safeToFixed(row["Maintenance Hours"])}</td>
                  <td>{safeToFixed(row["Idle Hours"])}</td>
                  <td>{safeToFixed(row["Total Hours"])}</td>
                  <td>{safeToFixed(row["Productive Time (PT) %"])}%</td>
                  <td>{safeToFixed(row["Non-Productive Time (NPT) %"])}%</td>
                  <td>{safeToFixed(row["Sewing Speed"])}</td>
                  <td>{row["Stitch Count"] || "0"}</td>
                  <td>{safeToFixed(row["Needle Runtime"])}</td>
                  <td>{row["Machine Count"] || "0"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="top-indicators">
        <div className="indicator">
          <h4>
            <FaTshirt /> Total Sewing Hours
          </h4>
          <p>{safeToFixed(reportData.totalProductiveTime.hours)} Hrs</p>
        </div>
        <div className="indicator">
          <h4>
            <FaTools /> Total Non-Productive Hours
          </h4>
          <p>{safeToFixed(reportData.totalNonProductiveTime.hours)} Hrs</p>
        </div>
        <div className="indicator">
          <h4>
            <FaClock /> Total Hours
          </h4>
          <p>{safeToFixed(reportData.totalHours)} Hrs</p>
        </div>
      </div>

      <div className="summary-tiles">
        <div className="tile production-percentage">
          <p>{safeToFixed(reportData.totalProductiveTime.percentage)}%</p>
          <span>Productive Time</span>
        </div>
        <div className="tile average-speed">
          <p>{safeToFixed(reportData.averageSewingSpeed)}</p>
          <span>Avg Sewing Speed</span>
        </div>
        <div className="tile needle-runtime-percentage">
          <p>{safeToFixed(reportData.needleRuntimePercentage)}%</p>
          <span>Needle Runtime</span>
        </div>
      </div>

      <div className="chart-breakdown-container">
        <div className="graph-section">
          <h3>
            Hours Breakdown (Total: {safeToFixed(reportData.totalHours)} Hrs)
          </h3>
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
                  formatter={(value) => safeToFixed(value) + " Hrs"}
                  labelFormatter={(_, payload) => payload[0]?.name || ""}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div
            className="total-hours"
            style={{ textAlign: "center", marginTop: "10px" }}
          >
            <strong>
              Total Hours: {safeToFixed(reportData.totalHours)} Hrs
            </strong>
          </div>
        </div>

        <div className="hour-breakdown">
          <div className="hour-box">
            <span className="dot production"></span>
            <p>
              {safeToFixed(reportData.totalProductiveTime.hours)} Hrs: Sewing
              Hours
            </p>
          </div>
          <div className="hour-box">
            <span className="dot no-feeding"></span>
            <p>
              {safeToFixed(
                reportData.totalNonProductiveTime.breakdown.noFeedingHours
              )}{" "}
              Hrs: No Feeding
            </p>
          </div>
          <div className="hour-box">
            <span className="dot meeting"></span>
            <p>
              {safeToFixed(
                reportData.totalNonProductiveTime.breakdown.meetingHours
              )}{" "}
              Hrs: Meetings
            </p>
          </div>
          <div className="hour-box">
            <span className="dot maintenances"></span>
            <p>
              {safeToFixed(
                reportData.totalNonProductiveTime.breakdown.maintenanceHours
              )}{" "}
              Hrs: Maintenance
            </p>
          </div>
          <div className="hour-box">
            <span className="dot idle"></span>
            <p>
              {safeToFixed(
                reportData.totalNonProductiveTime.breakdown.idleHours
              )}{" "}
              Hrs: Idle Time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineReportA;
