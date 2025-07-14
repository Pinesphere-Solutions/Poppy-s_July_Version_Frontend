import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LineStyles.css";
import { FaUserCog } from "react-icons/fa";

const LineDashboard = () => {
  const [lineSummary, setLineSummary] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("https://oceanatlantic.pinesphere.co.in/api/line_summary/")
      .then((response) => response.json())
      .then((data) => setLineSummary(data))
      .catch((error) => console.error("Error fetching line summary:", error));
  }, []);

  return (
    <div className="operator-dashboard">
      {lineSummary.map((line, index) => (
        <div
          key={index}
          className="operator-card"
          onClick={() => navigate(`/line-reports/${line.LINE_NUMB}`)}
        >
          <FaUserCog className="operator-icon" />
          <h3 className="operator-id">Line Number: {line.LINE_NUMB}</h3>
          <p className="sewing-hours">
            Sewing Hours:{" "}
            {line.sewing_hours ? line.sewing_hours.toFixed(2) : "0.00"} hrs
          </p>
        </div>
      ))}
    </div>
  );
};

export default LineDashboard;
