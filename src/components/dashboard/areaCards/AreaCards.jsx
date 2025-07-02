import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const AreaCards = () => {
  const [lineNumberCount, setLineNumberCount] = useState(0);
  const [machineCount, setMachineCount] = useState(0);
  const [efficiencyMetrics, setEfficiencyMetrics] = useState([]);
  const [operatorEfficiency, setOperatorEfficiency] = useState([]);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const fetchData = async (url, setter) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch data");

        const data = await response.json();
        setter(data);
      } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
      }
    };

    fetchData("http://localhost:8000/api/line_count/", (data) =>
      setLineNumberCount(data.line_number_count || 0)
    );
    fetchData("http://localhost:8000/api/machine_count/", (data) =>
      setMachineCount(data.machine_id_count || 0)
    );

    fetchData("http://localhost:8000/api/calculate_efficiency/", (data) => {
      const formattedData = Object.keys(data).map((key) => ({
        line: key,
        efficiency: parseFloat(data[key].Efficiency),
      }));
      setEfficiencyMetrics(formattedData);
    });

    fetchData(
      "http://localhost:8000/api/calculate_operator_efficiency/",
      (data) => {
        // Group efficiency by operator (sum efficiency of duplicates)
        const groupedData = data.reduce((acc, item) => {
          acc[item.operator] = (acc[item.operator] || 0) + item.efficiency;
          return acc;
        }, {});

        const formattedData = Object.entries(groupedData).map(
          ([operator, efficiency]) => ({
            operator,
            efficiency,
          })
        );

        setOperatorEfficiency(formattedData);
      }
    );

    const interval = setInterval(() => {
      fetchData("http://localhost:8000/api/line_count/", (data) =>
        setLineNumberCount(data.line_number_count || 0)
      );
      fetchData("http://localhost:8000/api/machine_count/", (data) =>
        setMachineCount(data.machine_id_count || 0)
      );

      fetchData("http://localhost:8000/api/calculate_efficiency/", (data) => {
        const formattedData = Object.keys(data).map((key) => ({
          line: key,
          efficiency: parseFloat(data[key].Efficiency),
        }));
        setEfficiencyMetrics(formattedData);
      });

      fetchData(
        "http://localhost:8000/api/calculate_operator_efficiency/",
        (data) => {
          const groupedData = data.reduce((acc, item) => {
            acc[item.operator] = (acc[item.operator] || 0) + item.efficiency;
            return acc;
          }, {});

          const formattedData = Object.entries(groupedData).map(
            ([operator, efficiency]) => ({
              operator,
              efficiency,
            })
          );

          setOperatorEfficiency(formattedData);
        }
      );
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const machineData = [
    {
      title: "Line Number Count",
      count: lineNumberCount,
      colors: ["#e4e8ef", "#42f554"],
    },
    {
      title: "Machine Count",
      count: machineCount,
      colors: ["#e4e8ef", "#4287f5"],
    },
  ];

  return (
    <section
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "20px",
        justifyContent: "center",
      }}
    >
      {machineData.map((machine, index) => (
        <div
          key={index}
          style={{
            background: `linear-gradient(135deg, ${machine.colors[0]}, ${machine.colors[1]})`,
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            padding: "20px",
            textAlign: "center",
            width: "100%",
            maxWidth: "300px",
            transition: "transform 0.3s ease",
          }}
        >
          <h4>{machine.title}</h4>
          <p>Count: {machine.count}</p>
        </div>
      ))}

      <div
        style={{
          display: "flex",
          flexDirection: screenWidth < 768 ? "column" : "row",
          gap: "20px",
          width: "100%",
          maxWidth: "1200px",
          margin: "20px 0",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h3>Line Efficiency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={efficiencyMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="line" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="efficiency" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h3>Operator Efficiency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={operatorEfficiency}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="operator" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="efficiency" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};

export default AreaCards;
