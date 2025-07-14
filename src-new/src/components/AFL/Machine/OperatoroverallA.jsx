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
  FaAngleLeft,
  FaAngleRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from "react-icons/fa";
import "../../dashboard/areaTable/AreaTable.scss";
import OperatorReportA from "../../Operator_Report/OperatorReportA";

const TABLE_HEADS = [
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
  { label: "Operation Count", key: "DEVICE_ID" },
  { label: "Skip Count", key: "RESERVE" },
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

const OperatoroverallA = () => {
  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedOperatorName, setSelectedOperatorName] = useState("");
  const [operatorNames, setOperatorNames] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [filterSummary, setFilterSummary] = useState("");
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [showTableView, setShowTableView] = useState(false);
  const [dataGenerated, setDataGenerated] = useState(false);
  const [selectedOperatorId, setSelectedOperatorId] = useState("");
  const [operatorReportData, setOperatorReportData] = useState([]);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch data when date filters change
  useEffect(() => {
    if (fromDate && toDate) {
      fetchData();
      setDateFilterActive(true);
    } else {
      setDateFilterActive(false);
    }
  }, [fromDate, toDate]);

  // Fetch data only when date filters are applied
  const fetchData = async () => {
    if (!fromDate || !toDate) return;

    setIsLoading(true);
    try {
      let url = `http://127.0.0.1:8000/api/user-machine-logs/?`;
      if (fromDate) url += `from_date=${fromDate}&`;
      if (toDate) url += `to_date=${toDate}`;

      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data)) {
        const sortedData = data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setTableData(sortedData);
        setFilteredData([]);

        const uniqueOperatorNames = [
          ...new Set(sortedData.map((item) => item.operator_name)),
        ].filter(Boolean);
        uniqueOperatorNames.sort((a, b) => String(a).localeCompare(String(b)));
        setOperatorNames(uniqueOperatorNames);
      } else {
        console.error("Fetched data is not an array:", data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter function
  const applyFilters = () => {
    if (!selectedOperatorName) return;

    let filtered = [...tableData];
    let filterDescription = [];
    if (selectedOperatorName === "All") {
      setFilteredData(tableData);
      setFilterSummary("All Operators");
      setFiltersApplied(true);
      setDataGenerated(true);
      setShowTableView(false);
      return;
    }
    // Apply operator name filter
    filtered = filtered.filter((item) => {
      const itemOperatorName = String(item.operator_name || "").trim();
      const selectedName = String(selectedOperatorName).trim();
      return itemOperatorName === selectedName;
    });

    filterDescription.push(`Operator Name: ${selectedOperatorName}`);

    // Apply other filters if any
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

        activeFilters.forEach((key) => {
          const columnName =
            TABLE_HEADS.find((h) => h.key === key)?.label || key;
          filterDescription.push(`${columnName}: ${filters[key]}`);
        });
      }
    }

    setFilterSummary(filterDescription.join(", "));
    setFilteredData(filtered);
    setFiltersApplied(true);
    setDataGenerated(true);
    setShowTableView(false);
  };

  const handleOperatorNameChange = (e) => {
    setSelectedOperatorName(e.target.value);
  };

  const handleFromDateChange = (e) => {
    setFromDate(e.target.value);
    setSelectedOperatorName(""); // Reset operator selection when date changes
  };

  const handleToDateChange = (e) => {
    setToDate(e.target.value);
    setSelectedOperatorName(""); // Reset operator selection when date changes
  };

  const handleDateFilterApply = () => {
    if (fromDate || toDate) {
      fetchData();
    }
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
    setSelectedOperatorName("");
    setTableData([]);
    setFilteredData([]);
    setShowFilters(false);
    setDateFilterActive(false);
    setFilterSummary("");
    setFiltersApplied(false);
    setShowTableView(false);
    setDataGenerated(false);
  };

  const handleOperatorReportData = (data) => {
    setOperatorReportData(data);
  };

  const downloadCSV = () => {
    const csvContent = [
      TABLE_HEADS.map((head) => head.label).join(","),
      ...filteredData.map((row, index) =>
        TABLE_HEADS.map((head) => {
          if (head.key === "serial_number") {
            return indexOfFirstRow + index + 1; // Calculate S.No based on pagination
          } else if (head.key === "created_at" && row[head.key]) {
            return formatConsistentDateTime(row[head.key]);
          } else {
            return row[head.key] || "";
          }
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "operator_data.csv";
    link.click();
  };

  const downloadHTML = () => {
    const htmlContent = `
      <html>
      <head>
        <title>Operator Data</title>
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>${TABLE_HEADS.map((head) => `<th>${head.label}</th>`).join(
              ""
            )}</tr>
          </thead>
          <tbody>
            ${filteredData
              .map(
                (row, index) => `
              <tr>${TABLE_HEADS.map((head) => {
                let cellValue;
                if (head.key === "serial_number") {
                  cellValue = indexOfFirstRow + index + 1; // Calculate S.No based on pagination
                } else if (head.key === "created_at" && row[head.key]) {
                  cellValue = formatConsistentDateTime(row[head.key]);
                } else {
                  cellValue = row[head.key] || "-";
                }
                return `<td>${cellValue}</td>`;
              }).join("")}</tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "operator_data.html";
    link.click();
  };

  // Pagination calculations
  const totalRows = filteredData.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

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

          <div className="machine-selector">
            <label style={{ display: "block" }}>Select Operator Name:</label>
            <div className="select-wrapper">
              <select
                value={selectedOperatorName}
                onChange={handleOperatorNameChange}
                className="machine-dropdown"
                disabled={!dateFilterActive || isLoading}
              >
                <option value="">Select an Operator</option>
                <option value="All">All</option>
                {operatorNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="apply-filter-container">
            <button
              className={`generate-button green-button ${
                !selectedOperatorName || !dateFilterActive ? "disabled" : ""
              }`}
              onClick={applyFilters}
              disabled={!selectedOperatorName || !dateFilterActive}
              title="Apply Filters"
              style={{ marginRight: "22px" }}
            >
              <FaChartBar /> Generate
            </button>

            {dataGenerated && (
              <button
                className={`view-toggle-button green-button ${
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
            <p>Loading operator logs data...</p>
          </div>
        ) : !fromDate || !toDate ? (
          <div className="no-selection-state">
            <FaSearch className="search-icon" />
            <p>Select date range to see available Operators</p>
          </div>
        ) : tableData.length === 0 && dateFilterActive ? (
          <div className="no-selection-state">
            <FaSearch className="search-icon" />
            <p>No data available for the selected date range</p>
          </div>
        ) : !filtersApplied ? (
          <div className="no-selection-state">
            <FaSearch className="search-icon" />
            <p>Select an Operator Name and click Generate to view data</p>
          </div>
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
                  {currentRows.map((dataItem, index) => (
                    <tr key={index}>
                      {TABLE_HEADS.map((th, thIndex) => (
                        <td key={thIndex}>
                          {th.key === "serial_number"
                            ? indexOfFirstRow + index + 1
                            : th.key === "created_at" && dataItem[th.key]
                            ? formatConsistentDateTime(dataItem[th.key])
                            : dataItem[th.key] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  title="First Page"
                >
                  <FaAngleDoubleLeft />
                </button>
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="page-button"
                  title="Previous Page"
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
                  title="Next Page"
                >
                  <FaAngleRight />
                </button>
                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="page-button"
                  title="Last Page"
                >
                  <FaAngleDoubleRight />
                </button>
              </div>
            </div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="no-data-state">
            <p>No data available for the current filters</p>
            <div className="filter-summary">
              {selectedOperatorName && (
                <div>Operator Name: {selectedOperatorName}</div>
              )}
              {fromDate && (
                <div>From date: {formatDateForDisplay(fromDate)}</div>
              )}
              {toDate && <div>To date: {formatDateForDisplay(toDate)}</div>}
            </div>
          </div>
        ) : (
          <div className="operator-report-section">
            <OperatorReportA
              operator_name={selectedOperatorName}
              fromDate={fromDate}
              toDate={toDate}
              onDataLoaded={handleOperatorReportData}
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default OperatoroverallA;
