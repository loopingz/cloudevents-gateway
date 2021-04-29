import React from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { Add } from "@material-ui/icons";
import IconButton from "@material-ui/core/IconButton";
import { Controller } from "redux-lz-controller";
import { CircularProgress } from "@material-ui/core";

export default function NewServiceDialog() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [load, setLoad] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAdd = () => {
    setLoad(true);
    Controller.get("cloudevents").addService(name, url, () => {
      setLoad(false);
      setOpen(false);
    });
  };

  return (
    <div>
      <IconButton variant="outlined" color="secondary" onClick={handleClickOpen}>
        <Add />
      </IconButton>
      <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Add new service</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To explore a new service using the DiscoveryService and add the ability to either Subscribe to it or connect
            it to the Gateway.
          </DialogContentText>
          <DialogContentText>It will call [serviceUrl]/services to discover service</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Service name"
            type="text"
            fullWidth
            onChange={e => setName(e.target.value)}
            value={name}
          />
          <TextField
            margin="dense"
            id="url"
            label="Service url"
            type="text"
            fullWidth
            onChange={e => setUrl(e.target.value)}
            value={url}
          />
        </DialogContent>
        <DialogActions>
          {load ? <CircularProgress /> : null}
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAdd} color="primary" disabled={name === "" || url === "" || load}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
