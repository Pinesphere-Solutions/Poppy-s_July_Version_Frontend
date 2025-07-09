import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OperatorStyles.css";
import { FaUserCog } from "react-icons/fa";

const OperatorDashboard = () => {
  const [operators, setOperators] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8000/api/operator_summary/")
      .then((response) => response.json())
      .then((data) => setOperators(data))
      .catch((error) => console.error("Error fetching operators:", error));
  }, []);

  return (
    <div className="operator-dashboard">
      {operators.map((operator, index) => (
        <div
          key={index}
          className="operator-card"
          onClick={() => navigate(`/operator/${operator.OPERATOR_ID}`)}
        >
          <FaUserCog className="operator-icon" />
          <h3 className="operator-id">Operator {operator.OPERATOR_ID}</h3>
          <p className="sewing-hours">
            Sewing Hours: {operator.sewing_hours.toFixed(2)} hrs
          </p>
        </div>
      ))}
    </div>
  );
};

export default OperatorDashboard;
