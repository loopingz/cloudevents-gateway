import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
// Import our controller and Redux
import { Controller } from "redux-lz-controller";
import * as ReduxThunk from "redux-thunk";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import * as Redux from "redux";
import { Provider } from "react-redux";
//

// Initialization of all our app controllers
import CloudEventController from "./Controller";
new CloudEventController();

if (window.location.origin === "http://localhost:3000") {
  CloudEventController.setEndpoint("http://localhost:18080");
} else {
  CloudEventController.setEndpoint(window.location.origin);
}
//

const persistConfig = {
  key: "root",
  storage: storage,
  blacklist: ["notifications"]
};

// Retrieve our global reducers
let rootReducer = Controller.getReducers();
//
rootReducer = persistReducer(persistConfig, rootReducer);
let composed;
window.__MUI_USE_NEXT_TYPOGRAPHY_VARIANTS__ = true;
if (window.__REDUX_DEVTOOLS_EXTENSION__) {
  composed = Redux.compose(
    Redux.applyMiddleware(ReduxThunk.default),
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  );
} else {
  composed = Redux.compose(Redux.applyMiddleware(ReduxThunk.default));
}
let store = Redux.createStore(rootReducer, composed);
// Add store to controller
Controller.setStore(store);

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
