import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FaTshirt, FaClock, FaTools, FaDownload, FaTable, FaChartBar, FaAngleLeft, FaAngleRight, FaAngleDoubleLeft, FaAngleDoubleRight } from "react-icons/fa";
import "./LineStyles.css";

const SUMMARY_TABLE_HEADS = [
  { label: "Date", key: "Date" },
  { label: "Line Number", key: "Line Number" },
  { label: "Total Hours", key: "Total Hours" },
  { label: "Sewing ", key: "Sewing Hours (PT)" },
  { label: "Idle Hours", key: "Idle Hours" },
  { label: "Rework", key: "Rework Hours" },
  { label: "No Feeding ", key: "No Feeding Hours" },
  { label: "Meeting", key: "Meeting Hours" },
  { label: "Maintenance ", key: "Maintenance Hours" },
  { label: "Needle Break", key: "Needle Break Hours" },
  { label: "PT %", key: "Productive Time (PT) %" },
  { label: "NPT %", key: "Non-Productive Time (NPT) %" },
  { label: "Needle Runtime %", key: "Needle Runtime Percentage" }, // Moved Needle Runtime % after NPT %
  { label: "Sewing Speed", key: "Sewing Speed" },
  { label: "Stitch Count", key: "Stitch Count" },
  { label: "Machine Count", key: "Machine Count" }
];

const DETAILED_TABLE_HEADS = [
  { label: "S.No", key: "serial_number" },
  { label: "Machine ID", key: "MACHINE_ID" },
  { label: "Line Number", key: "LINE_NUMB" },
  { label: "Operator ID", key: "OPERATOR_ID" },
  { label: "Operator Name", key: "operator_name" },
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
  { label: "TX Log ID", key: "Tx_LOGID" },
  { label: "STR Log ID", key: "Str_LOGID" },
  { label: "Created At", key: "created_at" }
];

const formatConsistentDateTime = (dateTimeString) => {
  if (!dateTimeString) return "-";
  try {
    const dateTime = new Date(dateTimeString);
    const year = dateTime.getFullYear();
    const month = String(dateTime.getMonth() + 1).padStart(2, '0');
    const day = String(dateTime.getDate()).padStart(2, '0');
    const hours = String(dateTime.getHours()).padStart(2, '0');
    const minutes = String(dateTime.getMinutes()).padStart(2, '0');
    const seconds = String(dateTime.getSeconds()).padStart(2, '0');
    const ms = String(dateTime.getMilliseconds()).padStart(3, '0').slice(0, 2);
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
  } catch (e) {
    console.error("Date formatting error:", e);
    return dateTimeString;
  }
};

