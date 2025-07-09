import React, { useEffect, useState } from "react";
import {
  FaFilter,
  FaRedo,
  FaCalendarAlt,
  FaDownload,
  FaSearch,
  FaChartBar,
  FaArrowLeft,
  FaTable,
} from "react-icons/fa";
import "./AreaTable.scss";
import MachineReport from "../../Operator_Report/MachineReport";
import AllMachinesReport from "../../Operator_Report/AllMachinesReport";

const TABLE_HEADS = [
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

// Add a mapping for mode descriptions including new modes 6 and 7
const MODE_DESCRIPTIONS = {
  1: "Sewing",
  2: "Idle",
  3: "No Feeding",
  4: "Meeting",
  5: "Maintenance",
  6: "Rework",
  7: "Needle Break",
};

const formatDateTime = (dateTimeString) => {
  const dateTime = new Date(dateTimeString);
  const formattedDate = dateTime.toISOString().split("T")[0];
  const formattedTime = dateTime.toTimeString().split(" ")[0];
  return `${formattedDate} ${formattedTime}.${dateTime.getMilliseconds()}`;
};

const formatDateForDisplay = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const calculateValue = (item) => {
  // List of valid operator IDs
  const validOperatorIDs = [
    "3658143475",
    "3660306819",
    "3660499379",
    "3659262979",
    "3661924643",
    "3661191843",
    "3653098739",
    "3659613555",
    "3658619763",
    "3660851603",
    "3652395075",
    "3653353699",
    "3654730995",
    "3660111891",
    "3660850451",
    "3661210371",
    "3661215379",
    "3660650483",
    "3655499331",
    "3660137427",
    "3655053075",
    "3655015683",
    "3660405379",
    "3662024435",
    "3793893139",

    // Newly added Operator IDs
    "3661139987",
    "3660575811",
    "3662245171",
    "3661270803",
    "3660572579",
    "3660934899",
    "3661393987",
    "3655662323",
    "3659679971",
    "3660802403",
  ];

  // Check if OPERATOR_ID is missing, invalid or equals 0
  if (
    !item.OPERATOR_ID ||
    item.OPERATOR_ID === "0" ||
    item.OPERATOR_ID === 0 ||
    !validOperatorIDs.includes(item.OPERATOR_ID.toString())
  ) {
    return 0;
  }

  // If operator ID is 0 and mode is 2, return 0
  if (item.OPERATOR_ID === 0 && item.MODE === 2) {
    return 0;
  }

  const startTime = item.START_TIME
    ? new Date(`1970-01-01T${item.START_TIME}`)
    : null;
  const endTime = item.END_TIME
    ? new Date(`1970-01-01T${item.END_TIME}`)
    : null;

  // If we can't determine times, return 0 instead of 1
  if (!startTime || !endTime) return 0;

  // Check if outside working hours (8:25 AM to 7:35 PM)
  const workStartTime = new Date("1970-01-01T08:25:00");
  const workEndTime = new Date("1970-01-01T19:35:00");
  const outsideWorkingHours =
    startTime < workStartTime || endTime > workEndTime;

  if (outsideWorkingHours) {
    return 0;
  }

  // Define break periods
  const breakPeriods = [
    {
      start: new Date(`1970-01-01T10:30:00`),
      end: new Date(`1970-01-01T10:40:00`),
    },
    {
      start: new Date(`1970-01-01T13:20:00`),
      end: new Date(`1970-01-01T14:00:00`),
    },
    {
      start: new Date(`1970-01-01T16:20:00`),
      end: new Date(`1970-01-01T16:30:00`),
    },
  ];

  // Check if the time falls within any break period
  const isWithinBreakPeriod = breakPeriods.some(
    (breakPeriod) =>
      startTime >= breakPeriod.start && endTime <= breakPeriod.end
  );

  return isWithinBreakPeriod ? 0 : 1;
};

const MachineOverall = () => {
  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filters, setFilters] = useState({});
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedMachineId, setSelectedMachineId] = useState("");
  const [machineIds, setMachineIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [filterSummary, setFilterSummary] = useState("");
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [showTableView, setShowTableView] = useState(false);
  const [dataGenerated, setDataGenerated] = useState(false);
  const [machineReportData, setMachineReportData] = useState([]);
  const [showAllMachines, setShowAllMachines] = useState(false);
  const [allMachinesReportData, setAllMachinesReportData] = useState([]);
  const [detailedData, setDetailedData] = useState([]);
  const [filteredDetailedData, setFilteredDetailedData] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  // Add pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch data when date range is applied
  const fetchData = async () => {
    if (!fromDate && !toDate) return;

    setIsLoading(true);
    try {
      let url = `http://localhost:8000/api/logs/?`;
      if (fromDate) url += `from_date=${fromDate}&`;
      if (toDate) url += `to_date=${toDate}`;

      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data)) {
        // Add calculation_value to each item
        const dataWithCalculation = data.map((item) => ({
          ...item,
          calculation_value: calculateValue(item),
        }));

        const sortedData = dataWithCalculation.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setTableData(sortedData);
        setDetailedData(sortedData);
        setFilteredData([]);
        setFilteredDetailedData([]);

        const uniqueMachineIds = [
          ...new Set(sortedData.map((item) => item.MACHINE_ID)),
        ].filter(Boolean);
        uniqueMachineIds.sort((a, b) => {
          const numA = Number(a);
          const numB = Number(b);
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          }
          return String(a).localeCompare(String(b));
        });

        setMachineIds(uniqueMachineIds);
        setDataLoaded(true);
      } else {
        console.error("Fetched data is not an array:", data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Watch for date changes and automatically fetch data
  useEffect(() => {
    if (fromDate || toDate) {
      fetchData();
    }
  }, [fromDate, toDate]);

  // Filter function
  const applyFilters = () => {
    if (selectedMachineId === "all") {
      fetchAllMachinesReport();
      return;
    }

    // Ensure calculation_value is set for all records
    const tableDataWithCalculation = tableData.map((item) => ({
      ...item,
      calculation_value: item.calculation_value ?? calculateValue(item),
    }));

    const detailedDataWithCalculation = detailedData.map((item) => ({
      ...item,
      calculation_value: item.calculation_value ?? calculateValue(item),
    }));

    let filtered = [...tableDataWithCalculation];
    let filteredDetailed = [...detailedDataWithCalculation];
    let filterDescription = [];

    if (selectedMachineId) {
      filtered = filtered.filter((item) => {
        const itemMachineId = String(item.MACHINE_ID || "").trim();
        const selectedId = String(selectedMachineId).trim();
        return itemMachineId === selectedId;
      });

      filteredDetailed = filteredDetailed.filter((item) => {
        const itemMachineId = String(item.MACHINE_ID || "").trim();
        const selectedId = String(selectedMachineId).trim();
        return itemMachineId === selectedId;
      });

      filterDescription.push(`Machine ID: ${selectedMachineId}`);
    }

    if (fromDate || toDate) {
      setDateFilterActive(true);

      const filterByDate = (item) => {
        if (!item.DATE) return false;

        try {
          const itemDate = new Date(item.DATE);
          if (isNaN(itemDate.getTime())) return false;

          const itemDateOnly = new Date(
            itemDate.getFullYear(),
            itemDate.getMonth(),
            itemDate.getDate()
          );

          if (fromDate) {
            const fromDateTime = new Date(fromDate);
            const fromDateOnly = new Date(
              fromDateTime.getFullYear(),
              fromDateTime.getMonth(),
              fromDateTime.getDate()
            );
            if (itemDateOnly < fromDateOnly) return false;
          }

          if (toDate) {
            const toDateTime = new Date(toDate);
            const toDateOnly = new Date(
              toDateTime.getFullYear(),
              toDateTime.getMonth(),
              toDateTime.getDate()
            );
            if (itemDateOnly > toDateOnly) return false;
          }

          return true;
        } catch (e) {
          console.error("Date filtering error:", e);
          return false;
        }
      };

      filtered = filtered.filter(filterByDate);
      filteredDetailed = filteredDetailed.filter(filterByDate);

      if (fromDate && toDate) {
        filterDescription.push(
          `Date: ${formatDateForDisplay(fromDate)} to ${formatDateForDisplay(
            toDate
          )}`
        );
      } else if (fromDate) {
        filterDescription.push(`Date: From ${formatDateForDisplay(fromDate)}`);
      } else if (toDate) {
        filterDescription.push(`Date: Until ${formatDateForDisplay(toDate)}`);
      }
    } else {
      setDateFilterActive(false);
    }

    if (Object.keys(filters).length > 0) {
      const activeFilters = Object.keys(filters).filter(
        (key) => filters[key] && key !== "dummy"
      );

      if (activeFilters.length > 0) {
        filtered = filtered.filter((item) =>
          activeFilters.every((filterKey) => {
            const itemValue = String(item[filterKey] || "").toLowerCase();
            const filterValue = filters[filterKey].toLowerCase();
            return itemValue.includes(filterValue);
          })
        );

        filteredDetailed = filteredDetailed.filter((item) =>
          activeFilters.every((filterKey) => {
            const itemValue = String(item[filterKey] || "").toLowerCase();
            const filterValue = filters[filterKey].toLowerCase();
            return itemValue.includes(filterValue);
          })
        );

        activeFilters.forEach((key) => {
          const columnName =
            TABLE_HEADS.find((h) => h.key === key)?.label || key;
          filterDescription.push(`${columnName}: ${filters[key]}`);
        });
      }
    }

    setFilterSummary(filterDescription.join(", "));
    setFilteredData(filtered);
    setFilteredDetailedData(filteredDetailed);
    setFiltersApplied(true);
    setDataGenerated(true);
    setShowTableView(false);
    setShowAllMachines(false);
  };

  const fetchAllMachinesReport = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append("from_date", fromDate);
      if (toDate) params.append("to_date", toDate);

      const response = await fetch(
        `http://localhost:8000/api/api/machines/all/reports/?${params}`
      );
      const data = await response.json();

      setAllMachinesReportData(data.allMachinesReport || []);
      setDataGenerated(true);
      setShowTableView(false);
      setShowAllMachines(true);
      setFiltersApplied(true);
    } catch (error) {
      console.error("Error fetching all machines report:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleMachineIdChange = (e) => {
    const value = e.target.value;
    setSelectedMachineId(value);
    setCurrentPage(1); // Reset pagination

    // If switching to "All Machines", fetch the report again
    if (value === "all") {
      fetchAllMachinesReport();
      setShowAllMachines(true);
      setShowTableView(false);
      setFiltersApplied(true);
      setDataGenerated(true);
    } else {
      setShowAllMachines(false);
      setShowTableView(false);
      setFiltersApplied(false);
      setDataGenerated(false);
      // Optionally clear filtered data if needed:
      setFilteredData([]);
      setFilteredDetailedData([]);
    }
  };

  const handleFromDateChange = (e) => {
    setFromDate(e.target.value);
  };

  const handleToDateChange = (e) => {
    setToDate(e.target.value);
  };

  const formatConsistentDateTime = (dateTimeString) => {
    if (!dateTimeString) return "-";
    try {
      const dateTime = new Date(dateTimeString);
      // Format with toLocaleString to respect the user's local timezone
      return dateTime.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false, // Use 24-hour format
        fractionalSecondDigits: 2,
      });
    } catch (e) {
      console.error("Date formatting error:", e);
      return dateTimeString;
    }
  };

  const toggleView = () => {
    setShowTableView(!showTableView);
  };

  const handleReset = () => {
    setFilters({});
    setFromDate("");
    setToDate("");
    setSelectedMachineId("");
    setTableData([]);
    setDetailedData([]);
    setFilteredData([]);
    setFilteredDetailedData([]);
    setShowFilters(false);
    setDateFilterActive(false);
    setFilterSummary("");
    setFiltersApplied(false);
    setShowTableView(false);
    setDataGenerated(false);
    setShowAllMachines(false);
    setDataLoaded(false);
  };

  const handleMachineReportData = (data) => {
    setMachineReportData(data);
  };

  const downloadCSV = () => {
    const dataToExport = showAllMachines
      ? detailedData
      : showTableView
      ? filteredDetailedData
      : filteredData;
    const headers = TABLE_HEADS.map((head) => head.label);

    const rows = dataToExport.map((row, index) => {
      const rowWithCalculation = {
        ...row,
        calculation_value: calculateValue(row),
      };

      return headers.map((header) => {
        const key = TABLE_HEADS.find((th) => th.label === header)?.key;

        if (key === "serial_number") {
          return index + 1;
        }
        if (key === "created_at" && rowWithCalculation[key]) {
          return formatConsistentDateTime(rowWithCalculation[key]);
        }
        if (key === "calculation_value") {
          return rowWithCalculation.calculation_value;
        }
        return rowWithCalculation[key] || "";
      });
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `machine_data_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const downloadHTML = () => {
    const dataToExport = showAllMachines
      ? detailedData
      : showTableView
      ? filteredDetailedData
      : filteredData;
    const headers = TABLE_HEADS.map((head) => head.label);

    const rows = dataToExport
      .map((row, index) => {
        const rowWithCalculation = {
          ...row,
          calculation_value: calculateValue(row),
        };

        return `
      <tr>
        ${headers
          .map((header) => {
            const key = TABLE_HEADS.find((th) => th.label === header)?.key;

            let value = "";
            if (key === "serial_number") {
              value = index + 1;
            } else if (key === "created_at" && rowWithCalculation[key]) {
              value = formatConsistentDateTime(rowWithCalculation[key]);
            } else if (key === "calculation_value") {
              value = rowWithCalculation.calculation_value;
            } else {
              value = rowWithCalculation[key] || "";
            }
            return `<td>${value}</td>`;
          })
          .join("")}
      </tr>
    `;
      })
      .join("");

    const htmlContent = `<!DOCTYPE html>
      <html>
      <head>
        <title>Machine Data Report</title>
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
        <h1>Machine Data Report</h1>
        <div class="report-info">
          <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
          ${
            fromDate
              ? `<p><strong>From Date:</strong> ${formatDateForDisplay(
                  fromDate
                )}</p>`
              : ""
          }
          ${
            toDate
              ? `<p><strong>To Date:</strong> ${formatDateForDisplay(
                  toDate
                )}</p>`
              : ""
          }
          ${
            selectedMachineId && selectedMachineId !== "all"
              ? `<p><strong>Machine ID:</strong> ${selectedMachineId}</p>`
              : ""
          }
        </div>
        <table>
          <thead><tr>${headers
            .map((h) => `<th>${h}</th>`)
            .join("")}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
      </html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `machine_data_${new Date()
      .toISOString()
      .slice(0, 10)}.html`;
    link.click();
  };

  // Pagination logic
  const totalRows = filteredDetailedData.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentDetailedRows = filteredDetailedData.slice(
    indexOfFirstRow,
    indexOfLastRow
  );

  // Pagination navigation functions
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToFirstPage = () => paginate(1);
  const goToLastPage = () => paginate(totalPages);
  const goToNextPage = () =>
    currentPage < totalPages && paginate(currentPage + 1);
  const goToPreviousPage = () => currentPage > 1 && paginate(currentPage - 1);

  return (
    <section className="content-area-table">
      <div className="filter-section">
        <div className="main-filters">
          <div className="date-filter">
            <div className="date-input-group">
              <div className="date-field">
                <FaCalendarAlt className="calendar-icon" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={handleFromDateChange}
                  className="date-input"
                />
                <span className="date-label">From</span>
              </div>
              <div className="date-separator">to</div>
              <div className="date-field">
                <FaCalendarAlt className="calendar-icon" />
                <input
                  type="date"
                  value={toDate}
                  onChange={handleToDateChange}
                  className="date-input"
                />
                <span className="date-label">To</span>
              </div>
            </div>
          </div>

          <div className="machine-selector" style={{ marginTop: "-6px" }}>
            <label>Select Machines ID:</label>
            <div className="select-wrapper">
              <select
                value={selectedMachineId}
                onChange={handleMachineIdChange}
                className="machine-dropdown"
                disabled={!dataLoaded}
              >
                <option value="">Select a Machine</option>
                <option value="all">All Machines</option>
                {machineIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="apply-filter-container">
            <button
              className={`generate-button green-button ${
                !dataLoaded || !selectedMachineId ? "disabled" : ""
              }`}
              onClick={applyFilters}
              disabled={!dataLoaded || !selectedMachineId}
              title="Apply Filters"
              style={{ marginRight: "22px" }}
            >
              <FaChartBar /> Generate
            </button>

            {dataGenerated && !showAllMachines && (
              <button
                className={`toggle-view-button view-toggle-button green-button ${
                  !dataGenerated ? "disabled" : ""
                }`}
                onClick={toggleView}
                disabled={!dataGenerated}
                title={showTableView ? "View Chart" : "View Raw Data"}
                style={{ marginRight: "18px" }}
              >
                {showTableView ? <FaChartBar /> : <FaTable />}
                {showTableView ? " View Chart" : " View Raw Data"}
              </button>
            )}
          </div>

          <div className="action-buttons-container">
            <div className="action-buttons">
              <button
                className="action-button reset-button"
                onClick={handleReset}
                title="Reset All Filters"
              >
                <FaRedo /> Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="content-section">
        {isLoading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading machine logs data...</p>
          </div>
        ) : !dataLoaded ? (
          <div className="no-selection-state">
            <FaSearch className="search-icon" />
            <p>Select a date range to view available Machines</p>
          </div>
        ) : !filtersApplied ? (
          <div className="no-selection-state">
            <FaSearch className="search-icon" />
            <p>Select a Machine ID and click Generate to view data</p>
          </div>
        ) : showAllMachines ? (
          <AllMachinesReport
            reportData={allMachinesReportData}
            fromDate={fromDate}
            toDate={toDate}
            detailedData={detailedData}
          />
        ) : showTableView ? (
          <div className="table-container">
            <div className="table-header">
              <h3>Raw Data Report</h3>
              <div className="table-controls">
                <div className="download-buttons button">
                  <button onClick={downloadCSV}>
                    <FaDownload /> CSV
                  </button>
                  <button onClick={downloadHTML}>
                    <FaDownload /> HTML
                  </button>
                </div>
              </div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {TABLE_HEADS.map((th, index) => (
                      <th key={index}>{th.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentDetailedRows.length > 0 ? (
                    currentDetailedRows.map((dataItem, index) => {
                      const itemWithCalculation = {
                        ...dataItem,
                        calculation_value: calculateValue(dataItem),
                      };

                      return (
                        <tr key={index}>
                          {TABLE_HEADS.map((th, thIndex) => (
                            <td key={thIndex}>
                              {th.key === "serial_number"
                                ? index + 1
                                : th.key === "created_at" &&
                                  itemWithCalculation[th.key]
                                ? formatConsistentDateTime(
                                    itemWithCalculation[th.key]
                                  )
                                : th.key === "calculation_value"
                                ? itemWithCalculation[th.key]
                                : th.key === "mode_description"
                                ? MODE_DESCRIPTIONS[
                                    itemWithCalculation["MODE"]
                                  ] ||
                                  itemWithCalculation["mode_description"] ||
                                  "-"
                                : itemWithCalculation[th.key] || "-"}
                            </td>
                          ))}
                        </tr> 
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={TABLE_HEADS.length} className="no-data">
                        No data available for the current filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="pagination">
                <button onClick={goToFirstPage} disabled={currentPage === 1}>
                  First
                </button>
                <button onClick={goToPreviousPage} disabled={currentPage === 1}>
                  Previous
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="no-data-state">
            <p>No data available for the current filters</p>
            <div className="filter-summary">
              {selectedMachineId && <div>Machine ID: {selectedMachineId}</div>}
              {fromDate && (
                <div>From date: {formatDateForDisplay(fromDate)}</div>
              )}
              {toDate && <div>To date: {formatDateForDisplay(toDate)}</div>}
            </div>
          </div>
        ) : (
          <div className="machine-report-section">
            <MachineReport
              machine_id={selectedMachineId}
              fromDate={fromDate}
              toDate={toDate}
              onDataLoaded={handleMachineReportData}
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default MachineOverall;
