import App from "../components/app";
import { Provider } from "react-redux";
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter as Router } from "react-router-dom"; // 引入 useNavigate 钩子
import store from "@src/store";
import "@src/components/svg-icon/svg-icons";
import openRendererListenEvents from "./listen";
const rootElement = document.getElementById("root") as HTMLElement;
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <Router>
        <App />
      </Router>
    </Provider>
  </React.StrictMode>,
);
openRendererListenEvents();
