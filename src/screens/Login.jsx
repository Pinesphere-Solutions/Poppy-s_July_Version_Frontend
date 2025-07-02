import React, { useState } from "react";
import { Button, Form, Input } from "antd";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import "./Login.css";

const Login = () => {
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      toast.loading("Logging in...", {
        position: "top-right",
        toastId: "loginProgress",
      });

      // Check for admin credentials
      if (values.username === "admin" && values.password === "admin") {
        Cookies.set("jwt", "admin-token");
        Cookies.set("user_role", "admin");

        toast.dismiss("loginProgress");
        toast.success("Admin login successful! Redirecting...", {
          position: "top-right",
          autoClose: 2000,
        });

        setTimeout(() => navigate("/dashboard"), 2000);
        return;
      }

      // Check for user credentials
      if (values.username === "User" && values.password === "user@123") {
        Cookies.set("jwt", "user-token");
        Cookies.set("user_role", "user");

        toast.dismiss("loginProgress");
        toast.success("User login successful! Redirecting...", {
          position: "top-right",
          autoClose: 2000,
        });

        setTimeout(() => navigate("/AReport"), 2000);
        return;
      }

      // API login for other users
      const response = await fetch("http://localhost:8000/api/user_login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Authentication failed");

      const data = await response.json();
      Cookies.set("jwt", data.token);
      Cookies.set("user_role", data.role || "admin"); // Default to admin if role not specified

      toast.dismiss("loginProgress");
      toast.success("Login successful! Redirecting...", {
        position: "top-right",
        autoClose: 2000,
      });

      setTimeout(
        () =>
          navigate(
            Cookies.get("user_role") === "user" ? "/AReport" : "/dashboard"
          ),
        2000
      );
    } catch (error) {
      console.error("Error during login:", error.message);
      toast.dismiss("loginProgress");
      toast.error("Incorrect username or password", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
    toast.warn("Please fill in all required fields correctly", {
      position: "top-right",
      autoClose: 5000,
    });
  };

  return (
    <>
      <div className="login-container">
        <div className="login-form">
          <Form
            name="basic"
            layout="vertical"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
          >
            <Form.Item
              label="Username"
              name="username"
              rules={[
                { required: true, message: "Please input your username!" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Please input your password!" },
              ]}
            >
              <Input.Password />
            </Form.Item>

            {error && <p className="error-message">{error}</p>}

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Log In
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
      <footer className="login-footer">
        <p>
          @ <a href="https://pinesphere.com/">Pinesphere</a>. All rights
          reserved.
        </p>
      </footer>
      <ToastContainer />
    </>
  );
};

export default Login;
