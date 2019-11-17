# Jauntdetour Backend

The backend of Jauntdetour is built as an express app. It interfaces with the Google Routes API and Google Places API and does the heavy lifting with data processing.

## Running

Run `index.js` using node.

```
cd /<backend-root>
node index.js
```

## Structure

### Express App

The main express app is located in `/<backend-root>/index.js`

### Modules

Node modules used by the express app are located in `/<backend-root>/app/modules`

#### PlacesAPI
PlacesAPI interfaces with the Google Places API

#### RouteAPI
RouteAPI interfaces with the Google Route API