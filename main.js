// Import dependencies
const { app, BrowserWindow } = require('electron');
const express = require('express');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
const schedule = require('node-schedule'); // Importing node-schedule
const mysql = require('mysql2-promise'); // For MySQL connections
const fs = require('fs');
const XLSX = require('xlsx');

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

// MySQL connection settings
const dbConfig = {
  host: 'your-database-host', // e.g., 'localhost' or a specific host
  user: 'your-database-user',
  password: 'your-database-password',
  database: 'your-database-name'
};

// Function to fetch data from the database
async function fetchLatestData() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM your_table_name ORDER BY timestamp DESC LIMIT 1'); // Query to get the latest data
    await connection.end();
    return rows[0]; // Return the latest data
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

// Function to read an Excel sheet
function readExcelData(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Get the first sheet
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    return sheet; // Return data as an array of objects
  }

  // Function to fetch data from the MySQL database
async function fetchDataFromDatabase(query, dbConfig) {
    try {
      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.execute(query); // Execute SQL query
      await connection.end(); // Close connection
      return rows; // Return data
    } catch (error) {
      console.error('Error fetching data from MySQL:', error);
      throw error; // Re-throw error if needed
    }
  }

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
      </QBXML
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
      </QBXML
    `;
  res.send(handshakeResponse);
});

// Schedule a task to fetch the latest data from the database every day at a specific time
schedule.scheduleJob('0 8 * * *', async () => { // This example runs every day at 8 AM
  console.log("Scheduled task to fetch the latest data from the database.");

  const latestData = await fetchLatestData(); // Fetch the latest data
  if (latestData) {
    console.log("Latest data from the database:", latestData);
  } else {
    console.error("Could not fetch the latest data from the database.");
  }
});

// Start the Express server within the Electron application
expressApp.listen(port, () => {
  console.log(`Express server running on port ${port}`);
});

const excelFilePath = 'path/to/excel-file.xlsx'; // Path to your Excel file
  const query = 'SELECT * FROM your_table_name'; // SQL query to fetch data from MySQL

  const areSame =  compareExcelWithDatabase(excelFilePath, query, dbConfig); // Compare data

  console.log('Data match:', areSame); // Output whether the data matches or not
})();

// Function to compare data from Excel and MySQL
async function compareExcelWithDatabase(excelFilePath, query, dbConfig) {
    const excelData = readExcelData(excelFilePath); // Read data from Excel
    const dbData = await fetchDataFromDatabase(query, dbConfig); // Fetch data from MySQL
  
    // Here, you might need to define how to compare the two datasets
    // For simplicity, let's compare the JSON representation
    const excelJSON = JSON.stringify(excelData);
    const dbJSON = JSON.stringify(dbData);
  
    return excelJSON === dbJSON; // Return true if data matches, false otherwise
  }