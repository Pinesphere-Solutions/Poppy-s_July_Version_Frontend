const response = await fetch("http://pinesphere.pinesphere.co.in/api/user_login/", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(values),
});

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://oceanatlantic.pinesphere.co.in',
      changeOrigin: true,
      secure: false,
      withCredentials: true,
      onProxyRes: function(proxyRes, req, res) {
        // Add the Access-Control-Allow-Credentials header if it's missing
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      }
    })
  );
};