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
  FaCalendarAlt,
  FaTable, // ADD THIS MISSING IMPORT
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

const API_URL = "https://oceanatlantic.pinesphere.co.in/api/get_consolidated_logs/";

const ConsolidatedReports = () => {
  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filters, setFilters] = useState({
    MACHINE_ID: [],
    LINE_NUMB: [],
    operator_name: [],
  });
  // Add this function to calculate aggregated metrics based on summaryFilter
const calculateAggregatedMetrics = () => {
  if (!filteredData.length) return {
    productiveTime: 0,
    needleRuntimePercentage: 0,
    sewingSpeed: 0,
    totalHours: 0
  };

  const nonSummaryData = filteredData.filter(item => !item.isSummary);
  
  if (summaryFilter === "operator") {
    // Group by operator and calculate their aggregated metrics
    const operatorGroups = {};
    nonSummaryData.forEach(item => {
      const key = item.OPERATOR_ID;
      if (!operatorGroups[key]) {
        operatorGroups[key] = {
          sewingHours: 0,
          totalHours: 10, // Fixed 10 hours per operator
          needleRuntime: 0,
          sewingSeconds: 0,
          stitchCount: 0,
          records: 0
        };
      }
      
      const sewingHours = item.MODE === 1 ? (item.duration_hours || 0) : 0;
      operatorGroups[key].sewingHours += sewingHours;
      operatorGroups[key].needleRuntime += item.NEEDLE_RUNTIME || 0;
      operatorGroups[key].sewingSeconds += sewingHours * 3600;
      operatorGroups[key].stitchCount += item.STITCH_COUNT || 0;
      operatorGroups[key].records += 1;
    });

    const operators = Object.values(operatorGroups);
    const totalOperators = operators.length;
    
    return {
      productiveTime: totalOperators > 0 
        ? (operators.reduce((sum, op) => sum + (op.sewingHours / op.totalHours * 100), 0) / totalOperators)
        : 0,
      needleRuntimePercentage: totalOperators > 0
        ? operators.reduce((sum, op) => {
            const percentage = op.sewingSeconds > 0 ? (op.needleRuntime / op.sewingSeconds * 100) : 0;
            return sum + percentage;
          }, 0) / totalOperators
        : 0,
      sewingSpeed: totalOperators > 0
        ? operators.reduce((sum, op) => {
            const speed = op.sewingHours > 0 ? (op.stitchCount / op.sewingHours) : 0;
            return sum + speed;
          }, 0) / totalOperators
        : 0,
      totalHours: operators.reduce((sum, op) => sum + op.totalHours, 0)
    };
  }
  
  else if (summaryFilter === "machine") {
    // Group by machine and calculate their aggregated metrics
    const machineGroups = {};
    nonSummaryData.forEach(item => {
      const key = item.MACHINE_ID;
      if (!machineGroups[key]) {
        machineGroups[key] = {
          sewingHours: 0,
          totalHours: 10, // Fixed 10 hours per machine
          needleRuntime: 0,
          sewingSeconds: 0,
          stitchCount: 0,
          records: 0
        };
      }
      
      const sewingHours = item.MODE === 1 ? (item.duration_hours || 0) : 0;
      machineGroups[key].sewingHours += sewingHours;
      machineGroups[key].needleRuntime += item.NEEDLE_RUNTIME || 0;
      machineGroups[key].sewingSeconds += sewingHours * 3600;
      machineGroups[key].stitchCount += item.STITCH_COUNT || 0;
      machineGroups[key].records += 1;
    });

    const machines = Object.values(machineGroups);
    const totalMachines = machines.length;
    
    return {
      productiveTime: totalMachines > 0 
        ? (machines.reduce((sum, machine) => sum + (machine.sewingHours / machine.totalHours * 100), 0) / totalMachines)
        : 0,
      needleRuntimePercentage: totalMachines > 0
        ? machines.reduce((sum, machine) => {
            const percentage = machine.sewingSeconds > 0 ? (machine.needleRuntime / machine.sewingSeconds * 100) : 0;
            return sum + percentage;
          }, 0) / totalMachines
        : 0,
      sewingSpeed: totalMachines > 0
        ? machines.reduce((sum, machine) => {
            const speed = machine.sewingHours > 0 ? (machine.stitchCount / machine.sewingHours) : 0;
            return sum + speed;
          }, 0) / totalMachines
        : 0,
      totalHours: machines.reduce((sum, machine) => sum + machine.totalHours, 0)
    };
  }
  
  else if (summaryFilter === "line") {
    // Group by line and calculate their aggregated metrics
    const lineGroups = {};
    nonSummaryData.forEach(item => {
      const key = item.LINE_NUMB;
      if (!lineGroups[key]) {
        lineGroups[key] = {
          sewingHours: 0,
          totalHours: 10, // Fixed 10 hours per line
          needleRuntime: 0,
          sewingSeconds: 0,
          stitchCount: 0,
          records: 0
        };
      }
      
      const sewingHours = item.MODE === 1 ? (item.duration_hours || 0) : 0;
      lineGroups[key].sewingHours += sewingHours;
      lineGroups[key].needleRuntime += item.NEEDLE_RUNTIME || 0;
      lineGroups[key].sewingSeconds += sewingHours * 3600;
      lineGroups[key].stitchCount += item.STITCH_COUNT || 0;
      lineGroups[key].records += 1;
    });

    const lines = Object.values(lineGroups);
    const totalLines = lines.length;
    
    return {
      productiveTime: totalLines > 0 
        ? (lines.reduce((sum, line) => sum + (line.sewingHours / line.totalHours * 100), 0) / totalLines)
        : 0,
      needleRuntimePercentage: totalLines > 0
        ? lines.reduce((sum, line) => {
            const percentage = line.sewingSeconds > 0 ? (line.needleRuntime / line.sewingSeconds * 100) : 0;
            return sum + percentage;
          }, 0) / totalLines
        : 0,
      sewingSpeed: totalLines > 0
        ? lines.reduce((sum, line) => {
            const speed = line.sewingHours > 0 ? (line.stitchCount / line.sewingHours) : 0;
            return sum + speed;
          }, 0) / totalLines
        : 0,
      totalHours: lines.reduce((sum, line) => sum + line.totalHours, 0)
    };
  }

  return {
    productiveTime: 0,
    needleRuntimePercentage: 0,
    sewingSpeed: 0,
    totalHours: 0
  };
};
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
    reworkHours: 0,
    needleBreakHours: 0,
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
  const [summaryFilter, setSummaryFilter] = useState("operator"); // new summary filter state
  const [resetButtonHover, setResetButtonHover] = useState(false);

  // Utility to convert decimal hours to "H hours M minutes" format
  const formatHoursMinutes = (decimalHours) => {
    if (
      isNaN(decimalHours) ||
      decimalHours === null ||
      decimalHours === undefined
    )
      return "-";
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours} hours${minutes > 0 ? ` ${minutes} minutes` : ""}`;
  };

  // Utility to convert seconds to "H hours M minutes" format
  const formatSecondsToHoursMinutes = (seconds) => {
    if (isNaN(seconds) || seconds === null || seconds === undefined) return "-";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours} hours${minutes > 0 ? ` ${minutes} minutes` : ""}`;
  };

  const fetchData = async () => {
    if (!fromDate || !toDate) {
      setError("Please select both from and to dates");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('from_date', fromDate);
      params.append('to_date', toDate);
      
      filters.MACHINE_ID.forEach(id => params.append('machine_id', id));
      filters.LINE_NUMB.forEach(line => params.append('line_number', line));
      filters.operator_name.forEach(name => params.append('operator_name', name));
      
      const requestUrl = `${API_URL}?${params.toString()}`;
      console.log('Fetching data from:', requestUrl); // ADD DEBUG LOG
    
      const response = await fetch(requestUrl);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      console.log('Received data:', data); // ADD DEBUG LOG
    
      if (data && Array.isArray(data.logs)) {
        let processedData = data.logs.filter(item => {
          return item.OPERATOR_ID !== 0 && 
                 item.operator_name && 
                 !item.operator_name.toLowerCase().includes("unknown");
        });

        // Ensure duration_hours is present and correct
        processedData = processedData.map(item => {
          if (typeof item.duration_hours === 'number' && !isNaN(item.duration_hours)) {
            return item;
          }
          // Calculate duration_hours from START_TIME and END_TIME if possible
          if (item.START_TIME && item.END_TIME) {
            const parseTime = t => {
              const [h, m, s] = t.split(":").map(Number);
              return h * 3600 + m * 60 + (s || 0);
            };
            const start = parseTime(item.START_TIME);
            const end = parseTime(item.END_TIME);
            let duration = (end - start) / 3600;
            if (duration < 0) duration = 0;
            return { ...item, duration_hours: duration };
          }
          return { ...item, duration_hours: 0 };
        });

        // Apply priority-based filtering (Line > Machine > Operator)
        if (filters.LINE_NUMB.length > 0 && !filters.LINE_NUMB.includes("All")) {
          processedData = processedData.filter(item => filters.LINE_NUMB.includes(item.LINE_NUMB));
        }
        if (filters.MACHINE_ID.length > 0 && !filters.MACHINE_ID.includes("All")) {
          processedData = processedData.filter(item => filters.MACHINE_ID.includes(item.MACHINE_ID));
        }
        if (filters.operator_name.length > 0 && !filters.operator_name.includes("All")) {
          processedData = processedData.filter(item => filters.operator_name.includes(item.operator_name));
        }

        // Add summary rows based on selected filters
        processedData = addSummaryRows(processedData, filters);

        setTableData(processedData);
        setFilteredData(processedData);
        
        if (data.summary) {
          // Apply operator-specific idle hour calculation if operator is selected
          let idleHours = data.summary.idle_hours || 0;
          if (filters.operator_name.length > 0) {
            idleHours = Math.max(0, 10 - (
              (data.summary.sewing_hours || 0) +
              (data.summary.no_feeding_hours || 0) + 
              (data.summary.meeting_hours || 0) + 
              (data.summary.maintenance_hours || 0) +
              (data.summary.rework_hours || 0) +
              (data.summary.needle_break_hours || 0)
            ));
          }

          setSummaryData({
            sewingHours: data.summary.sewing_hours || 0,
            idleHours: idleHours,
            meetingHours: data.summary.meeting_hours || 0,
            noFeedingHours: data.summary.no_feeding_hours || 0,
            maintenanceHours: data.summary.maintenance_hours || 0,
            reworkHours: data.summary.rework_hours || 0,
            needleBreakHours: data.summary.needle_break_hours || 0,
            totalHours: 10,
            productiveTimePercent: data.summary.productive_percent || 0,
            nptPercent: data.summary.npt_percent || 0,
            sewingSpeed: data.summary.sewing_speed || 0,
            stitchCount: data.summary.total_stitch_count || 0,
            needleRuntime: data.summary.total_needle_runtime || 0
          });
          setSummaryDataAvailable(true);
          setShowSummary(true); // Show summary by default
        } else {
          setSummaryDataAvailable(false);
          setShowSummary(true); // Show summary view even without summary data
        }
        
        setActiveFilters({
          from_date: fromDate,
          to_date: toDate,
          machine_id: filters.MACHINE_ID.join(", ") || "All",
          line_number: filters.LINE_NUMB.join(", ") || "All",
          operator_name: filters.operator_name.join(", ") || "All"
        });
      } else {
        throw new Error("Invalid data format received from server");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
      setSummaryDataAvailable(false);
      setShowSummary(false); // CHANGED: Don't show summary on error
    } finally {
      setLoading(false);
    }
  };

  const addSummaryRows = (data, filters) => {
    const summaryRows = [];

    // Priority 1: Line Number
    if (filters.LINE_NUMB.length > 0) {
      const lines = filters.LINE_NUMB.includes("All")
        ? [...new Set(data.map((item) => item.LINE_NUMB))]
        : filters.LINE_NUMB;

      lines.forEach((line) => {
        const lineData = data.filter((item) => item.LINE_NUMB === line);

        // Priority 2: Machine ID within Line
        if (filters.MACHINE_ID.length > 0) {
          const machines = filters.MACHINE_ID.includes("All")
            ? [...new Set(lineData.map((item) => item.MACHINE_ID))]
            : filters.MACHINE_ID;

          machines.forEach((machine) => {
            const machineData = lineData.filter(
              (item) => item.MACHINE_ID === machine
            );
            summaryRows.push(
              createSummaryRow(machineData, `Line ${line} - Machine ${machine}`)
            );
          });
        }

        // Line summary
        summaryRows.push(createSummaryRow(lineData, `Line ${line} Summary`));
      });
    }
    // Priority 2: Machine ID (no line filter)
    else if (filters.MACHINE_ID.length > 0) {
      const machines = filters.MACHINE_ID.includes("All")
        ? [...new Set(data.map((item) => item.MACHINE_ID))]
        : filters.MACHINE_ID;

      machines.forEach((machine) => {
        const machineData = data.filter((item) => item.MACHINE_ID === machine);
        summaryRows.push(
          createSummaryRow(machineData, `Machine ${machine} Summary`)
        );
      });
    }
    // Priority 3: Operator Name (no line/machine filters)
    else if (filters.operator_name.length > 0) {
      const operators = filters.operator_name.includes("All")
        ? [...new Set(data.map((item) => item.operator_name))]
        : filters.operator_name;

      operators.forEach((operator) => {
        const operatorData = data.filter(
          (item) => item.operator_name === operator
        );
        // Find highest machine ID for this operator
        const machines = [
          ...new Set(operatorData.map((item) => item.MACHINE_ID)),
        ];
        const highestMachine = Math.max(...machines);

        summaryRows.push(
          createSummaryRow(
            operatorData,
            `Operator ${operator} Summary`,
            highestMachine
          )
        );
      });
    }

    return [...summaryRows, ...data];
  };

  const createSummaryRow = (data, title, machineId = null) => {
    // Calculate hours for each mode
    const sewingHours = data
      .filter((d) => d.MODE === 1)
      .reduce((sum, d) => sum + (d.duration_hours || 0), 0);
    // Special handling for operator-specific idle time
    let idleHours = data
      .filter((d) => d.MODE === 2)
      .reduce((sum, d) => sum + (d.duration_hours || 0), 0);
    if (filters.operator_name.length > 0) {
      idleHours = Math.max(
        0,
        10 -
          (sewingHours +
            data
              .filter((d) => d.MODE === 3)
              .reduce((sum, d) => sum + (d.duration_hours || 0), 0) + // meeting
            data
              .filter((d) => d.MODE === 4)
              .reduce((sum, d) => sum + (d.duration_hours || 0), 0) + // no feeding
            data
              .filter((d) => d.MODE === 5)
              .reduce((sum, d) => sum + (d.duration_hours || 0), 0) + // maintenance
            data
              .filter((d) => d.MODE === 6)
              .reduce((sum, d) => sum + (d.duration_hours || 0), 0) + // rework
            data
              .filter((d) => d.MODE === 7)
              .reduce((sum, d) => sum + (d.duration_hours || 0), 0)) // needle break
      );
    }
    const totalHours = 10; // Fixed 10-hour day
    return {
      isSummary: true,
      summaryTitle: title,
      MACHINE_ID: machineId || "SUMMARY",
      LINE_NUMB: data[0]?.LINE_NUMB || "",
      operator_name: title,
      STITCH_COUNT: data.reduce((sum, d) => sum + (d.STITCH_COUNT || 0), 0),
      NEEDLE_RUNTIME: data.reduce((sum, d) => sum + (d.NEEDLE_RUNTIME || 0), 0),
      sewingHours: sewingHours, // keep as number
      idleHours: idleHours,
      meetingHours: data
        .filter((d) => d.MODE === 3)
        .reduce((sum, d) => sum + (d.duration_hours || 0), 0),
      noFeedingHours: data
        .filter((d) => d.MODE === 4)
        .reduce((sum, d) => sum + (d.duration_hours || 0), 0),
      maintenanceHours: data
        .filter((d) => d.MODE === 5)
        .reduce((sum, d) => sum + (d.duration_hours || 0), 0),
      reworkHours: data
        .filter((d) => d.MODE === 6)
        .reduce((sum, d) => sum + (d.duration_hours || 0), 0),
      needleBreakHours: data
        .filter((d) => d.MODE === 7)
        .reduce((sum, d) => sum + (d.duration_hours || 0), 0),
      totalHours: totalHours,
      productiveTimePercent: ((sewingHours / totalHours) * 100).toFixed(2),
      nptPercent: (
        ((idleHours +
          data
            .filter((d) => d.MODE === 3)
            .reduce((sum, d) => sum + (d.duration_hours || 0), 0) +
          data
            .filter((d) => d.MODE === 4)
            .reduce((sum, d) => sum + (d.duration_hours || 0), 0) +
          data
            .filter((d) => d.MODE === 5)
            .reduce((sum, d) => sum + (d.duration_hours || 0), 0) +
          data
            .filter((d) => d.MODE === 6)
            .reduce((sum, d) => sum + (d.duration_hours || 0), 0) +
          data
            .filter((d) => d.MODE === 7)
            .reduce((sum, d) => sum + (d.duration_hours || 0), 0)) /
          totalHours) *
        100
      ).toFixed(2),
    };
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

  // Updated getFilterOptions to be dependent on other filters
  const getFilterOptions = (type) => {
    let filtered = tableData.filter((item) => !item.isSummary);
    // Apply other filters except the current one
    if (
      type !== "MACHINE_ID" &&
      filters.MACHINE_ID.length > 0 &&
      !filters.MACHINE_ID.includes("All")
    ) {
      filtered = filtered.filter((item) =>
        filters.MACHINE_ID.includes(item.MACHINE_ID)
      );
    }
    if (
      type !== "LINE_NUMB" &&
      filters.LINE_NUMB.length > 0 &&
      !filters.LINE_NUMB.includes("All")
    ) {
      filtered = filtered.filter((item) =>
        filters.LINE_NUMB.includes(item.LINE_NUMB)
      );
    }
    if (
      type !== "operator_name" &&
      filters.operator_name.length > 0 &&
      !filters.operator_name.includes("All")
    ) {
      filtered = filtered.filter((item) =>
        filters.operator_name.includes(item.operator_name)
      );
    }
    const options = [
      ...new Set(
        filtered
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
        newSelectedValues = prev.selectedValues.includes("All")
          ? []
          : [...prev.options.filter((opt) => opt !== "All")];
      } else {
        newSelectedValues = prev.selectedValues.includes(option)
          ? prev.selectedValues.filter((v) => v !== option && v !== "All")
          : [...prev.selectedValues.filter((v) => v !== "All"), option];

        if (newSelectedValues.length === prev.options.length - 1) {
          newSelectedValues = [...prev.options];
        }
      }

      return {
        ...prev,
        selectedValues: newSelectedValues,
      };
    });
  };

  const applyFilterChanges = () => {
    const selectedValues = showFilterPopup.selectedValues.filter(
      (v) => v !== "All"
    );
    const newFilters = {
      ...filters,
      [showFilterPopup.type]: selectedValues,
    };
    setFilters(newFilters);
    setShowFilterPopup({
      show: false,
      type: null,
      options: [],
      selectedValues: [],
    });
    setCurrentPage(1);

    // Immediately filter tableData based on newFilters
    let filtered = tableData.filter((item) => !item.isSummary);
    if (
      newFilters.MACHINE_ID.length > 0 &&
      !newFilters.MACHINE_ID.includes("All")
    ) {
      filtered = filtered.filter((item) =>
        newFilters.MACHINE_ID.includes(item.MACHINE_ID)
      );
    }
    if (
      newFilters.LINE_NUMB.length > 0 &&
      !newFilters.LINE_NUMB.includes("All")
    ) {
      filtered = filtered.filter((item) =>
        newFilters.LINE_NUMB.includes(item.LINE_NUMB)
      );
    }
    if (
      newFilters.operator_name.length > 0 &&
      !newFilters.operator_name.includes("All")
    ) {
      filtered = filtered.filter((item) =>
        newFilters.operator_name.includes(item.operator_name)
      );
    }
    setFilteredData(filtered);
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

  // Add these new download functions after the existing downloadCSV function:
  
  const downloadCSV = () => {
    try {
      if (showSummary) {
        downloadSummaryCSV();
      } else {
        downloadRawDataCSV();
      }
    } catch (error) {
      console.error("Error generating CSV:", error);
      alert("Failed to generate CSV file");
    }
  };
  
  const downloadRawDataCSV = () => {
    const headers = TABLE_HEADS.map((th) => th.label).join(",");
    const rows = filteredData
      .filter((item) => !item.isSummary)
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
    link.download = "consolidated_report_raw_data.csv";
    link.click();
  };
  
  const downloadSummaryCSV = () => {
    let csvContent = "";
    
    // Main Summary Table
    const summaryHeaders = [
      "Date Range",
      "Operator ID", 
      "Operator Name",
      "Machine ID",
      "Line Number",
      "Total Hours",
      "Sewing Hours",
      "Idle Hours", 
      "Meeting Hours",
      "No Feeding Hours",
      "Maintenance Hours",
      "Rework Hours",
      "Needle Break Hours",
      "Productive Time %",
      "NPT %",
      "Sewing Speed",
      "Stitch Count",
      "Needle Runtime"
    ].join(",");
    
    const summaryRow = [
      `"${activeFilters.from_date || "Start"} to ${activeFilters.to_date || "End"}"`,
      `"${activeFilters.OPERATOR_ID || "All"}"`,
      `"${activeFilters.operator_name || "All"}"`,
      `"${activeFilters.machine_id || "All"}"`,
      `"${activeFilters.line_number || "All"}"`,
      `"${formatHoursMinutes(summaryData.totalHours)}"`,
      `"${formatHoursMinutes(summaryData.sewingHours)}"`,
      `"${formatHoursMinutes(summaryData.idleHours)}"`,
      `"${formatHoursMinutes(summaryData.meetingHours)}"`,
      `"${formatHoursMinutes(summaryData.noFeedingHours)}"`,
      `"${formatHoursMinutes(summaryData.maintenanceHours)}"`,
      `"${formatHoursMinutes(summaryData.reworkHours)}"`,
      `"${formatHoursMinutes(summaryData.needleBreakHours)}"`,
      `"${Number(summaryData.productiveTimePercent || 0).toFixed(2)}%"`,
      `"${Number(summaryData.nptPercent || 0).toFixed(2)}%"`,
      `"${Number(summaryData.sewingSpeed || 0).toFixed(2)}"`,
      `"${Number(summaryData.stitchCount || 0).toFixed(2)}"`,
      `"${Number(summaryData.needleRuntime || 0).toFixed(2)}"`
    ].join(",");
    
    csvContent += "MAIN SUMMARY REPORT\n";
    csvContent += summaryHeaders + "\n";
    csvContent += summaryRow + "\n\n";
    
    // Per-ID Summary Tables based on current filter
    if (summaryFilter === "operator") {
      csvContent += "OPERATOR ID SUMMARY\n";
      csvContent += "Operator ID,Operator Name,Total Hours,Sewing,Idle,Meeting,No Feeding,Maintenance,Rework,Needle Break,Productive %,Non-Productive %\n";
      
      [...new Set(filteredData.filter((d) => !d.isSummary).map((d) => d.OPERATOR_ID))].forEach((operatorId) => {
        const operatorRows = filteredData.filter((d) => d.OPERATOR_ID === operatorId && !d.isSummary);
        const operatorName = operatorRows[0]?.operator_name || "-";
        const totalHours = 10;
        const sewing = operatorRows.filter((d) => d.MODE === 1).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
        const idle = operatorRows.filter((d) => d.MODE === 2).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
        const meeting = operatorRows.filter((d) => d.MODE === 3).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
        const noFeeding = operatorRows.filter((d) => d.MODE === 4).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
        const maintenance = operatorRows.filter((d) => d.MODE === 5).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
        const rework = operatorRows.filter((d) => d.MODE === 6).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
        const needleBreak = operatorRows.filter((d) => d.MODE === 7).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
        const productivePercent = ((sewing / totalHours) * 100).toFixed(2);
        const nonProductivePercent = (((idle + meeting + noFeeding + maintenance + rework + needleBreak) / totalHours) * 100).toFixed(2);
        
        csvContent += `"${operatorId}","${operatorName}","${formatHoursMinutes(totalHours)}","${formatHoursMinutes(sewing)}","${formatHoursMinutes(idle)}","${formatHoursMinutes(meeting)}","${formatHoursMinutes(noFeeding)}","${formatHoursMinutes(maintenance)}","${formatHoursMinutes(rework)}","${formatHoursMinutes(needleBreak)}","${productivePercent}%","${nonProductivePercent}%"\n`;
      });
      csvContent += "\n";
    }
    
    if (summaryFilter === "machine") {
      csvContent += "MACHINE ID SUMMARY\n";
      csvContent += "Machine ID,Total Hours,Sewing,Idle,Meeting,No Feeding,Maintenance,Rework,Needle Break,Productive %,Non-Productive %\n";
      
      [...new Set(filteredData.filter((d) => !d.isSummary).map((d) => d.MACHINE_ID))].forEach((machineId) => {
        const machineRows = filteredData.filter((d) => d.MACHINE_ID === machineId && !d.isSummary);
        const totalHours = 10;
        const sewing = machineRows.filter((d) => d.MODE === 1).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
        const idle = machineRows.filter((d) => d.MODE === 2).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
        const meeting = machineRows.filter((d) => d.MODE === 3).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
        const noFeeding = machineRows.filter((d) => d.MODE === 4).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
        const maintenance = machineRows.filter((d) => d.MODE === 5).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
        const rework = machineRows.filter((d) => d.MODE === 6).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
        const needleBreak = machineRows.filter((d) => d.MODE === 7).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
        const productivePercent = ((sewing / totalHours) * 100).toFixed(2);
        const nonProductivePercent = (((idle + meeting + noFeeding + maintenance + rework + needleBreak) / totalHours) * 100).toFixed(2);
        
        csvContent += `"${machineId}","${formatHoursMinutes(totalHours)}","${formatHoursMinutes(sewing)}","${formatHoursMinutes(idle)}","${formatHoursMinutes(meeting)}","${formatHoursMinutes(noFeeding)}","${formatHoursMinutes(maintenance)}","${formatHoursMinutes(rework)}","${formatHoursMinutes(needleBreak)}","${productivePercent}%","${nonProductivePercent}%"\n`;
      });
      csvContent += "\n";
    }
    
    if (summaryFilter === "line") {
      csvContent += "LINE NUMBER SUMMARY\n";
      csvContent += "Line Number,Total Hours,Sewing,Idle,Meeting,No Feeding,Maintenance,Rework,Needle Break,Productive %,Non-Productive %\n";
      
      [...new Set(filteredData.filter(d => !d.isSummary).map(d => d.LINE_NUMB))].forEach((lineNum) => {
        const lineRows = filteredData.filter(d => d.LINE_NUMB === lineNum && !d.isSummary);
        const totalHours = 10;
        const sewing = lineRows.filter(d => d.MODE === 1).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
        const idle = lineRows.filter(d => d.MODE === 2).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
        const meeting = lineRows.filter(d => d.MODE === 3).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
        const noFeeding = lineRows.filter(d => d.MODE === 4).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
        const maintenance = lineRows.filter(d => d.MODE === 5).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
        const rework = lineRows.filter(d => d.MODE === 6).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
        const needleBreak = lineRows.filter(d => d.MODE === 7).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
        const productivePercent = ((sewing / totalHours) * 100).toFixed(2);
        const nonProductivePercent = (((idle + meeting + noFeeding + maintenance + rework + needleBreak) / totalHours) * 100).toFixed(2);
        
        csvContent += `"${lineNum}","${formatHoursMinutes(totalHours)}","${formatHoursMinutes(sewing)}","${formatHoursMinutes(idle)}","${formatHoursMinutes(meeting)}","${formatHoursMinutes(noFeeding)}","${formatHoursMinutes(maintenance)}","${formatHoursMinutes(rework)}","${formatHoursMinutes(needleBreak)}","${productivePercent}%","${nonProductivePercent}%"\n`;
      });
      csvContent += "\n";
    }
    
    // Aggregated Metrics
    csvContent += "AGGREGATED METRICS\n";
    csvContent += "Metric,Value\n";
    csvContent += `"Productive Time","${calculateAggregatedMetrics().productiveTime.toFixed(2)}%"\n`;
    csvContent += `"Needle Runtime Percentage","${calculateAggregatedMetrics().needleRuntimePercentage.toFixed(2)}%"\n`;
    csvContent += `"Sewing Speed","${calculateAggregatedMetrics().sewingSpeed.toFixed(0)}"\n`;
    csvContent += `"Total Hours","${formatHoursMinutes(calculateAggregatedMetrics().totalHours)}"\n`;
  
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "consolidated_report_summary.csv";
    link.click();
  };
  
  const downloadHTML = () => {
    try {
      if (showSummary) {
        downloadSummaryHTML();
      } else {
        downloadRawDataHTML();
      }
    } catch (error) {
      console.error("Error generating HTML:", error);
      alert("Failed to generate HTML file");
    }
  };
  
  const downloadRawDataHTML = () => {
    const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
      <title>Consolidated Report - Raw Data</title>
      <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .header { text-align: center; margin-bottom: 20px; }
          .info { margin-bottom: 15px; }
      </style>
  </head>
  <body>
      <div class="header">
          <h1>Consolidated Report - Raw Data</h1>
          <div class="info">
              <p><strong>Date Range:</strong> ${activeFilters.from_date || "Start"} to ${activeFilters.to_date || "End"}</p>
              <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Total Records:</strong> ${filteredData.filter(item => !item.isSummary).length}</p>
          </div>
      </div>
      
      <table>
          <thead>
              <tr>
                  ${TABLE_HEADS.map(th => `<th>${th.label}</th>`).join('')}
              </tr>
          </thead>
          <tbody>
              ${filteredData
                .filter(item => !item.isSummary)
                .map((item, index) => `
                  <tr>
                      ${TABLE_HEADS.map(th => {
                        let value;
                        if (th.key === "index") {
                          value = index + 1;
                        } else if (th.key === "created_at") {
                          value = formatDateTime(item[th.key]);
                        } else if (th.key === "NEEDLE_RUNTIME" || th.key === "NEEDLE_STOPTIME") {
                          value = formatSecondsToHoursMinutes(item[th.key]);
                        } else {
                          value = item[th.key] || "-";
                        }
                        return `<td>${value}</td>`;
                      }).join('')}
                  </tr>
                `).join('')}
          </tbody>
      </table>
  </body>
  </html>`;
  
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "consolidated_report_raw_data.html";
    link.click();
  };
  
  const downloadSummaryHTML = () => {
    const generatePerIDHTML = () => {
      if (summaryFilter === "operator") {
        return `
        <div class="section">
            <h2>Operator ID Summary</h2>
            <table>
                <thead>
                    <tr>
                        <th>Operator ID</th>
                        <th>Operator Name</th>
                        <th>Total Hours</th>
                        <th>Sewing</th>
                        <th>Idle</th>
                        <th>Meeting</th>
                        <th>No Feeding</th>
                        <th>Maintenance</th>
                        <th>Rework</th>
                        <th>Needle Break</th>
                        <th>Productive %</th>
                        <th>Non-Productive %</th>
                    </tr>
                </thead>
                <tbody>
                    ${[...new Set(filteredData.filter((d) => !d.isSummary).map((d) => d.OPERATOR_ID))]
                      .map((operatorId) => {
                        const operatorRows = filteredData.filter((d) => d.OPERATOR_ID === operatorId && !d.isSummary);
                        const operatorName = operatorRows[0]?.operator_name || "-";
                        const totalHours = 10;
                        const sewing = operatorRows.filter((d) => d.MODE === 1).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                        const idle = operatorRows.filter((d) => d.MODE === 2).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                        const meeting = operatorRows.filter((d) => d.MODE === 3).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                        const noFeeding = operatorRows.filter((d) => d.MODE === 4).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                        const maintenance = operatorRows.filter((d) => d.MODE === 5).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                        const rework = operatorRows.filter((d) => d.MODE === 6).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                        const needleBreak = operatorRows.filter((d) => d.MODE === 7).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                        const productivePercent = ((sewing / totalHours) * 100).toFixed(2);
                        const nonProductivePercent = (((idle + meeting + noFeeding + maintenance + rework + needleBreak) / totalHours) * 100).toFixed(2);
                        
                        return `
                          <tr>
                            <td>${operatorId}</td>
                            <td>${operatorName}</td>
                            <td>${formatHoursMinutes(totalHours)}</td>
                            <td>${formatHoursMinutes(sewing)}</td>
                            <td>${formatHoursMinutes(idle)}</td>
                            <td>${formatHoursMinutes(meeting)}</td>
                            <td>${formatHoursMinutes(noFeeding)}</td>
                            <td>${formatHoursMinutes(maintenance)}</td>
                            <td>${formatHoursMinutes(rework)}</td>
                            <td>${formatHoursMinutes(needleBreak)}</td>
                            <td>${productivePercent}%</td>
                            <td>${nonProductivePercent}%</td>
                          </tr>
                        `;
                      }).join('')}
                </tbody>
            </table>
        </div>
        `;
      } else if (summaryFilter === "machine") {
        return `
        <div class="section">
            <h2>Machine ID Summary</h2>
            <table>
                <thead>
                    <tr>
                        <th>Machine ID</th>
                        <th>Total Hours</th>
                        <th>Sewing</th>
                        <th>Idle</th>
                        <th>Meeting</th>
                        <th>No Feeding</th>
                        <th>Maintenance</th>
                        <th>Rework</th>
                        <th>Needle Break</th>
                        <th>Productive %</th>
                        <th>Non-Productive %</th>
                    </tr>
                </thead>
                <tbody>
                    ${[...new Set(filteredData.filter((d) => !d.isSummary).map((d) => d.MACHINE_ID))]
                      .map((machineId) => {
                        const machineRows = filteredData.filter((d) => d.MACHINE_ID === machineId && !d.isSummary);
                        const totalHours = 10;
                        const sewing = machineRows.filter((d) => d.MODE === 1).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                        const idle = machineRows.filter((d) => d.MODE === 2).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                        const meeting = machineRows.filter((d) => d.MODE === 3).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                        const noFeeding = machineRows.filter((d) => d.MODE === 4).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                        const maintenance = machineRows.filter((d) => d.MODE === 5).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                        const rework = machineRows.filter((d) => d.MODE === 6).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                        const needleBreak = machineRows.filter((d) => d.MODE === 7).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                        const productivePercent = ((sewing / totalHours) * 100).toFixed(2);
                        const nonProductivePercent = (((idle + meeting + noFeeding + maintenance + rework + needleBreak) / totalHours) * 100).toFixed(2);
                        
                        return `
                          <tr>
                            <td>${machineId}</td>
                            <td>${formatHoursMinutes(totalHours)}</td>
                            <td>${formatHoursMinutes(sewing)}</td>
                            <td>${formatHoursMinutes(idle)}</td>
                            <td>${formatHoursMinutes(meeting)}</td>
                            <td>${formatHoursMinutes(noFeeding)}</td>
                            <td>${formatHoursMinutes(maintenance)}</td>
                            <td>${formatHoursMinutes(rework)}</td>
                            <td>${formatHoursMinutes(needleBreak)}</td>
                            <td>${productivePercent}%</td>
                            <td>${nonProductivePercent}%</td>
                          </tr>
                        `;
                      }).join('')}
                </tbody>
            </table>
        </div>
        `;
      } else if (summaryFilter === "line") {
        return `
        <div class="section">
            <h2>Line Number Summary</h2>
            <table>
                <thead>
                    <tr>
                        <th>Line Number</th>
                        <th>Total Hours</th>
                        <th>Sewing</th>
                        <th>Idle</th>
                        <th>Meeting</th>
                        <th>No Feeding</th>
                        <th>Maintenance</th>
                        <th>Rework</th>
                        <th>Needle Break</th>
                        <th>Productive %</th>
                        <th>Non-Productive %</th>
                    </tr>
                </thead>
                <tbody>
                    ${[...new Set(filteredData.filter(d => !d.isSummary).map(d => d.LINE_NUMB))]
                      .map((lineNum) => {
                        const lineRows = filteredData.filter(d => d.LINE_NUMB === lineNum && !d.isSummary);
                        const totalHours = 10;
                        const sewing = lineRows.filter(d => d.MODE === 1).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                        const idle = lineRows.filter(d => d.MODE === 2).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                        const meeting = lineRows.filter(d => d.MODE === 3).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                        const noFeeding = lineRows.filter(d => d.MODE === 4).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                        const maintenance = lineRows.filter(d => d.MODE === 5).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                        const rework = lineRows.filter(d => d.MODE === 6).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                        const needleBreak = lineRows.filter(d => d.MODE === 7).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                        const productivePercent = ((sewing / totalHours) * 100).toFixed(2);
                        const nonProductivePercent = (((idle + meeting + noFeeding + maintenance + rework + needleBreak) / totalHours) * 100).toFixed(2);
                        
                        return `
                          <tr>
                            <td>${lineNum}</td>
                            <td>${formatHoursMinutes(totalHours)}</td>
                            <td>${formatHoursMinutes(sewing)}</td>
                            <td>${formatHoursMinutes(idle)}</td>
                            <td>${formatHoursMinutes(meeting)}</td>
                            <td>${formatHoursMinutes(noFeeding)}</td>
                            <td>${formatHoursMinutes(maintenance)}</td>
                            <td>${formatHoursMinutes(rework)}</td>
                            <td>${formatHoursMinutes(needleBreak)}</td>
                            <td>${productivePercent}%</td>
                            <td>${nonProductivePercent}%</td>
                          </tr>
                        `;
                      }).join('')}
                </tbody>
            </table>
        </div>
        `;
      }
      return "";
    };
  
    const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
      <title>Consolidated Report - Summary</title>
      <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .header { text-align: center; margin-bottom: 20px; }
          .info { margin-bottom: 15px; }
          .section { margin-top: 30px; }
          .metrics { display: flex; justify-content: space-around; margin: 20px 0; flex-wrap: wrap; }
          .metric-box { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 5px; margin: 5px; min-width: 150px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #2196F3; }
          .metric-label { font-size: 14px; color: #666; }
      </style>
  </head>
  <body>
      <div class="header">
          <h1>Consolidated Report - Summary Dashboard</h1>
          <div class="info">
              <p><strong>Date Range:</strong> ${activeFilters.from_date || "Start"} to ${activeFilters.to_date || "End"}</p>
              <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Summary Filter:</strong> ${summaryFilter.charAt(0).toUpperCase() + summaryFilter.slice(1)}</p>
          </div>
      </div>
  
      <div class="metrics">
          <div class="metric-box">
              <div class="metric-value">${calculateAggregatedMetrics().productiveTime.toFixed(2)}%</div>
              <div class="metric-label">Productive Time</div>
          </div>
          <div class="metric-box">
              <div class="metric-value">${calculateAggregatedMetrics().needleRuntimePercentage.toFixed(2)}%</div>
              <div class="metric-label">Needle Runtime %</div>
          </div>
          <div class="metric-box">
              <div class="metric-value">${calculateAggregatedMetrics().sewingSpeed.toFixed(0)}</div>
              <div class="metric-label">Sewing Speed</div>
          </div>
          <div class="metric-box">
              <div class="metric-value">${formatHoursMinutes(calculateAggregatedMetrics().totalHours)}</div>
              <div class="metric-label">Total Hours</div>
          </div>
      </div>
      
      <div class="section">
          <h2>Main Summary</h2>
          <table>
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
                      <th>Rework Hours</th>
                      <th>Needle Break Hours</th>
                      <th>Productive Time %</th>
                      <th>NPT %</th>
                      <th>Sewing Speed</th>
                      <th>Stitch Count</th>
                      <th>Needle Runtime</th>
                  </tr>
              </thead>
              <tbody>
                  <tr>
                      <td>${activeFilters.from_date || "Start"} to ${activeFilters.to_date || "End"}</td>
                      <td>${activeFilters.OPERATOR_ID || "All"}</td>
                      <td>${activeFilters.operator_name || "All"}</td>
                      <td>${activeFilters.machine_id || "All"}</td>
                      <td>${activeFilters.line_number || "All"}</td>
                      <td>${formatHoursMinutes(summaryData.totalHours)}</td>
                      <td>${formatHoursMinutes(summaryData.sewingHours)}</td>
                      <td>${formatHoursMinutes(summaryData.idleHours)}</td>
                      <td>${formatHoursMinutes(summaryData.meetingHours)}</td>
                      <td>${formatHoursMinutes(summaryData.noFeedingHours)}</td>
                      <td>${formatHoursMinutes(summaryData.maintenanceHours)}</td>
                      <td>${formatHoursMinutes(summaryData.reworkHours)}</td>
                      <td>${formatHoursMinutes(summaryData.needleBreakHours)}</td>
                      <td>${Number(summaryData.productiveTimePercent || 0).toFixed(2)}%</td>
                      <td>${Number(summaryData.nptPercent || 0).toFixed(2)}%</td>
                      <td>${Number(summaryData.sewingSpeed || 0).toFixed(2)}</td>
                      <td>${Number(summaryData.stitchCount || 0).toFixed(2)}</td>
                      <td>${Number(summaryData.needleRuntime || 0).toFixed(2)}</td>
                  </tr>
              </tbody>
          </table>
      </div>
  
      ${generatePerIDHTML()}
  </body>
  </html>`;
  
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "consolidated_report_summary.html";
    link.click();
  };
  
  // Also wrap the return statement properly. Replace the current return section with:
  

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

  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={TABLE_HEADS.length} className="loading-row">
            Loading data...
          </td>
        </tr>
      );
    }

    if (filteredData.length === 0) {
      return (
        <tr>
          <td colSpan={TABLE_HEADS.length} className="no-data">
            No records found
          </td>
        </tr>
      );
    }

    return currentRows.map((dataItem, index) => {
      if (dataItem.isSummary) {
        return (
          <tr key={`summary-${index}`} className="summary-row">
            <td colSpan={TABLE_HEADS.length}>
              <div className="summary-header">
                <strong>{dataItem.summaryTitle}</strong>
                <span className="summary-total-hours">
                  Total Hours: {formatHoursMinutes(dataItem.totalHours)}
                </span>
              </div>
              <div className="summary-details">
                <div className="summary-metric">
                  <span className="metric-label">Sewing:</span>
                  <span className="metric-value">
                    {formatHoursMinutes(dataItem.sewingHours)} (
                    {dataItem.productiveTimePercent}%)
                  </span>
                </div>
                <div className="summary-metric">
                  <span className="metric-label">Idle:</span>
                  <span className="metric-value">
                    {formatHoursMinutes(dataItem.idleHours)}
                  </span>
                </div>
                <div className="summary-metric">
                  <span className="metric-label">Meeting:</span>
                  <span className="metric-value">
                    {formatHoursMinutes(dataItem.meetingHours)}
                  </span>
                </div>
                <div className="summary-metric">
                  <span className="metric-label">No Feeding:</span>
                  <span className="metric-value">
                    {formatHoursMinutes(dataItem.noFeedingHours)}
                  </span>
                </div>
                <div className="summary-metric">
                  <span className="metric-label">Maintenance:</span>
                  <span className="metric-value">
                    {formatHoursMinutes(dataItem.maintenanceHours)}
                  </span>
                </div>
                <div className="summary-metric">
                  <span className="metric-label">Rework:</span>
                  <span className="metric-value">
                    {formatHoursMinutes(dataItem.reworkHours)}
                  </span>
                </div>
                <div className="summary-metric">
                  <span className="metric-label">Needle Break:</span>
                  <span className="metric-value">
                    {formatHoursMinutes(dataItem.needleBreakHours)}
                  </span>
                </div>
                <div className="summary-metric">
                  <span className="metric-label">NPT:</span>
                  <span className="metric-value">{dataItem.nptPercent}%</span>
                </div>
              </div>
            </td>
          </tr>
        );
      }

      return (
        <tr key={indexOfFirstRow + index}>
          {TABLE_HEADS.map((th, thIndex) => (
            <td key={thIndex}>
              {th.key === "index"
                ? indexOfFirstRow + index + 1
                : th.key === "created_at"
                ? formatDateTime(dataItem[th.key])
                : th.key === "NEEDLE_RUNTIME" || th.key === "NEEDLE_STOPTIME"
                ? formatSecondsToHoursMinutes(dataItem[th.key])
                : [
                    "sewingHours",
                    "idleHours",
                    "meetingHours",
                    "noFeedingHours",
                    "maintenanceHours",
                    "reworkHours",
                    "needleBreakHours",
                    "totalHours",
                  ].includes(th.key)
                ? formatHoursMinutes(dataItem[th.key])
                : dataItem[th.key] || "-"}
            </td>
          ))}
        </tr>
      );
    });
  };

  // --- ensure default summaryFilter is 'operator' and summary table is shown by default ---
  useEffect(() => {
    setSummaryFilter("operator");
  }, []);

  return (
    <section className="content-area-table">
      <div className="data-table-info">
        <h4 className="data-table-title">Consolidated Report</h4>
        <div
          className="filter-wrapper"
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "flex-end",
            gap: "16px",
          }}
        >
          <div
            className="primary-filters"
            style={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "flex-end",
              gap: "16px",
            }}
          >
            
            <div className="filter-group" style={{ minWidth: "160px" }}>
              <label>From Date</label>
               <FaCalendarAlt className="calendar-icon" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>
            <div className="filter-group" style={{ minWidth: "160px" }}>
              <label>To Date</label>
               <FaCalendarAlt className="calendar-icon" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>
                <div className="filter-group" style={{ minWidth: "160px" }}>
                  <label>Select Filter</label>
                  <div
                    className={`filter-value-display clickable`}
                    onClick={() =>
                      setShowFilterPopup({
                        show: true,
                        type: "summaryFilter",
                        options: [
                          { label: "Operator", value: "operator" },
                          { label: "Machine", value: "machine" },
                          { label: "Line", value: "line" },
                        ],
                        selectedValues: [summaryFilter],
                      })
                    }
                    style={{ width: "100%" }}
                  >
                    {summaryFilter.charAt(0).toUpperCase() +
                      summaryFilter.slice(1)}
                  </div>
                </div>
            <button
              className="generate-button green-button"
              onClick={fetchData}
              disabled={!fromDate || !toDate}
            >
              <FaChartBar /> Generate
            </button>
            
            
            <button
              className="action-button reset-button"
              style={{ 
                backgroundColor: resetButtonHover ? "#ffcdd2" : "#ffebee", 
                color: "#2d3436", 
                borderColor: resetButtonHover ? "#e57373" : "#ef9a9a" 
              }}
              onMouseEnter={() => setResetButtonHover(true)}
              onMouseLeave={() => setResetButtonHover(false)}
              onClick={() => {
                setFromDate("");
                setToDate("");
                setCurrentPage(1);
              }}
            >
              <FaRedo /> Reset
            </button>
            {tableData.length > 0 && (
              <>
                <div className="filter-group" style={{ minWidth: "160px" }}>
                  <label>Machine ID</label>
                  <div
                    className={`filter-value-display clickable ${
                      filters.MACHINE_ID && filters.MACHINE_ID.length > 0
                        ? "has-value"
                        : ""
                    }`}
                    onClick={() => openFilterPopup("MACHINE_ID")}
                    style={{ width: "100%" }}
                  >
                    {getFilterDisplayText("MACHINE_ID")}
                  </div>
                </div>
                <div className="filter-group" style={{ minWidth: "160px" }}>
                  <label>Line Number</label>
                  <div
                    className={`filter-value-display clickable ${
                      filters.LINE_NUMB && filters.LINE_NUMB.length > 0
                        ? "has-value"
                        : ""
                    }`}
                    onClick={() => openFilterPopup("LINE_NUMB")}
                    style={{ width: "100%" }}
                  >
                    {getFilterDisplayText("LINE_NUMB")}
                  </div>
                </div>
                <div className="filter-group" style={{ minWidth: "160px" }}>
                  <label>Operator Name</label>
                  <div
                    className={`filter-value-display clickable ${
                      filters.operator_name && filters.operator_name.length > 0
                        ? "has-value"
                        : ""
                    }`}
                    onClick={() => openFilterPopup("operator_name")}
                    style={{ width: "100%" }}
                  >
                    {getFilterDisplayText("operator_name")}
                  </div>
                </div>

                <button
                  className="reset-filter-button"
                  style={{
                    marginTop: "25px",
                    backgroundColor: "#f44336",
                    color: "#fff",
                    height: "41px",
                    minWidth: "110px",
                  }}
                  onClick={() => {
                    setFilters({
                      MACHINE_ID: [],
                      LINE_NUMB: [],
                      operator_name: [],
                    });
                    setCurrentPage(1);
                  }}
                >
                  Reset Filters
                </button>
                <button
                  className="reset-button"
                  style={{
                    marginTop: "25px",
                    backgroundColor: "#607d8b",
                    color: "#fff",
                    height: "41px",
                    minWidth: "110px",
                  }}
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
          <div className="popup-content"            
                style={{
                  maxWidth: "700px !important",
                  maxHeight: "120vh !important"
                }} >
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
                      onChange={() => {}} // Handled by div click
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

      {showFilterPopup.show && showFilterPopup.type === "summaryFilter" && (
        <div className="filter-popup">
          <div className="popup-content">
            <div className="popup-header">
              <h3>Select Summary</h3>
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
            <div className="options-list">
              {showFilterPopup.options.map((option, index) => (
                <div
                  key={index}
                  className={`option-item clickable ${
                    showFilterPopup.selectedValues.includes(option.value)
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => {
                    setShowFilterPopup((prev) => ({
                      ...prev,
                      selectedValues: [option.value],
                    }));
                  }}
                >
                  <input
                    type="radio"
                    checked={showFilterPopup.selectedValues.includes(
                      option.value
                    )}
                    onChange={() => {}}
                  />
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
            <div className="popup-footer">
              <button
                className="apply-button"
                onClick={() => {
                  setSummaryFilter(
                    showFilterPopup.selectedValues[0] || "operator"
                  );
                  setShowFilterPopup({
                    show: false,
                    type: null,
                    options: [],
                    selectedValues: [],
                  });
                }}
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="results-section">
      <div className="results-header">
        <div className="results-header-left">
          <h4>
            {showSummary
              ? "Summary Dashboard"
              : `Raw Data (${filteredData.length} records)`}
            {loading && <span className="loading-indicator">Loading...</span>}
          </h4>

          {tableData.length > 0 && (
            <button
              className={`view-toggle-button`}
              onClick={toggleSummaryView}
              style={{ marginLeft: "15px" }}
              title={
                showSummary
                  ? "Switch to raw data view"
                  : "Switch to summary view"
              }
            >
              {showSummary ? (
                <>
                  <FaTable /> View Raw Data
                </>
              ) : (
                <>
                  <FaChartBar /> View Summary
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
              title={showSummary ? "Download Summary CSV" : "Download Raw Data CSV"}
            >
              <FaDownload /> CSV
            </button>
            <button
              onClick={downloadHTML}
              disabled={!filteredData.length}
              className="download-button"
              title={showSummary ? "Download Summary HTML" : "Download Raw Data HTML"}
              style={{ marginLeft: "10px" }}
            >
              <FaDownload /> HTML
            </button>
          </div>
      </div>

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
        {showSummary && (
          <div className="summary-section" style={{ marginBottom: "48px" }}>
            <h4>Summary Report</h4>
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
                    <th>Rework Hours</th>
                    <th>Needle Break Hours</th>
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
                    <td>{formatHoursMinutes(summaryData.totalHours)}</td>
                    <td>{formatHoursMinutes(summaryData.sewingHours)}</td>
                    <td>{formatHoursMinutes(summaryData.idleHours)}</td>
                    <td>{formatHoursMinutes(summaryData.meetingHours)}</td>
                    <td>{formatHoursMinutes(summaryData.noFeedingHours)}</td>
                    <td>{formatHoursMinutes(summaryData.maintenanceHours)}</td>
                    <td>{formatHoursMinutes(summaryData.reworkHours)}</td>
                    <td>{formatHoursMinutes(summaryData.needleBreakHours)}</td>
                    <td>
                      {Number(summaryData.productiveTimePercent || 0).toFixed(
                        2
                      )}
                      %
                    </td>
                    <td>{Number(summaryData.nptPercent || 0).toFixed(2)}%</td>
                    <td>{Number(summaryData.sewingSpeed || 0).toFixed(2)}</td>
                    <td>{Number(summaryData.stitchCount || 0).toFixed(2)}</td>
                    <td>{Number(summaryData.needleRuntime || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* --- BEGIN: Per-ID Single Line Summaries --- */}
            <div
              className="per-id-summary-section"
              style={{
                overflowX: "auto",
                maxWidth: "100%",
                marginBottom: "32px",
                marginTop: "32px",
              }}
            >
              {summaryFilter === "machine" && (
                <>
                  <h5 style={{ marginBottom: "20px" }}>Machine ID Summary</h5>
                  <div style={{ overflowX: "auto", marginBottom: "24px" }}>
                    <table className="summary-table">
                      <thead>
                        <tr>
                          <th>Machine ID</th>
                          <th>Total Hours</th>
                          <th>Sewing</th>
                          <th>Idle</th>
                          <th>Meeting</th>
                          <th>No Feeding</th>
                          <th>Maintenance</th>
                          <th>Rework</th>
                          <th>Needle Break</th>
                          <th>Productive %</th>
                          <th>Non-Productive %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ...new Set(
                            filteredData
                              .filter((d) => !d.isSummary)
                              .map((d) => d.MACHINE_ID)
                          ),
                        ].map((machineId) => {
                          const machineRows = filteredData.filter(
                            (d) => d.MACHINE_ID === machineId && !d.isSummary
                          );
                          const totalHours = 10;
                          const sewing = machineRows
                            .filter((d) => d.MODE === 1)
                            .reduce(
                              (sum, d) => sum + (d.duration_hours || 0),
                              0
                            );
                          const idle = machineRows
                            .filter((d) => d.MODE === 2)
                            .reduce(
                              (sum, d) => sum + (d.duration_hours || 0),
                              0
                            );
                          const meeting = machineRows
                            .filter((d) => d.MODE === 3)
                            .reduce(
                              (sum, d) => sum + (d.duration_hours || 0),
                              0
                            );
                          const noFeeding = machineRows
                            .filter((d) => d.MODE === 4)
                            .reduce(
                              (sum, d) => sum + (d.duration_hours || 0),
                              0
                            );
                          const maintenance = machineRows
                            .filter((d) => d.MODE === 5)
                            .reduce(
                              (sum, d) => sum + (d.duration_hours || 0),
                              0
                            );
                          const rework = machineRows
                            .filter((d) => d.MODE === 6)
                            .reduce(
                              (sum, d) => sum + (d.duration_hours || 0),
                              0
                            );
                          const needleBreak = machineRows
                            .filter((d) => d.MODE === 7)
                            .reduce(
                              (sum, d) => sum + (d.duration_hours || 0),
                              0
                            );
                          const productivePercent = (
                            (sewing / totalHours) *
                            100
                          ).toFixed(2);
                          const nonProductivePercent = (
                            ((idle +
                              meeting +
                              noFeeding +
                              maintenance +
                              rework +
                              needleBreak) /
                              totalHours) *
                            100
                          ).toFixed(2);
                          return (
                            <tr key={machineId}>
                              <td>{machineId}</td>
                              <td>{formatHoursMinutes(totalHours)}</td>
                              <td>{formatHoursMinutes(sewing)}</td>
                              <td>{formatHoursMinutes(idle)}</td>
                              <td>{formatHoursMinutes(meeting)}</td>
                              <td>{formatHoursMinutes(noFeeding)}</td>
                              <td>{formatHoursMinutes(maintenance)}</td>
                              <td>{formatHoursMinutes(rework)}</td>
                              <td>{formatHoursMinutes(needleBreak)}</td>
                              <td>{productivePercent}%</td>
                              <td>{nonProductivePercent}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {summaryFilter === "operator" && (
                <>
                  <h5 style={{ marginBottom: "20px" }}>Operator ID Summary</h5>
                  <div style={{ overflowX: "auto", marginBottom: "24px" }}>
                    <table className="summary-table">
                      <thead>
                        <tr>
                          <th>Operator ID</th>
                          <th>Operator Name</th>
                          <th>Total Hours</th>
                          <th>Sewing</th>
                          <th>Idle</th>
                          <th>Meeting</th>
                          <th>No Feeding</th>
                          <th>Maintenance</th>
                          <th>Rework</th>
                          <th>Needle Break</th>
                          <th>Productive %</th>
                          <th>Non-Productive %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ...new Set(
                            filteredData
                              .filter((d) => !d.isSummary)
                              .map((d) => d.OPERATOR_ID)
                          ),
                        ].map((operatorId) => {
                          const operatorRows = filteredData.filter(
                            (d) => d.OPERATOR_ID === operatorId && !d.isSummary
                          );
                          const operatorName =
                            operatorRows[0]?.operator_name || "-";
                          const totalHours = 10;
                          const sewing = operatorRows
                            .filter((d) => d.MODE === 1)
                            .reduce(
                              (sum, d) => sum + (d.duration_hours || 0),
                              0
                            );
                          const idle = operatorRows
                            .filter((d) => d.MODE === 2)
                            .reduce(
                              (sum, d) => sum + (d.duration_hours || 0),
                              0
                            );
                          const meeting = operatorRows
                            .filter((d) => d.MODE === 3)
                            .reduce(
                              (sum, d) => sum + (d.duration_hours || 0),
                              0
                            );
                          const noFeeding = operatorRows
                            .filter((d) => d.MODE === 4)
                            .reduce(
                              (sum, d) => sum + (d.duration_hours || 0),
                              0
                            );
                          const maintenance = operatorRows
                            .filter((d) => d.MODE === 5)
                            .reduce(
                              (sum, d) => sum + (d.duration_hours || 0),
                              0
                            );
                          const rework = operatorRows
                            .filter((d) => d.MODE === 6)
                            .reduce(
                              (sum, d) => sum + (d.duration_hours || 0),
                              0
                            );
                          const needleBreak = operatorRows
                            .filter((d) => d.MODE === 7)
                            .reduce(
                              (sum, d) => sum + (d.duration_hours || 0),
                              0
                            );
                          const productivePercent = (
                            (sewing / totalHours) *
                            100
                          ).toFixed(2);
                          const nonProductivePercent = (
                            ((idle +
                              meeting +
                              noFeeding +
                              maintenance +
                              rework +
                              needleBreak) /
                              totalHours) *
                            100
                          ).toFixed(2);
                          return (
                            <tr key={operatorId}>
                              <td>{operatorId}</td>
                              <td>{operatorName}</td>
                              <td>{formatHoursMinutes(totalHours)}</td>
                              <td>{formatHoursMinutes(sewing)}</td>
                              <td>{formatHoursMinutes(idle)}</td>
                              <td>{formatHoursMinutes(meeting)}</td>
                              <td>{formatHoursMinutes(noFeeding)}</td>
                              <td>{formatHoursMinutes(maintenance)}</td>
                              <td>{formatHoursMinutes(rework)}</td>
                              <td>{formatHoursMinutes(needleBreak)}</td>
                              <td>{productivePercent}%</td>
                              <td>{nonProductivePercent}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {summaryFilter === "line" && (
                <>
                  <h5 style={{ marginBottom: '20px' }}>Line Number Summary</h5>
                  <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
                    <table className="summary-table">
                      <thead>
                        <tr>
                          <th>Line Number</th>
                          <th>Total Hours</th>
                          <th>Sewing</th>
                          <th>Idle</th>
                          <th>Meeting</th>
                          <th>No Feeding</th>
                          <th>Maintenance</th>
                          <th>Rework</th>
                          <th>Needle Break</th>
                          <th>Productive %</th>
                          <th>Non-Productive %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...new Set(filteredData.filter(d => !d.isSummary).map(d => d.LINE_NUMB))].map(lineNum => {
                          const lineRows = filteredData.filter(d => d.LINE_NUMB === lineNum && !d.isSummary);
                          const totalHours = 10;
                          const sewing = lineRows.filter(d => d.MODE === 1).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                          const idle = lineRows.filter(d => d.MODE === 2).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                          const meeting = lineRows.filter(d => d.MODE === 3).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                          const noFeeding = lineRows.filter(d => d.MODE === 4).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                          const maintenance = lineRows.filter(d => d.MODE === 5).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                          const rework = lineRows.filter(d => d.MODE === 6).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                          const needleBreak = lineRows.filter(d => d.MODE === 7).reduce((sum, d) => sum + (d.duration_hours || 0), 0);
                          const productivePercent = ((sewing / totalHours) * 100).toFixed(2);
                          const nonProductivePercent = (((idle + meeting + noFeeding + maintenance + rework + needleBreak) / totalHours) * 100).toFixed(2);
                          return (
                            <tr key={lineNum}>
                              <td>{lineNum}</td>
                              <td>{formatHoursMinutes(totalHours)}</td>
                              <td>{formatHoursMinutes(sewing)}</td>
                              <td>{formatHoursMinutes(idle)}</td>
                              <td>{formatHoursMinutes(meeting)}</td>
                              <td>{formatHoursMinutes(noFeeding)}</td>
                              <td>{formatHoursMinutes(maintenance)}</td>
                              <td>{formatHoursMinutes(rework)}</td>
                              <td>{formatHoursMinutes(needleBreak)}</td>
                              <td>{productivePercent}%</td>
                              <td>{nonProductivePercent}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
  
            {/* --- END: Per-ID Single Line Summaries --- */}

            <div className="summary-tiles">
              <div className="tile production-percentage">
                <p>{calculateAggregatedMetrics().productiveTime.toFixed(2)}%</p>
                <span>Productive Time</span>
              </div>
              <div className="tile needle-runtime-percentage">
                <p>{calculateAggregatedMetrics().needleRuntimePercentage.toFixed(2)}%</p>
                <span>Needle Runtime %</span>
              </div>
              <div className="tile sewing-speed">
                <p>{calculateAggregatedMetrics().sewingSpeed.toFixed(0)}</p>
                <span>Sewing Speed</span>
              </div>
              <div className="tile total-hours">
                <p>{formatHoursMinutes(calculateAggregatedMetrics().totalHours)}</p>
                <span>Total Hours</span>
              </div>
            </div>

            <div className="summary-content" style={{ marginTop: "32px" }}>
              <div className="summary-chart">
                <Doughnut
                  data={{
                    labels: [
                      "Sewing Hours",
                      "Idle Hours",
                      "Meeting Hours",
                      "No Feeding Hours",
                      "Maintenance Hours",
                      "Rework Hours",
                      "Needle Break Hours",
                    ],
                    datasets: [
                      {
                        data: [
                          summaryData.sewingHours || 0,
                          summaryData.idleHours || 0,
                          summaryData.meetingHours || 0,
                          summaryData.noFeedingHours || 0,
                          summaryData.maintenanceHours || 0,
                          summaryData.reworkHours || 0,
                          summaryData.needleBreakHours || 0,
                        ],
                        backgroundColor: [
                          "#3E3561", // Sewing Hours
                          "#F8A723", // Idle Hours
                          "#E74C3C", // Meeting Hours
                          "#8E44AD", // No Feeding Hours
                          "#118374", // Maintenance Hours
                          "#FF6F61", // Rework Hours
                          "#00B8D9", // Needle Break Hours
                        ],
                        borderColor: [
                          "#3E3561",
                          "#F8A723",
                          "#E74C3C",
                          "#8E44AD",
                          "#118374",
                          "#FF6F61",
                          "#00B8D9",
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

              <div className="hour-breakdown">
                <div className="hour-box">
                  <span className="dot production"></span>
                  <p>
                    {formatHoursMinutes(summaryData.sewingHours)}: Sewing Hours
                  </p>
                </div>
                <div className="hour-box">
                  <span className="dot idle"></span>
                  <p>{formatHoursMinutes(summaryData.idleHours)}: Idle Hours</p>
                </div>
                <div className="hour-box">
                  <span className="dot meeting"></span>
                  <p>
                    {formatHoursMinutes(summaryData.meetingHours)}: Meeting
                    Hours
                  </p>
                </div>
                <div className="hour-box">
                  <span className="dot no-feeding"></span>
                  <p>
                    {formatHoursMinutes(summaryData.noFeedingHours)}: No Feeding
                    Hours
                  </p>
                </div>
                <div className="hour-box">
                  <span className="dot maintenance"></span>
                  <p>
                    {formatHoursMinutes(summaryData.maintenanceHours)}:
                    Maintenance Hours
                  </p>
                </div>
                <div className="hour-box">
                  <span className="dot rework"></span>
                  <p>
                    {formatHoursMinutes(summaryData.reworkHours)}: Rework Hours
                  </p>
                </div>
                <div className="hour-box">
                  <span className="dot needle-break"></span>
                  <p>
                    {formatHoursMinutes(summaryData.needleBreakHours)}: Needle
                    Break Hours
                  </p>
                </div>
               
              </div>

            </div>
          </div>
        )}



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
                <tbody>{renderTableBody()}</tbody>
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
      <style jsx>{`
        .dashboard-tiles {
          display: flex;
          gap: 20px;
          margin-bottom: 32px;
          margin-top: 32px;
          flex-wrap: wrap;
          justify-content: center;
        }
      .summary-tiles {
          display: flex;
          justify-content: flex-start;
          margin: 20px 0;
          gap: 20px;
          flex-wrap: wrap;
        }

        .tile {
          background-color: #fff;
          padding: 16px;
          border-radius: 5px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          text-align: center;
          width: 200px;
          transition: all 0.3s ease-in-out;
          cursor: default;
        }

        /* Hover Effects */
        .tile:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
        }

        /* Tile text styles */
        .tile p {
          font-size: 2rem;
          margin: 0;
          color: #333;
          font-weight: bold;
        }

        .tile span {
          display: block;
          margin-top: 10px;
          font-size: 1rem;
          color: #666;
        }

        /* Tile-specific styles to match AllLinesReport */
        .production-percentage {
          background-color: #e0f7fa;
          color: #006064;
        }

        .production-percentage:hover {
          background-color: #b2ebf2;
        }

        .production-percentage p {
          color: #006064;
        }

        .needle-runtime-percentage {
          background-color: #e3f2fd;
          color: #0277bd;
        }

        .needle-runtime-percentage:hover {
          background-color: #bbdefb;
        }

        .needle-runtime-percentage p {
          color: #0277bd;
        }

        .sewing-speed {
          background-color: #ffecb3;
          color: #ff6f00;
        }

        .sewing-speed:hover {
          background-color: #ffe082;
        }

        .sewing-speed p {
          color: #ff6f00;
        }

        .total-hours {
          background-color: #f3e5f5;
          color: #7b1fa2;
        }

        .total-hours:hover {
          background-color: #e1bee7;
        }

        .total-hours p {
          color: #7b1fa2;
        }

        /* Responsive design for tiles */
        @media (max-width: 768px) {
          .summary-tiles {
            flex-direction: column;
            align-items: center;
          }
          
          .tile {
            width: 100%;
            max-width: 300px;
          }
        }

        @media (max-width: 480px) {
          .tile {
            width: 100%;
            padding: 12px;
          }
          
          .tile p {
            font-size: 1.8rem;
          }
          
          .tile span {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </section>
  );
};

export default ConsolidatedReports;
