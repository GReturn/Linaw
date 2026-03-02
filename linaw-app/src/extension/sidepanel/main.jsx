import React from "react"
import ReactDOM from "react-dom/client"
import App from "../../extension/sidepanel/SidePanel.jsx"
import { AuthProvider } from "../../context/AuthContext"
import "../../index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <App />
  </AuthProvider>
)