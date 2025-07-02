import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FaTshirt, FaClock, FaTools, FaDownload } from "react-icons/fa";
import "./LineStyles.css";

const LineReport = ({ lineNumber, fromDate, toDate }) => {
  const [reportData, setReportData] = useState({
    lineNumber: "",
    totalAvailableHours: 0,
    totalWorkingDays: 0,
    averageMachines: 0,
    totalHours: 0,
    totalProductiveTime: {
      hours: 0,
      percentage: 0
    },
    totalNonProductiveTime: {
      hours: 0,
      percentage: 0,
      breakdown: {
        noFeedingHours: 0,
        meetingHours: 0,
        maintenanceHours: 0,
        reworkHours: 0,
        needleBreakHours: 0,
        idleHours: 0
      }
    },
    totalStitchCount: 0,
    averageSewingSpeed: 0,
    totalNeedleRuntime: 0,
    needleRuntimePercentage: 0,
    tableData: [],
    allTableData: []
  });

  const [tableFilter, setTableFilter] = useState({
    fromDate: '',
    toDate: ''
  });

  useEffect(() => {
    if (!lineNumber) return;

    const params = new URLSearchParams();
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);

    fetch(`http://localhost:8000/api/line-reports/${lineNumber}/?${params}`)
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
    setTableFilter(prev => ({ ...prev, [name]: value }));
  };

  const applyTableFilter = () => {
    const filteredData = reportData.allTableData.filter(row => {
      const rowDate = new Date(row.Date);
      const fromDate = tableFilter.fromDate ? new Date(tableFilter.fromDate) : null;
      const toDate = tableFilter.toDate ? new Date(tableFilter.toDate) : null;
      
      let valid = true;
      if (fromDate) valid = valid && rowDate >= fromDate;
      if (toDate) valid = valid && rowDate <= toDate;
      return valid;
    });

    setReportData(prev => ({
      ...prev,
      tableData: filteredData
    }));
  };

  const resetTableFilter = () => {
    setTableFilter({ fromDate: '', toDate: '' });
    setReportData(prev => ({
      ...prev,
      tableData: prev.allTableData
    }));
  };

 /*  const downloadCSV = () => {
    if (!reportData.tableData || reportData.tableData.length === 0) {
      console.error("No data available to download");
      return;
    }

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
    link.setAttribute('download', `line_${lineNumber}_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }; */

  
 
  // ...existing code...
  
  /**
   * Download CSV function (summary-heads-driven, similar to AllLinesReport)
   */
  const SUMMARY_TABLE_HEADS = [
    { label: "Date", key: "Date" },
    { label: "Line Number", key: "Line Number" },
    { label: "Total Hours", key: "Total Hours" },
    { label: "Sewing", key: "Sewing Hours (PT)" },
    { label: "Idle Hours", key: "Idle Hours" },
    { label: "Rework", key: "Rework Hours" },
    { label: "No Feeding", key: "No Feeding Hours" },
    { label: "Meeting", key: "Meeting Hours" },
    { label: "Maintenance", key: "Maintenance Hours" },
    { label: "Needle Break", key: "Needle Break Hours" },
    { label: "PT %", key: "Productive Time (PT) %" },
    { label: "NPT %", key: "Non-Productive Time (NPT) %" },
    { label: "Needle Runtime %", key: "Needle Runtime Percentage" },
    { label: "Sewing Speed", key: "Sewing Speed" },
    { label: "Stitch Count", key: "Stitch Count" },
    { label: "Machine Count", key: "Machine Count" }
  ];
  
  const downloadCSV = () => {
    if (!reportData.tableData || reportData.tableData.length === 0) {
      console.error("No data available to download");
      return;
    }
  
    const headers = SUMMARY_TABLE_HEADS.map(head => head.label);
  
    const rows = reportData.tableData.map(row =>
      SUMMARY_TABLE_HEADS.map(head =>
        head.key === "Line Number"
          ? row["Line Number"] || lineNumber
          : [
              "Total Hours",
              "Sewing Hours (PT)",
              "Idle Hours",
              "Rework Hours",
              "No Feeding Hours",
              "Meeting Hours",
              "Maintenance Hours",
              "Needle Break Hours"
            ].includes(head.key)
            ? formatHoursMinutes(row[head.key])
            : head.key === "Needle Runtime Percentage"
              ? getNeedleRuntimePercentage(row)
              : row[head.key]?.toFixed
                ? row[head.key].toFixed(2)
                : row[head.key] !== undefined
                  ? row[head.key]
                  : ""
      )
    );
  
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `line_${lineNumber}_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // ...existing code...

  
  
  const safeToFixed = (value, decimals = 2) => {
    if (value === undefined || value === null) return '0.00';
    if (typeof value !== 'number') return value;
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
          <p>Date Range: ${fromDate || 'N/A'} to ${toDate || 'N/A'}</p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary-section">
          <h2>Summary</h2>
          <div class="summary-item">
            <strong>Total Available Hours:</strong> ${safeToFixed(reportData.totalAvailableHours)}
          </div>
          <div class="summary-item">
            <strong>Productive Time:</strong> ${safeToFixed(reportData.totalProductiveTime.hours)} Hrs (${safeToFixed(reportData.totalProductiveTime.percentage)}%)
          </div>
          <div class="summary-item">
            <strong>Non-Productive Time:</strong> ${safeToFixed(reportData.totalNonProductiveTime.hours)} Hrs (${safeToFixed(reportData.totalNonProductiveTime.percentage)}%)
          </div>
          <div class="summary-item">
            <strong>Average Sewing Speed:</strong> ${safeToFixed(reportData.averageSewingSpeed)}
          </div>
          <div class="summary-item">
            <strong>Needle Runtime:</strong> ${safeToFixed(reportData.needleRuntimePercentage)}%
          </div>
        </div>

        <h2>Detailed Data</h2>
        <table>
          <thead>
            <tr>
              ${Object.keys(reportData.tableData[0] || {}).map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${reportData.tableData.map(row => 
              `<tr>
                ${Object.values(row).map(value => 
                  `<td>${typeof value === 'number' ? safeToFixed(value) : value || ''}</td>`
                ).join('')}
              </tr>`
            ).join('')}
          </tbody>
        </table>
      </body>
      </html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `line_${lineNumber}_report_${new Date().toISOString().slice(0,10)}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Utility to convert decimal hours or "HH:MM" string to "H hours M minutes" format
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
      const decimalHours = Number(input);
      hours = Math.floor(decimalHours);
      minutes = Math.round((decimalHours - hours) * 60);
    } else {
      return "-";
    }
    if (hours === 0 && minutes === 0) return "0";
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
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

  // Define consistent color mapping (same as OperatorReport)
  const colorMap = {
    "Sewing Hours": "#27ae60", // green
    "No Feeding Hours": "#2980b9", // blue
    "Maintenance Hours": "#f1c40f", // yellow
    "Meeting Hours": "#e74c3c", // red
    "Idle Hours": "#7f8c8d", // gray
    "Rework Hours": "#f39c12", // orange
    "Needle Break Hours": "#8e44ad" // purple
  };

  // Prepare data for Recharts (use first row for breakdown, as in OperatorReport)
  const firstRow = reportData.tableData[0] || {};
  const chartData = [
    { name: "Sewing Hours", value: toTotalMinutes(firstRow["Sewing Hours (PT)"]), color: colorMap["Sewing Hours"] },
    { name: "No Feeding Hours", value: toTotalMinutes(firstRow["No Feeding Hours"]), color: colorMap["No Feeding Hours"] },
    { name: "Maintenance Hours", value: toTotalMinutes(firstRow["Maintenance Hours"]), color: colorMap["Maintenance Hours"] },
    { name: "Meeting Hours", value: toTotalMinutes(firstRow["Meeting Hours"]), color: colorMap["Meeting Hours"] },
    { name: "Idle Hours", value: toTotalMinutes(firstRow["Idle Hours"]), color: colorMap["Idle Hours"] },
    { name: "Rework Hours", value: toTotalMinutes(firstRow["Rework Hours"]), color: colorMap["Rework Hours"] },
    { name: "Needle Break Hours", value: toTotalMinutes(firstRow["Needle Break Hours"]), color: colorMap["Needle Break Hours"] }
  ].filter(item => item.value > 0);
  console.log('Pie chartData:', chartData);

  // Utility to calculate needle runtime percentage for a row (like OperatorReport/MachineReport)
  const getNeedleRuntimePercentage = (row) => {
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
    // Use needleRuntime as-is (assumed seconds)
    if (!needleRuntime || !sewingSeconds) return '0.00';
    return ((needleRuntime / sewingSeconds) * 100).toFixed(2);
  };

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
                <th>Line Number</th> {/* Added Line Number column */}
                <th>Total Hours (PT)</th>
                <th>Sewing</th>
                <th>Idle</th>
                <th>Rework</th>
                <th>No Feeding </th>
                <th>Meeting</th>
                <th>Maintenance</th>                
                <th>Needle Break</th>
                <th>PT %</th>
                <th>NPT %</th>
                <th>Needle Runtime %</th> {/* Moved Needle Runtime % after NPT % */}
                <th>Sewing Speed</th>
                <th>Stitch Count</th>
                <th>Machine Count</th>
              </tr>
            </thead>
            <tbody>
              {reportData.tableData.map((row, index) => (
                <tr key={index}>
                  <td>{row.Date}</td>
                  <td>{row["Line Number"] || lineNumber}</td> {/* Show Line Number */}
                  <td>{formatHoursMinutes(row["Total Hours"])}</td>
                  <td>{formatHoursMinutes(row["Sewing Hours (PT)"])}</td>
                  <td>{formatHoursMinutes(row["Idle Hours"])}</td>
                  <td>{formatHoursMinutes(row["Rework Hours"])}</td>
                  <td>{formatHoursMinutes(row["No Feeding Hours"])}</td>
                  <td>{formatHoursMinutes(row["Meeting Hours"])}</td>
                  <td>{formatHoursMinutes(row["Maintenance Hours"])}</td>
                  <td>{formatHoursMinutes(row["Needle Break Hours"])}</td>
                  <td>{safeToFixed(row["Productive Time (PT) %"])}%</td>
                  <td>{safeToFixed(row["Non-Productive Time (NPT) %"])}%</td>
                  <td>{getNeedleRuntimePercentage(row)}%</td> {/* Moved Needle Runtime % after NPT % */}
                  <td>{safeToFixed(row["Sewing Speed"])}</td>
                  <td>{row["Stitch Count"] || '0'}</td>
                  <td>{row["Machine Count"] || '0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

     

      <div className="summary-tiles">
        <div className="tile production-percentage">
          <p>{safeToFixed(reportData.totalProductiveTime.percentage)}%</p>
          <span>Productive Time</span>
        </div>
        <div className="tile needle-runtime-percentage">
          <p>{safeToFixed(
            reportData.totalNeedleRuntime.percentage || getNeedleRuntimePercentage(firstRow)
          )}%</p>
          <span>Needle Runtime %</span>
        </div>
        <div className="tile sewing-speed">
          <p>{
            reportData.tableData.length > 0
              ? safeToFixed(reportData.tableData.reduce((sum, row) => sum + (row["Sewing Speed"] || 0), 0) / reportData.tableData.length)
              : '0.00'
          }</p>
          <span>Sewing Speed</span>
        </div>
        <div className="tile total-hours">
          <p>{formatHoursMinutes(reportData.totalHours)}</p>
          <span>Total Hours</span>
        </div>
      </div>

      <div className="chart-breakdown-container">
        <div className="graph-section">
          <h3>Hours Breakdown (Total: {formatHoursMinutes(reportData.totalHours)} Hrs)</h3>
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
                  formatter={(value, name) => {
                    const hours = Math.floor(value / 60);
                    const minutes = value % 60;
                    let label = '';
                    if (hours > 0 && minutes > 0) label = `${hours} hours ${minutes} minutes`;
                    else if (hours > 0) label = `${hours} hours`;
                    else label = `${minutes} minutes`;
                    return [label, name];
                  }}
                  labelFormatter={(name) => `${name}`}
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
            <strong>Total Hours: {formatHoursMinutes(reportData.totalHours)} Hrs</strong>
          </div>
        </div>

        <div className="hour-breakdown">
          <div className="hour-box">
            <span className="dot production"></span>
            <p>{formatHoursMinutes(firstRow["Sewing Hours (PT)"])}: Sewing Hours</p>
          </div>
          <div className="hour-box">
            <span className="dot no-feeding"></span>
            <p>{formatHoursMinutes(firstRow["No Feeding Hours"])}: No Feeding Hours</p>
          </div>
          <div className="hour-box">
            <span className="dot maintenances"></span>
            <p>{formatHoursMinutes(firstRow["Maintenance Hours"])}: Maintenance Hours</p>
          </div>
          <div className="hour-box">
            <span className="dot meeting"></span>
            <p>{formatHoursMinutes(firstRow["Meeting Hours"])}: Meeting Hours</p>
          </div>
          <div className="hour-box">
            <span className="dot idle"></span>
            <p>{formatHoursMinutes(firstRow["Idle Hours"])}: Idle Hours</p>
          </div>
          <div className="hour-box">
            <span className="dot rework"></span>
            <p>{formatHoursMinutes(firstRow["Rework Hours"])}: Rework Hours</p>
          </div>
          <div className="hour-box">
            <span className="dot needle-break"></span>
            <p>{formatHoursMinutes(firstRow["Needle Break Hours"])}: Needle Break Hours</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineReport;