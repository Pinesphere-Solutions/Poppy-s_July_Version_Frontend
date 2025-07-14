





import { useContext, useEffect } from "react";
import "./App.scss";
import { ThemeContext } from "./context/ThemeContext";
import { DARK_THEME, LIGHT_THEME } from "./constants/themeConstants";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MoonIcon from "./assets/icons/moon.svg";
import SunIcon from "./assets/icons/sun.svg";
import BaseLayout from "./layout/BaseLayout";
import { Dashboard, PageNotFound, Reports, Login } from "./screens";
import Cookies from "js-cookie";
import Operatoroverall from "./components/dashboard/areaTable/Operatoroverall";
import Lineoverall from "./components/dashboard/areaTable/Lineoverall";
import OperatorReport from "./components/Operator_Report/OperatorReport";
import LineReport from "./components/Line_Report/LineReport";
import MachineReport from "./components/Operator_Report/MachineReport";
import AReport from "./components/dashboard/areaTable/AReport";
import ConsolidatedReports from "./components/dashboard/areaTable/ConsolidatedReports";
import OverallMachineA from "./components/AFL/Machine/OverallMachineA";
import OperatoroverallA from "./components/AFL/Machine/OperatoroverallA";
// import LineOverallA from "./components/AFL/Machine/LineOverallA";

const ProtectedRoute = ({ component: Component, allowedRoles = ['admin', 'user'] }) => {
  const hasToken = Cookies.get('jwt');
  const userRole = Cookies.get('user_role');
  
  if (!hasToken) {
    return <Navigate to='/' />;
  }
  
  if (!allowedRoles.includes(userRole)) {
    if (userRole === 'user') {
      return <Navigate to='/AReport' />;
    }
    return <Navigate to='/dashboard' />;
  }
  
  return <Component />;
};

const LoginRedirect = ({ component: Component }) => (
  Cookies.get('jwt') ? <Navigate to={Cookies.get('user_role') === 'user' ? '/AReport' : '/dashboard'} /> : <Component />
);

function App() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  useEffect(() => {
    if (theme === DARK_THEME) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [theme]);

  return (
    <>
      <Router>
        <Routes>
          <Route element={<BaseLayout />}>
            <Route path="/dashboard" element={<ProtectedRoute component={Dashboard} allowedRoles={['admin']} />} />
            <Route path="/reports" element={<ProtectedRoute component={Reports} allowedRoles={['admin']} />} />
            <Route path="/machine-report" element={<ProtectedRoute component={OverallMachineA} allowedRoles={['admin', 'user']} />} />
            <Route path="/op" element={<ProtectedRoute component={Operatoroverall} allowedRoles={['admin']} />} />
            <Route path="/operatorA" element={<ProtectedRoute component={OperatoroverallA} allowedRoles={['admin', 'user']} />} />
            <Route path="/lineoverall" element={<ProtectedRoute component={Lineoverall} allowedRoles={['admin']} />} />
            {/* <Route path="/LineOverallA" element={<ProtectedRoute component={LineOverallA} allowedRoles={['admin', 'user']} />} /> */}
            <Route path="/ConsolidatedReports" element={<ProtectedRoute component={ConsolidatedReports} allowedRoles={['admin']} />} />
            <Route path="/AReport" element={<ProtectedRoute component={AReport} allowedRoles={['admin', 'user']} />} />
          </Route>

          <Route path="/operator/:operator_name" element={<ProtectedRoute component={OperatorReport} allowedRoles={['admin']} />} />
          <Route path="/machine/:machine_id" element={<ProtectedRoute component={MachineReport} allowedRoles={['admin']} />} />
          <Route path="/line-reports/:lineNumber" element={<ProtectedRoute component={LineReport} allowedRoles={['admin']} />} />

          <Route path="/" element={<LoginRedirect component={Login} />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>

        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
        >
          <img
            className="theme-icon"
            src={theme === LIGHT_THEME ? SunIcon : MoonIcon}
          />
        </button>
        <footer className="login-footer">
          <p>@ <a href="https://pinesphere.com/">Pinesphere</a>. All rights reserved.</p>
        </footer>
      </Router>
    </>
  );
}

export default App;














// import { useContext, useEffect } from "react";
// import "./App.scss";
// import { ThemeContext } from "./context/ThemeContext";
// import { DARK_THEME, LIGHT_THEME } from "./constants/themeConstants";
// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import MoonIcon from "./assets/icons/moon.svg";
// import SunIcon from "./assets/icons/sun.svg";
// import BaseLayout from "./layout/BaseLayout";
// import { Dashboard, PageNotFound, Reports, Login } from "./screens";
// import Cookies from "js-cookie";
// import Operatoroverall from "./components/dashboard/areaTable/Operatoroverall";
// import Lineoverall from "./components/dashboard/areaTable/Lineoverall";
// import OperatorReport from "./components/Operator_Report/OperatorReport";
// import LineReport from "./components/Line_Report/LineReport";
// import MachineReport from "./components/Operator_Report/MachineReport";
// import AReport from "./components/dashboard/areaTable/AReport";
// import ConsolidatedReports from "./components/dashboard/areaTable/ConsolidatedReports";

// const ProtectedRoute = ({ component: Component, allowedRoles = ['admin', 'user'] }) => {
//   const hasToken = Cookies.get('jwt');
//   const userRole = Cookies.get('user_role');
  
//   if (!hasToken) {
//     return <Navigate to='/' />;
//   }
  
//   if (!allowedRoles.includes(userRole)) {
//     if (userRole === 'user') {
//       return <Navigate to='/AReport' />;
//     }
//     return <Navigate to='/dashboard' />;
//   }
  
//   return <Component />;
// };

// const LoginRedirect = ({ component: Component }) => (
//   Cookies.get('jwt') ? <Navigate to={Cookies.get('user_role') === 'user' ? '/AReport' : '/dashboard'} /> : <Component />
// );

// function App() {
//   const { theme, toggleTheme } = useContext(ThemeContext);

//   useEffect(() => {
//     if (theme === DARK_THEME) {
//       document.body.classList.add("dark-mode");
//     } else {
//       document.body.classList.remove("dark-mode");
//     }
//   }, [theme]);

//   return (
//     <>
//       <Router>
//         <Routes>
//           <Route element={<BaseLayout />}>
//             <Route path="/dashboard" element={<ProtectedRoute component={Dashboard} allowedRoles={['admin']} />} />
//             <Route path="/reports" element={<ProtectedRoute component={Reports} allowedRoles={['admin']} />} />
//             <Route path="/op" element={<ProtectedRoute component={Operatoroverall} allowedRoles={['admin']} />} />
//             <Route path="/lineoverall" element={<ProtectedRoute component={Lineoverall} allowedRoles={['admin']} />} />
//             <Route path="/ConsolidatedReports" element={<ProtectedRoute component={ConsolidatedReports} allowedRoles={['admin']} />} />
//             <Route path="/AReport" element={<ProtectedRoute component={AReport} allowedRoles={['admin', 'user']} />} />
//           </Route>

//           <Route path="/operator/:operator_name" element={<ProtectedRoute component={OperatorReport} allowedRoles={['admin']} />} />
//           <Route path="/machine/:machine_id" element={<ProtectedRoute component={MachineReport} allowedRoles={['admin']} />} />
//           <Route path="/line-reports/:lineNumber" element={<ProtectedRoute component={LineReport} allowedRoles={['admin']} />} />

//           <Route path="/" element={<LoginRedirect component={Login} />} />
//           <Route path="*" element={<PageNotFound />} />
//         </Routes>

//         <button
//           type="button"
//           className="theme-toggle-btn"
//           onClick={toggleTheme}
//         >
//           <img
//             className="theme-icon"
//             src={theme === LIGHT_THEME ? SunIcon : MoonIcon}
//           />
//         </button>
//         <footer className="login-footer">
//           <p>@ <a href="https://pinesphere.com/">Pinesphere</a>. All rights reserved.</p>
//         </footer>
//       </Router>
//     </>
//   );
// }

// export default App;