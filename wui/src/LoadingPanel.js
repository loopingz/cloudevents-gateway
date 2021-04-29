import React from "react";
import { CircularProgress } from "@material-ui/core";

export default function LoadingPanel() {
  return (
    <div style={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <CircularProgress />
    </div>
  );
}
