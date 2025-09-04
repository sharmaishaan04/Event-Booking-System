import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { Toaster } from "react-hot-toast";
import { ParallaxProvider } from "react-scroll-parallax";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ParallaxProvider>
    <App />
    <Toaster position="top-right" />
  </ParallaxProvider>
);
