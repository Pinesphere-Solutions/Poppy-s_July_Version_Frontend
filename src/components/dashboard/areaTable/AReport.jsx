import React, { useState, useEffect } from "react";
import {
  FaFilter,
  FaRedo,
  FaTimes,
  FaSearch,
  FaDownload,
  FaAngleLeft,
  FaAngleRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaChartBar,
} from "react-icons/fa";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import "./AreaTable.scss";
import "./summary-styles.scss";

ChartJS.register(ArcElement, Tooltip, Legend);

const TABLE_HEADS = [
  { label: "S.No", key: "index" },
  { label: "Machine ID", key: "MACHINE_ID" },
  { label: "Line Number", key: "LINE_NUMB" },
  { label: "Operator Name", key: "operator_name" },
  { label: "Operator ID", key: "OPERATOR_ID" },
  { label: "Date", key: "DATE" },
  { label: "Start Time", key: "START_TIME" },
  { label: "End Time", key: "END_TIME" },
  { label: "Mode", key: "MODE" },
  { label: "Mode Description", key: "mode_description" },
  { label: "Stitch Count", key: "STITCH_COUNT" },
  { label: "Needle Runtime", key: "NEEDLE_RUNTIME" },
  { label: "Needle Stop Time", key: "NEEDLE_STOPTIME" },
  { label: "TX Log ID", key: "Tx_LOGID" },
  { label: "STR Log ID", key: "Str_LOGID" },
  { label: "Device ID", key: "DEVICE_ID" },
  { label: "Reserve", key: "RESERVE" },
  { label: "Created At", key: "created_at" },
];

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return "-";
  try {
    const dateTime = new Date(dateTimeString);
    const year = dateTime.getFullYear();
    const month = String(dateTime.getMonth() + 1).padStart(2, "0");
    const day = String(dateTime.getDate()).padStart(2, "0");
    const hours = String(dateTime.getHours()).padStart(2, "0");
    const minutes = String(dateTime.getMinutes()).padStart(2, "0");
    const seconds = String(dateTime.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (e) {
    return dateTimeString;
  }
};

const PRIMARY_API_URL =
  "http://localhost:8000/api/get_consolidated_user_AFL_logs/";
const FALLBACK_API_URL = "http://localhost:8000/api/user-machine-logs/";

const AReport = () => {
  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filters, setFilters] = useState({
    MACHINE_ID: [],
    LINE_NUMB: [],
    operator_name: [],
  });
  const [showFilterPopup, setShowFilterPopup] = useState({
    show: false,
    type: null,
    options: [],
    selectedValues: [],
  });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [summaryData, setSummaryData] = useState({
    sewingHours: 0,
    idleHours: 0,
    meetingHours: 0,
    noFeedingHours: 0,
    maintenanceHours: 0,
    totalHours: 0,
    productiveTimePercent: 0,
    nptPercent: 0,
    sewingSpeed: 0,
    stitchCount: 0,
    needleRuntime: 0,
  });
  const [showSummary, setShowSummary] = useState(false);
  const [summaryDataAvailable, setSummaryDataAvailable] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  // Validate date format to ensure it's YYYY-MM-DD
  const validateDateFormat = (dateString) => {
    if (!dateString) return "";

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn("Invalid date format:", dateString);
        return "";
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    } catch (e) {
      console.warn("Error formatting date:", e);
      return "";
    }
  };

  // Apply filters to table data
  useEffect(() => {
    if (tableData.length > 0) {
      let result = [...tableData];

      // Apply machine ID filter
      if (filters.MACHINE_ID.length > 0) {
        result = result.filter((item) =>
          filters.MACHINE_ID.includes(item.MACHINE_ID)
        );
      }

      // Apply line number filter
      if (filters.LINE_NUMB.length > 0) {
        result = result.filter((item) =>
          filters.LINE_NUMB.includes(item.LINE_NUMB)
        );
      }

      // Apply operator name filter
      if (filters.operator_name.length > 0) {
        result = result.filter((item) =>
          filters.operator_name.includes(item.operator_name)
        );
      }

      setFilteredData(result);
      setCurrentPage(1);
    }
  }, [filters, tableData]);

  const fetchData = async () => {
    if (!fromDate && !toDate) {
      setError("Please select at least one date");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (fromDate) params.append("from_date", fromDate);
      if (toDate) params.append("to_date", toDate);

      // Add all filter values to the API request
      filters.MACHINE_ID.forEach((id) => params.append("machine_id", id));
      filters.LINE_NUMB.forEach((line) => params.append("line_number", line));
      filters.operator_name.forEach((name) =>
        params.append("operator_name", name)
      );

      const requestUrl = `${PRIMARY_API_URL}?${params.toString()}`;
      console.log("Fetching data from:", requestUrl);

      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(requestUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 500) {
            console.warn(
              "Primary API endpoint returned 500 error. Trying fallback endpoint..."
            );
            // Try fallback API endpoint
            const fallbackResponse = await fetch(
              `${FALLBACK_API_URL}?${params.toString()}`,
              {
                method: "GET",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
              }
            );

            if (!fallbackResponse.ok) {
              throw new Error(
                `Fallback API also failed with status: ${fallbackResponse.status}`
              );
            }

            const fallbackData = await fallbackResponse.json();

            // Handle the different response format from fallback API
            if (fallbackData) {
              // Process data from fallback API
              const logsArray = Array.isArray(fallbackData)
                ? fallbackData
                : Array.isArray(fallbackData.logs)
                ? fallbackData.logs
                : [];

              // Filter out unknown operators
              let processedData = logsArray.filter((item) => {
                return (
                  item.OPERATOR_ID !== 0 &&
                  (item.operator_name
                    ? !item.operator_name.toLowerCase().includes("unknown")
                    : true)
                );
              });

              setTableData(processedData);
              setFilteredData(processedData);
              setSummaryDataAvailable(false);

              setActiveFilters({
                from_date: fromDate,
                to_date: toDate,
                machine_id: filters.MACHINE_ID.join(", ") || "All",
                line_number: filters.LINE_NUMB.join(", ") || "All",
                operator_name: filters.operator_name.join(", ") || "All",
              });

              return;
            }
          }

          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data && Array.isArray(data.logs)) {
          // Filter out unknown operators
          let processedData = data.logs.filter((item) => {
            return (
              item.OPERATOR_ID !== 0 &&
              item.operator_name &&
              !item.operator_name.toLowerCase().includes("unknown")
            );
          });

          setTableData(processedData);
          setFilteredData(processedData);

          // Set summary data
          if (data.summary) {
            setSummaryData({
              sewingHours: data.summary.sewing_hours || 0,
              idleHours: data.summary.idle_hours || 0,
              meetingHours: data.summary.meeting_hours || 0,
              noFeedingHours: data.summary.no_feeding_hours || 0,
              maintenanceHours: data.summary.maintenance_hours || 0,
              totalHours: data.summary.total_hours || 0,
              productiveTimePercent: data.summary.productive_percent || 0,
              nptPercent: data.summary.npt_percent || 0,
              sewingSpeed: data.summary.sewing_speed || 0,
              stitchCount: data.summary.total_stitch_count || 0,
              needleRuntime: data.summary.total_needle_runtime || 0,
            });
            setSummaryDataAvailable(true);
          } else {
            setSummaryDataAvailable(false);
          }

          setActiveFilters({
            from_date: fromDate,
            to_date: toDate,
            machine_id: filters.MACHINE_ID.join(", ") || "All",
            line_number: filters.LINE_NUMB.join(", ") || "All",
            operator_name: filters.operator_name.join(", ") || "All",
          });
        } else {
          throw new Error("Invalid data format received from server");
        }
      } catch (apiError) {
        console.error("API Error:", apiError);

        if (apiError.name === "AbortError") {
          setError("API request timed out. Please try again later.");
        } else if (
          apiError.message.includes("division by zero") ||
          (typeof apiError === "object" &&
            apiError.toString().includes("division by zero"))
        ) {
          setError(
            "Server calculation error. This may happen when there's no needle runtime data for the selected period."
          );
        } else {
          setError(apiError.message);
        }
        setSummaryDataAvailable(false);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
      setSummaryDataAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const handleTryAlternativeDate = () => {
    try {
      const selectedDate = new Date(fromDate);
      if (isNaN(selectedDate.getTime())) {
        const today = new Date();
        today.setDate(today.getDate() - 1);

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        const newDate = `${year}-${month}-${day}`;
        setFromDate(newDate);
        setToDate(newDate);
        return;
      }

      selectedDate.setDate(selectedDate.getDate() - 1);

      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");

      const newDate = `${year}-${month}-${day}`;
      setFromDate(newDate);
      setToDate(newDate);
    } catch (error) {
      console.error("Error setting fallback date:", error);
      const today = new Date();
      today.setMonth(today.getMonth() - 1);

      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");

      const newDate = `${year}-${month}-${day}`;
      setFromDate(newDate);
      setToDate(newDate);
    }
  };

  // Pagination functions
  const totalRows = filteredData.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToFirstPage = () => paginate(1);
  const goToLastPage = () => paginate(totalPages);
  const goToNextPage = () =>
    currentPage < totalPages && paginate(currentPage + 1);
  const goToPreviousPage = () => currentPage > 1 && paginate(currentPage - 1);

  const getFilterOptions = (type) => {
    const options = [
      ...new Set(
        tableData
          .map((item) => item[type])
          .filter((val) => val !== undefined && val !== null)
      ),
    ].sort((a, b) => {
      if (typeof a === "string" && typeof b === "string") {
        return a.localeCompare(b);
      }
      return a - b;
    });

    return ["All", ...options];
  };

  const openFilterPopup = (type) => {
    const options = getFilterOptions(type);

    setShowFilterPopup({
      show: true,
      type,
      options,
      selectedValues: filters[type] || [],
    });
    setSearchTerm("");
  };

  const toggleOptionSelection = (option) => {
    setShowFilterPopup((prev) => {
      let newSelectedValues;

      if (option === "All") {
        if (prev.selectedValues.includes("All")) {
          newSelectedValues = [];
        } else {
          newSelectedValues = [...prev.options.filter((opt) => opt !== "All")];
        }
      } else {
        if (prev.selectedValues.includes(option)) {
          newSelectedValues = prev.selectedValues.filter(
            (v) => v !== option && v !== "All"
          );
        } else {
          newSelectedValues = [
            ...prev.selectedValues.filter((v) => v !== "All"),
            option,
          ];
        }

        const allOptionsExceptAll = prev.options.filter((opt) => opt !== "All");
        if (newSelectedValues.length === allOptionsExceptAll.length) {
          newSelectedValues = ["All", ...newSelectedValues];
        }
      }

      return {
        ...prev,
        selectedValues: newSelectedValues,
      };
    });
  };

  const applyFilterChanges = () => {
    const { type, selectedValues } = showFilterPopup;

    const valuesToApply = selectedValues.includes("All")
      ? showFilterPopup.options.filter((opt) => opt !== "All")
      : selectedValues;

    setFilters((prev) => ({
      ...prev,
      [type]: valuesToApply,
    }));

    setShowFilterPopup({
      show: false,
      type: null,
      options: [],
      selectedValues: [],
    });
    setCurrentPage(1);
  };

  const clearFilterChanges = () => {
    setShowFilterPopup((prev) => ({
      ...prev,
      selectedValues: [],
    }));
  };

  const handleReset = () => {
    setFilters({
      MACHINE_ID: [],
      LINE_NUMB: [],
      operator_name: [],
    });
    setFromDate("");
    setToDate("");
    setTableData([]);
    setFilteredData([]);
    setError(null);
    setCurrentPage(1);
    setShowSummary(false);
    setSummaryDataAvailable(false);
    setActiveFilters({});
  };

  const toggleSummaryView = () => {
    setShowSummary((prev) => !prev);
  };

  const downloadCSV = () => {
    try {
      const headers = TABLE_HEADS.map((th) => th.label).join(",");
      const rows = filteredData
        .map((item, index) =>
          TABLE_HEADS.map((th) => {
            if (th.key === "index") {
              return index + 1;
            } else if (th.key === "created_at") {
              return `"${formatDateTime(item[th.key])}"`;
            } else {
              return item[th.key]
                ? `"${String(item[th.key]).replace(/"/g, '""')}"`
                : "";
            }
          }).join(",")
        )
        .join("\n");
      const csvContent = `${headers}\n${rows}`;

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "consolidated_report.csv";
      link.click();
    } catch (error) {
      console.error("Error generating CSV:", error);
      alert("Failed to generate CSV file");
    }
  };

  const removeFilter = (filterType, value) => {
    const updatedFilterValues = filters[filterType].filter(
      (val) => val !== value
    );

    setFilters((prev) => ({
      ...prev,
      [filterType]: updatedFilterValues,
    }));

    setCurrentPage(1);
  };

  const getFilterDisplayText = (filterType) => {
    const filterValues = filters[filterType];
    if (!filterValues || filterValues.length === 0) {
      return `Select ${filterType.replace(/_/g, " ")}`;
    }

    const allOptions = getFilterOptions(filterType);
    const allOptionsExceptAll = allOptions.filter((opt) => opt !== "All");

    if (
      filterValues.includes("All") ||
      filterValues.length === allOptionsExceptAll.length
    ) {
      return "All Selected";
    }

    if (filterValues.length === 1) {
      return filterValues[0];
    }

    return `${filterValues.length} selected`;
  };

  const filteredOptions = showFilterPopup.options.filter((option) =>
    String(option || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Fetch data when dates change
  useEffect(() => {
    if (fromDate || toDate) {
      if (window.fetchDataTimeout) {
        clearTimeout(window.fetchDataTimeout);
      }

      window.fetchDataTimeout = setTimeout(() => {
        fetchData();
      }, 500);

      return () => {
        if (window.fetchDataTimeout) {
          clearTimeout(window.fetchDataTimeout);
        }
      };
    }
  }, [fromDate, toDate]);

  return (
    <section className="content-area-table">
      <div className="data-table-info">
        <h4 className="data-table-title">Consolidated Report</h4>
        <div className="filter-wrapper">
          <div className="primary-filters">
            <div className="filter-group">
              <label>From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <button
              className="download-button"
              onClick={fetchData}
              disabled={!fromDate && !toDate}
              style={{ marginTop: "25px", backgroundColor: "green" }}
            >
              Generate
            </button>

            {tableData.length > 0 && (
              <>
                <div className="filter-group">
                  <label>Machine ID</label>
                  <div
                    className={`filter-value-display clickable ${
                      filters.MACHINE_ID && filters.MACHINE_ID.length > 0
                        ? "has-value"
                        : ""
                    }`}
                    onClick={() => openFilterPopup("MACHINE_ID")}
                  >
                    {getFilterDisplayText("MACHINE_ID")}
                  </div>
                </div>

                <div className="filter-group">
                  <label>Line Number</label>
                  <div
                    className={`filter-value-display clickable ${
                      filters.LINE_NUMB && filters.LINE_NUMB.length > 0
                        ? "has-value"
                        : ""
                    }`}
                    onClick={() => openFilterPopup("LINE_NUMB")}
                  >
                    {getFilterDisplayText("LINE_NUMB")}
                  </div>
                </div>

                <div className="filter-group">
                  <label>Operator Name</label>
                  <div
                    className={`filter-value-display clickable ${
                      filters.operator_name && filters.operator_name.length > 0
                        ? "has-value"
                        : ""
                    }`}
                    onClick={() => openFilterPopup("operator_name")}
                  >
                    {getFilterDisplayText("operator_name")}
                  </div>
                </div>

                <button
                  className="reset-button"
                  style={{ marginTop: "4px", marginLeft: "30px" }}
                  onClick={handleReset}
                >
                  <FaRedo /> Reset All
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showFilterPopup.show && (
        <div className="filter-popup">
          <div className="popup-content">
            <div className="popup-header">
              <h3>Select {showFilterPopup.type.replace(/_/g, " ")}</h3>
              <button
                className="close-button"
                onClick={() =>
                  setShowFilterPopup({
                    show: false,
                    type: null,
                    options: [],
                    selectedValues: [],
                  })
                }
              >
                ×
              </button>
            </div>

            <div className="search-box">
              <input
                type="text"
                placeholder={`Search ${showFilterPopup.type.replace(
                  /_/g,
                  " "
                )}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="options-list">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <div
                    key={index}
                    className={`option-item clickable ${
                      showFilterPopup.selectedValues.includes(option)
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => toggleOptionSelection(option)}
                  >
                    <input
                      type="checkbox"
                      checked={showFilterPopup.selectedValues.includes(option)}
                      onChange={() => {}}
                    />
                    <span>
                      {option === "All" ? "Select All" : String(option)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="no-results">No matching options found</div>
              )}
            </div>

            <div className="popup-footer">
              <button
                className="clear-button"
                onClick={clearFilterChanges}
                disabled={!showFilterPopup.selectedValues.length}
              >
                Clear
              </button>
              <button className="apply-button" onClick={applyFilterChanges}>
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="results-section">
        {showSummary && (
          <div className="summary-section">
            <h4>Summary Report</h4>
            <div className="summary-content">
              <div className="summary-chart">
                <Doughnut
                  data={{
                    labels: [
                      "Sewing Hours",
                      "Idle Hours",
                      "Meeting Hours",
                      "No Feeding Hours",
                      "Maintenance Hours",
                    ],
                    datasets: [
                      {
                        data: [
                          summaryData.sewingHours || 0,
                          summaryData.idleHours || 0,
                          summaryData.meetingHours || 0,
                          summaryData.noFeedingHours || 0,
                          summaryData.maintenanceHours || 0,
                        ],
                        backgroundColor: [
                          "#3E3561",
                          "#F8A723",
                          "#E74C3C",
                          "#8E44AD",
                          "#118374",
                        ],
                        borderColor: [
                          "#3E3561",
                          "#F8A723",
                          "#E74C3C",
                          "#8E44AD",
                          "#118374",
                        ],
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            const value = context.raw || 0;
                            return `${context.label}: ${value.toFixed(2)} Hrs`;
                          },
                        },
                      },
                    },
                    cutout: "60%",
                  }}
                />
              </div>
              <div
                className="total-hours"
                style={{
                  textAlign: "center",
                  marginTop: "10px",
                  marginBottom: "15px",
                }}
              >
                <strong>
                  Total Hours: {(summaryData.totalHours || 0).toFixed(2)} Hrs
                </strong>
              </div>
              <div className="hour-breakdown">
                <div className="hour-box">
                  <span className="dot production"></span>
                  <p>
                    {(summaryData.sewingHours || 0).toFixed(2)} Hrs: Sewing
                    Hours
                  </p>
                </div>
                <div className="hour-box">
                  <span className="dot idle"></span>
                  <p>
                    {(summaryData.idleHours || 0).toFixed(2)} Hrs: Idle Hours
                  </p>
                </div>
                <div className="hour-box">
                  <span className="dot meeting"></span>
                  <p>
                    {(summaryData.meetingHours || 0).toFixed(2)} Hrs: Meeting
                    Hours
                  </p>
                </div>
                <div className="hour-box">
                  <span className="dot no-feeding"></span>
                  <p>
                    {(summaryData.noFeedingHours || 0).toFixed(2)} Hrs: No
                    Feeding Hours
                  </p>
                </div>
                <div className="hour-box">
                  <span className="dot maintenance"></span>
                  <p>
                    {(summaryData.maintenanceHours || 0).toFixed(2)} Hrs:
                    Maintenance Hours
                  </p>
                </div>
              </div>
            </div>

            <div className="summary-table-wrapper">
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>Date Range</th>
                    <th>Operator ID</th>
                    <th>Operator Name</th>
                    <th>Machine ID</th>
                    <th>Line Number</th>
                    <th>Total Hours</th>
                    <th>Sewing Hours</th>
                    <th>Idle Hours</th>
                    <th>Meeting Hours</th>
                    <th>No Feeding Hours</th>
                    <th>Maintenance Hours</th>
                    <th>Productive Time in %</th>
                    <th>NPT in %</th>
                    <th>Sewing Speed</th>
                    <th>Stitch Count</th>
                    <th>Needle Runtime</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      {activeFilters.from_date || "Start"} to{" "}
                      {activeFilters.to_date || "End"}
                    </td>
                    <td>{activeFilters.OPERATOR_ID || "All"}</td>
                    <td>{activeFilters.operator_name || "All"}</td>
                    <td>{activeFilters.machine_id || "All"}</td>
                    <td>{activeFilters.line_number || "All"}</td>
                    <td>{(summaryData.totalHours || 0).toFixed(2)}</td>
                    <td>{(summaryData.sewingHours || 0).toFixed(2)}</td>
                    <td>{(summaryData.idleHours || 0).toFixed(2)}</td>
                    <td>{(summaryData.meetingHours || 0).toFixed(2)}</td>
                    <td>{(summaryData.noFeedingHours || 0).toFixed(2)}</td>
                    <td>{(summaryData.maintenanceHours || 0).toFixed(2)}</td>
                    <td>
                      {(summaryData.productiveTimePercent || 0).toFixed(2)}%
                    </td>
                    <td>{(summaryData.nptPercent || 0).toFixed(2)}%</td>
                    <td>{(summaryData.sewingSpeed || 0).toFixed(2)}</td>
                    <td>{(summaryData.stitchCount || 0).toFixed(2)}</td>
                    <td>{(summaryData.needleRuntime || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="results-header">
          <div className="results-header-left">
            <h4>
              {showSummary
                ? "Summary Dashboard"
                : `Results (${filteredData.length} records)`}
              {loading && <span className="loading-indicator">Loading...</span>}
            </h4>

            {summaryDataAvailable && (
              <button
                className={`view-toggle-button ${
                  showSummary ? "active" : "green-button"
                }`}
                onClick={toggleSummaryView}
                style={{ marginLeft: "20px" }}
                title={
                  showSummary
                    ? "Switch to table view"
                    : "Switch to summary view"
                }
              >
                {showSummary ? (
                  <>
                    <FaTimes /> Return to Table View
                  </>
                ) : (
                  <>
                    <FaChartBar /> View Summary Dashboard
                  </>
                )}
              </button>
            )}
          </div>

          <div className="results-controls">
            {!showSummary && (
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
            )}
            {showSummary && (
              <div className="view-mode-indicator">
                <span>Currently in summary view</span>
              </div>
            )}
            <button
              onClick={downloadCSV}
              disabled={!filteredData.length}
              className="download-button"
              style={{ marginTop: "25px" }}
            >
              <FaDownload /> Download CSV
            </button>
          </div>
        </div>

        {error && (
          <div
            className="error-box"
            style={{
              padding: "15px",
              backgroundColor: "#ffdddd",
              border: "1px solid #f44336",
              borderRadius: "4px",
              marginBottom: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ marginBottom: "10px" }}>
              <strong>Error:</strong> {error}
            </div>
            {(error.includes("calculation error") ||
              error.includes("division by zero")) && (
              <button
                onClick={handleTryAlternativeDate}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Try Previous Day Instead
              </button>
            )}
          </div>
        )}

        <div className="active-filters">
          {filters.MACHINE_ID && filters.MACHINE_ID.length > 0 && (
            <div className="active-filter">
              Machine ID:
              {filters.MACHINE_ID.includes("All") ? (
                <span className="filter-value">
                  All
                  <button onClick={() => removeFilter("MACHINE_ID", "All")}>
                    ×
                  </button>
                </span>
              ) : (
                filters.MACHINE_ID.map((value, idx) => (
                  <span key={idx} className="filter-value">
                    {value}
                    <button onClick={() => removeFilter("MACHINE_ID", value)}>
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          )}

          {filters.LINE_NUMB && filters.LINE_NUMB.length > 0 && (
            <div className="active-filter">
              Line Number:
              {filters.LINE_NUMB.includes("All") ? (
                <span className="filter-value">
                  All
                  <button onClick={() => removeFilter("LINE_NUMB", "All")}>
                    ×
                  </button>
                </span>
              ) : (
                filters.LINE_NUMB.map((value, idx) => (
                  <span key={idx} className="filter-value">
                    {value}
                    <button onClick={() => removeFilter("LINE_NUMB", value)}>
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          )}

          {filters.operator_name && filters.operator_name.length > 0 && (
            <div className="active-filter">
              Operator Name:
              {filters.operator_name.includes("All") ? (
                <span className="filter-value">
                  All
                  <button onClick={() => removeFilter("operator_name", "All")}>
                    ×
                  </button>
                </span>
              ) : (
                filters.operator_name.map((value, idx) => (
                  <span key={idx} className="filter-value">
                    {value}
                    <button
                      onClick={() => removeFilter("operator_name", value)}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          )}

          {(fromDate || toDate) && (
            <div className="active-filter">
              Date Range: {fromDate || "Start"} to {toDate || "End"}
              <button
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                  setCurrentPage(1);
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>

        {!showSummary && (
          <div className="table-container">
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
                  {loading ? (
                    <tr>
                      <td colSpan={TABLE_HEADS.length} className="loading-row">
                        Loading data...
                      </td>
                    </tr>
                  ) : filteredData.length > 0 ? (
                    currentRows.map((dataItem, index) => (
                      <tr key={indexOfFirstRow + index}>
                        {TABLE_HEADS.map((th, thIndex) => (
                          <td key={thIndex}>
                            {th.key === "index"
                              ? indexOfFirstRow + index + 1
                              : th.key === "created_at"
                              ? formatDateTime(dataItem[th.key])
                              : dataItem[th.key] || "-"}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={TABLE_HEADS.length} className="no-data">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredData.length > 0 && !loading && !showSummary && (
          <div className="pagination-controls">
            <div className="page-info">
              Showing {indexOfFirstRow + 1} to{" "}
              {Math.min(indexOfLastRow, totalRows)} of {totalRows} entries
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
        )}
      </div>
    </section>
  );
};

export default AReport;
