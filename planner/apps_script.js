/**
 * Google Apps Script for bytapex Career Planner Backend
 * 
 * INSTRUCTIONS:
 * 1. Create a new Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Paste this code into Code.gs.
 * 4. Run the 'setup' function once to create headers.
 * 5. Click 'Deploy' > 'New deployment'.
 * 6. Select 'Web app'.
 * 7. Set 'Who has access' to 'Anyone'.
 * 8. Copy the Web App URL and paste it into planner.js (CONST API_URL).
 */

const SHEET_NAME = 'Users';

function doGet(e) {
    const email = e.parameter.email;
    if (!email) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No email provided' })).setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = getSheet();

    // Faster lookup using TextFinder instead of loading all values
    const textFinder = sheet.getRange("A:A").createTextFinder(email).matchEntireCell(true);
    const match = textFinder.findNext();

    if (match) {
        const rowIndex = match.getRow();
        const userData = sheet.getRange(rowIndex, 2).getValue();
        return ContentService.createTextOutput(JSON.stringify({
            status: 'success',
            payload: JSON.parse(userData)
        })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'not_found' })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    try {
        const requestData = JSON.parse(e.postData.contents);
        const email = requestData.email;
        const userData = JSON.stringify(requestData.data);

        const sheet = getSheet();

        // Fast lookup using TextFinder
        const textFinder = sheet.getRange("A:A").createTextFinder(email).matchEntireCell(true);
        const match = textFinder.findNext();
        const rowIndex = match ? match.getRow() : -1;

        if (rowIndex === -1) {
            // Create new
            sheet.appendRow([email, userData, new Date()]);
        } else {
            // Update existing
            sheet.getRange(rowIndex, 2).setValue(userData);
            sheet.getRange(rowIndex, 3).setValue(new Date());
        }

        return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
    }
}

function getSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        // Add Headers
        sheet.appendRow(['Email', 'Data_JSON', 'Last_Updated']);
    }
    return sheet;
}

function setup() {
    getSheet();
}
