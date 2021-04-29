# cloudevents-gateway

This gateway will provide the Discovery and Subscription API for CloudEvents.
It will also proxy events so it can hub all the events from your vendors to your teams.

## Local development

### Requirements

```
# Install the shell
yarn add -g @webda/shell
# Install dependencies
yarn
```

You can launch the service locally with

```
webda debug
```

To launch the web ui

```
cd wui
yarn && yarn start
```

To launch some cat service

```
CAT_INTERVAL=5000 CAT_NAME=Felix webda serve -p 18081 -d FelixCatService
```

`CAT_INTERVAL` define the interval between cat actions
`CAT_NAME` define the name of the cat
