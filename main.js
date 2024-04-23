// Import dependencies
const { app, BrowserWindow } = require('electron');
const express = require('express');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
const schedule = require('node-schedule'); // Importing node-schedule

let mainWindow;

// Set up the Electron application
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

// Set up the Express server within Electron
const expressApp = express();
const port = 3000; // The port where the Express server will listen

expressApp.use(bodyParser.text({ type: 'text/xml' }));

const parser = new xml2js.Parser();

// Define the endpoint for QuickBooks Web Connector
expressApp.post('/quickbooks', (req, res) => {
  parser.parseString(req.body, (err, result) => {
    if (err) {
      res.status(500).send('Error parsing XML');
      return;
    }

    // Process the request to handle the Web Connector handshake
    const qbXML = `
      <?xml version="1.0" ?>
      <?qbxml version="13.0" ?>
      <QBXML>
        <QBXMLMsgsRq>
          <HostQueryRq>
          </HostQueryRq>
        </QBXMLMsgsRq>
      </QBXML>
    `;

    res.send(qbXML);
});

// Define an endpoint for a handshake request
expressApp.post('/handshake', (req, res) => {
  // Handle initial handshake or authentication request
  const handshakeResponse = `
    <?xml version="1.0" ?>
    <?qbxml version="13.0" ?>
    <QBXML>
      <QBXMLMsgsRs>
        <HostQueryRs statusCode="0" statusSeverity="Info" statusMessage="Ready">
        </HostQueryRs>
      </QBXML>
    `;
  res.send(handshakeResponse);
});

// Schedule a task to pull a report every day at a specific time
schedule.scheduleJob('0 9 * * *', () => { // This example runs every day at 9 AM
  console.log("Scheduled task to pull a QuickBooks report.");

  const qbXML = `
    <?xml version="1.0" ?>
    <?qbxml version="13.0" ?>
    <QBXML>
      <QBXMLMsgsRq>
        <GeneralSummaryReportQueryRq requestID="1">
          <GeneralSummaryReportType>BalanceSheet</GeneralSummaryReportType>
        </GeneralSummaryReportQueryRq>
      </QBXMLMsgsRq>
    </QBXML>
  `;

  // Normally, you'd send this request to QuickBooks
  console.log("Sending scheduled report request to QuickBooks.");
});

// Start the Express server within the Electron application
expressApp.listen(port, () => {
  console.log(`Express server running on port ${port}`);
});
});