// Utility to format decimal hours to hh:mm
const formatToHHMM = (decimalHours) => {
  if (typeof decimalHours !== 'number' || isNaN(decimalHours)) return '00:00';
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Utility to convert decimal hours, seconds, or "HH:MM" string to "H hours M minutes" format
const formatHoursMinutes = (input) => {
  if (input === null || input === undefined || input === "") return "-";
  let hours = 0, minutes = 0;
  if (typeof input === "string" && input.includes(":")) {
    const [h, m] = input.split(":").map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      hours = h;
      minutes = m;
    }
  } else if (!isNaN(Number(input))) {
    const num = Number(input);
    if (num > 10000) { // treat as seconds if very large
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

// Consistent color mapping (same as LineReport/OperatorReport)
const colorMap = {
  "Sewing Hours": "#27ae60", // green
  "No Feeding Hours": "#2980b9", // blue
  "Maintenance Hours": "#f1c40f", // yellow
  "Meeting Hours": "#e74c3c", // red
  "Idle Hours": "#7f8c8d", // gray
  "Rework Hours": "#f39c12", // orange
  "Needle Break Hours": "#8e44ad" // purple
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

// Utility to calculate needle runtime percentage for a row (like MachineReport/OperatorReport)

const getNeedleRuntimePercentage = (row) => {
  let sewingHours = row["Sewing Hours (PT)"];
  let needleRuntime = row["Needle Runtime"];
  let sewingSeconds = 0;

  if (typeof sewingHours === "string" && sewingHours.includes(":")) {
    const [h, m] = sewingHours.split(":").map(Number);
    sewingSeconds = (isNaN(h) ? 0 : h) * 3600 + (isNaN(m) ? 0 : m) * 60;
  } else if (!isNaN(Number(sewingHours))) {
    const num = Number(sewingHours);
    sewingSeconds = num * 3600;
  }

  if (!needleRuntime || !sewingSeconds) return 0;
  return ((needleRuntime / sewingSeconds) * 100);
};

// Utility for safe number formatting
const safeToFixed = (value, digits = 2) => {
  const num = Number(value);
  return isNaN(num) ? '0.00' : num.toFixed(digits);
};

const AllLinesReport = ({ reportData, summary, fromDate, toDate, detailedData }) => {

  console.log("AllLinesReport summary prop:", summary);
  const [showTableView, setShowTableView] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);


  
  const toggleView = () => {
    setShowTableView(!showTableView);
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalRows = detailedData.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = detailedData.slice(indexOfFirstRow, indexOfLastRow);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToFirstPage = () => paginate(1);
  const goToLastPage = () => paginate(totalPages);
  const goToNextPage = () => currentPage < totalPages && paginate(currentPage + 1);
  const goToPreviousPage = () => currentPage > 1 && paginate(currentPage - 1);


  /**
   * Download CSV function
   */
  const downloadCSV = () => {
    const headers = showTableView 
      ? DETAILED_TABLE_HEADS.map(head => head.label) 
      : SUMMARY_TABLE_HEADS.map(head => head.label);
    
    const rows = showTableView
      ? detailedData.map((row, index) => 
          DETAILED_TABLE_HEADS.map(head => 
            head.key === "serial_number" ? index + 1 : 
            head.key === "created_at" && row[head.key] ? formatConsistentDateTime(row[head.key]) :
            row[head.key] || ""
          )
        )
           : reportData.flatMap(line => (line.tableData || []).map(row =>
                   SUMMARY_TABLE_HEADS.map(head =>
            head.key === "Line Number"
              ? line.lineNumber || ""
              : [
                  "Total Hours",
                  "Sewing Hours (PT)",
                  "Idle Hours",
                  "Rework Hours",
                  "No Feeding Hours",
                  "Meeting Hours",
                  "Maintenance Hours",
                  "Needle Break Hours",
                ].includes(head.key)
                ? formatHoursMinutes(row[head.key])
                : head.key === "Needle Runtime Percentage"
                  ? getNeedleRuntimePercentage(row)
                  : row[head.key]?.toFixed
                    ? row[head.key].toFixed(2)
                    : row[head.key] || ""
          )
))
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `all_lines_${showTableView ? 'raw_data' : 'summary'}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadHTML = () => {
    const headers = showTableView 
      ? DETAILED_TABLE_HEADS.map(head => `<th>${head.label}</th>`).join('')
      : SUMMARY_TABLE_HEADS.map(head => `<th>${head.label}</th>`).join('');
    
    const rows = showTableView
      ? detailedData.map((row, index) => `
          <tr>
            ${DETAILED_TABLE_HEADS.map(head => `
              <td>${
                head.key === "serial_number" ? index + 1 : 
                head.key === "created_at" && row[head.key] ? formatConsistentDateTime(row[head.key]) :
                row[head.key] || ''
              }</td>
            `).join('')}
          </tr>
        `).join('')
      : reportData.flatMap(line => line.tableData || []).map(row => `
          <tr>
            ${SUMMARY_TABLE_HEADS.map(head => `
              <td>${row[head.key]?.toFixed ? row[head.key].toFixed(2) : row[head.key] || ''}</td>
            `).join('')}
          </tr>
        `).join('');

    const htmlContent = `<!DOCTYPE html>
      <html>
      <head>
        <title>${showTableView ? 'All Lines Raw Data' : 'All Lines Summary'}</title>
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
        <h1>${showTableView ? 'All Lines Raw Data Report' : 'All Lines Summary Report'}</h1>
        <div class="report-info">
          <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
          ${fromDate ? `<p><strong>From Date:</strong> ${new Date(fromDate).toLocaleDateString()}</p>` : ''}
          ${toDate ? `<p><strong>To Date:</strong> ${new Date(toDate).toLocaleDateString()}</p>` : ''}
        </div>
        <table>
          <thead><tr>${headers}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
      </html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `all_lines_${showTableView ? 'raw_data' : 'summary'}_${new Date().toISOString().slice(0,10)}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate totals
  const totals = reportData.reduce((acc, line) => {
    acc.totalHours += line.totalHours || 0;
    acc.totalProductiveHours += line.totalProductiveTime?.hours || 0;
    acc.totalNonProductiveHours += line.totalNonProductiveTime?.hours || 0;
    acc.totalNoFeedingHours += line.totalNonProductiveTime?.breakdown?.noFeedingHours || 0;
    acc.totalMeetingHours += line.totalNonProductiveTime?.breakdown?.meetingHours || 0;
    acc.totalMaintenanceHours += line.totalNonProductiveTime?.breakdown?.maintenanceHours || 0;
    acc.totalReworkHours += line.totalNonProductiveTime?.breakdown?.reworkHours || 0;
    acc.totalNeedleBreakHours += line.totalNonProductiveTime?.breakdown?.needleBreakHours || 0;
    acc.totalIdleHours += line.totalNonProductiveTime?.breakdown?.idleHours || 0;
    return acc;
  }, {
    totalHours: 0,
    totalProductiveHours: 0,
    totalNonProductiveHours: 0,
    totalNoFeedingHours: 0,
    totalMeetingHours: 0,
    totalMaintenanceHours: 0,
    totalReworkHours: 0,
    totalNeedleBreakHours: 0,
    totalIdleHours: 0
  });

  const averageProductivePercentage = totals.totalHours > 0 ? 
    (totals.totalProductiveHours / totals.totalHours) * 100 : 0;
  const averageNonProductivePercentage = totals.totalHours > 0 ? 
    (totals.totalNonProductiveHours / totals.totalHours) * 100 : 0;
  const averageNeedleRuntimePercentage = reportData.length > 0 ? 
    reportData.reduce((sum, line) => sum + (line.needleRuntimePercentage || 0), 0) / reportData.length : 0;
  const averageSewingSpeed = reportData.length > 0 ? 
    reportData.reduce((sum, line) => sum + (line.averageSewingSpeed || 0), 0) / reportData.length : 0;

  // Use colorMap for chartData
  const chartData = [
    { name: "Sewing Hours", value: totals.totalProductiveHours, color: colorMap["Sewing Hours"] },
    { name: "No Feeding Hours", value: totals.totalNoFeedingHours, color: colorMap["No Feeding Hours"] },
    { name: "Meeting Hours", value: totals.totalMeetingHours, color: colorMap["Meeting Hours"] },
    { name: "Maintenance Hours", value: totals.totalMaintenanceHours, color: colorMap["Maintenance Hours"] },
    { name: "Rework Hours", value: totals.totalReworkHours, color: colorMap["Rework Hours"] },
    { name: "Needle Break Hours", value: totals.totalNeedleBreakHours, color: colorMap["Needle Break Hours"] },
    { name: "Idle Hours", value: totals.totalIdleHours, color: colorMap["Idle Hours"] }
  ]; // Do not filter out small values so all segments show
  
  if (showTableView) {
    return (
      <div className="line-container">
        <div className="table-section">
          <div className="table-header">
            <h3>All Lines Raw Data</h3>
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
              Showing {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, totalRows)} of {totalRows} rows
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
              <span>Page {currentPage} of {totalPages}</span>
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
                {currentRows.map((dataItem, index) => (
                  <tr key={indexOfFirstRow + index}>
                    <td>{indexOfFirstRow + index + 1}</td>
                    <td>{dataItem.MACHINE_ID || '-'}</td>
                    <td>{dataItem.LINE_NUMB || '-'}</td>
                    <td>{dataItem.OPERATOR_ID || '-'}</td>
                    <td>{dataItem.operator_name || '-'}</td>
                    <td>{dataItem.DATE || '-'}</td>
                    <td>{dataItem.START_TIME || '-'}</td>
                    <td>{dataItem.END_TIME || '-'}</td>
                    <td>{dataItem.MODE || '-'}</td>
                    <td>{dataItem.mode_description || '-'}</td>
                    <td>{dataItem.STITCH_COUNT || '-'}</td>
                    <td>{dataItem.NEEDLE_RUNTIME || '-'}</td>
                    <td>{dataItem.NEEDLE_STOPTIME || '-'}</td>
                    <td>{dataItem.DEVICE_ID || '-'}</td>
                    <td>{dataItem.RESERVE || '-'}</td>
                    <td>{dataItem.Tx_LOGID || '-'}</td>
                    <td>{dataItem.Str_LOGID || '-'}</td>
                    <td>{dataItem.created_at ? formatConsistentDateTime(dataItem.created_at) : '-'}</td>
                  </tr>
                ))}
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
              <span>Page {currentPage} of {totalPages}</span>
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

  return (
    <div className="line-container">

      <div className="table-section">
        <div className="table-header">
          <h3>All Lines Report</h3>
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
              {reportData.flatMap(line => 
                (line.tableData || []).map((row, index) => (
                  <tr key={`${line.lineNumber}-${index}`}>
                    <td>{row.Date || '-'}</td>
                    <td>{line.lineNumber || '-'}</td>
                    <td>{formatHoursMinutes(row["Total Hours"])}</td>
                    <td>{formatHoursMinutes(row["Sewing Hours (PT)"])}</td>
                    <td>{formatHoursMinutes(row["Idle Hours"])}</td>
                    <td>{formatHoursMinutes(row["Rework Hours"])}</td>
                    <td>{formatHoursMinutes(row["No Feeding Hours"])}</td>
                    <td>{formatHoursMinutes(row["Meeting Hours"])}</td>
                    <td>{formatHoursMinutes(row["Maintenance Hours"])}</td>
                    <td>{formatHoursMinutes(row["Needle Break Hours"])}</td>
                    <td>{row["Productive Time (PT) %"]?.toFixed(2) || '0.00'}%</td>
                    <td>{row["Non-Productive Time (NPT) %"]?.toFixed(2) || '0.00'}%</td>
                   {/*  <td>{getNeedleRuntimePercentage(row)}%</td> */} {/* Needle Runtime % after NPT % */}
                    <td>{safeToFixed(row["Needle Runtime Percentage"])}%</td>                    <td>{row["Stitch Count"] || '0'}</td>
                    <td>{row["Machine Count"] || '0'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

        <div className="summary-tiles">
        <div className="tile production-percentage">
          <p>
            {summary && summary.totalProductiveTime
              ? safeToFixed(summary.totalProductiveTime.percentage)
              : "0.00"}%
          </p>
          <span>Productive Time %</span>
        </div>
        <div className="tile needle-runtime-percentage">
          <p>
            {summary && summary.needleRuntimePercentage !== undefined
              ? safeToFixed(summary.needleRuntimePercentage)
              : "0.00"}%
          </p>
          <span>Needle Runtime %</span>
        </div>
        <div className="tile sewing-speed">
          <p>
            {summary && summary.averageSewingSpeed !== undefined
              ? safeToFixed(summary.averageSewingSpeed)
              : "0.00"}
          </p>
          <span>Sewing Speed</span>
        </div>
        <div className="tile total-hours">
          <p>
            {summary && summary.totalHours !== undefined
              ? formatHoursMinutes(summary.totalHours)
              : "0"}
          </p>
          <span>Total Hours</span>
        </div>
      </div>

      <div className="chart-breakdown-container">
        <div className="graph-section">
         
          <div style={{ width: '100%', height: '320px' }}>
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
                  minAngle={5} // Ensures small slices are visible
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [
                    formatHoursMinutes(value),
                    name
                  ]}
                  labelFormatter={(_, payload) => payload[0]?.name || ""}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="total-hours" style={{ textAlign: 'center', marginTop: '10px' }}>
            <strong>Total Hours: {formatHoursMinutes(totals.totalHours)}</strong>
          </div>
        </div>

        <div className="hour-breakdown">
          <div className="hour-box">
            <span className="dot production"></span>
            <p>{formatHoursMinutes(totals.totalProductiveHours)}: Sewing Hours</p>
          </div>
          <div className="hour-box">
            <span className="dot no-feeding"></span>
            <p>{formatHoursMinutes(totals.totalNoFeedingHours)}: No Feeding</p>
          </div>
          <div className="hour-box">
            <span className="dot meeting"></span>
            <p>{formatHoursMinutes(totals.totalMeetingHours)}: Meetings</p>
          </div>
          <div className="hour-box">
            <span className="dot maintenances"></span>
            <p>{formatHoursMinutes(totals.totalMaintenanceHours)}: Maintenance</p>
          </div>
          <div className="hour-box">
            <span className="dot rework"></span>
            <p>{formatHoursMinutes(totals.totalReworkHours)}: Rework</p>
          </div>
          <div className="hour-box">
            <span className="dot needle-break"></span>
            <p>{formatHoursMinutes(totals.totalNeedleBreakHours)}: Needle Break</p>
          </div>
          <div className="hour-box">
            <span className="dot idle"></span>
            <p>{formatHoursMinutes(totals.totalIdleHours)}: Idle Time</p>
          </div>
        </div>
      </div>
    </div>
  );

};

export default AllLinesReport;