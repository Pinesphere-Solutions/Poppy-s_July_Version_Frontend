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
import "../../dashboard/areaTable/AreaTable.scss";
import MachineReportA from "../../Operator_Report/MachineReportA";
import AllMachinesReport from "../../Operator_Report/AllMachinesReportA";

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
  { label: "Operation Count", key: "STITCH_COUNT" },
  { label: "Skip count", key: "NEEDLE_RUNTIME" },
  { label: "Needle Stop Time", key: "NEEDLE_STOPTIME" },
  { label: "Duration", key: "DEVICE_ID" },
  { label: "SPM", key: "RESERVE" },
  { label: "Calculation", key: "calculation" },
  { label: "TX Log ID", key: "Tx_LOGID" },
  { label: "STR Log ID", key: "Str_LOGID" },
  { label: "Created At", key: "created_at" },
];

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
  if (item.OPERATOR_ID === 0 && item.MODE === 2) {
    return 0;
  }

  const startTime = item.START_TIME
    ? new Date(`1970-01-01T${item.START_TIME}`)
    : null;
  const endTime = item.END_TIME
    ? new Date(`1970-01-01T${item.END_TIME}`)
    : null;

  if (!startTime || !endTime) return 1;

  const isBreakTime1 =
    startTime >= new Date(`1970-01-01T10:30:00`) &&
    endTime <= new Date(`1970-01-01T10:40:00`);

  const isBreakTime2 =
    startTime >= new Date(`1970-01-01T13:20:00`) &&
    endTime <= new Date(`1970-01-01T14:00:00`);

  const isBreakTime3 =
    startTime >= new Date(`1970-01-01T16:20:00`) &&
    endTime <= new Date(`1970-01-01T16:30:00`);

  return isBreakTime1 || isBreakTime2 || isBreakTime3 ? 0 : 1;
};

const OverallMachineA = () => {
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
      let url = `http://localhost:8000/api/user-machine-logs/?`;
      if (fromDate) url += `from_date=${fromDate}&`;
      if (toDate) url += `to_date=${toDate}`;

      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data)) {
        const sortedData = data.sort(
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

    let filtered = [...tableData];
    let filteredDetailed = [...detailedData];
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
        `http://localhost:8000/api/api/afl/machines/all/reports/?${params}`
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
    setSelectedMachineId(e.target.value);
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
        calculation: calculateValue(row),
      };

      return headers.map((header) => {
        const key = TABLE_HEADS.find((th) => th.label === header)?.key;

        if (key === "serial_number") {
          return index + 1;
        }
        if (key === "created_at" && rowWithCalculation[key]) {
          return formatConsistentDateTime(rowWithCalculation[key]);
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
          calculation: calculateValue(row),
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
            <label>Select Machine ID AVL:</label>
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
                        calculation: calculateValue(dataItem),
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
            <MachineReportA
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

export default OverallMachineA;
