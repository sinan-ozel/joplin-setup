const url = "http://10.8.0.101:8005/";
const noteId = "bb9884492f0443f2adce400bd263254f"
const endOfContentRegExp = /^id: /g
const updatedTimeRegExp = /^updated_time: /g

// Read the existing table
var req = new Request(url + '/' + noteId + '.md');
let noteBody;
noteBody = await req.loadString();
let response = req.response;

// Parse the file
let endOfContent;
let updatedTimeLineIndex;
var lines = noteBody.split('\n');
for(var i = lines.length - 1;i > 0;i--){
  if(lines[i].match(endOfContentRegExp)){
  	endOfContent = i - 1;
    break;
  }
}
for(var i = lines.length - 1;i > 0;i--){
  if(lines[i].match(updatedTimeRegExp)){
  	updatedTimeLineIndex = i;
    break;
  }
}


// TODO: Read the Cumulative if it exists.
var lastLine = lines[endOfContent - 1]
var fields = lastLine.split('|')
var cumSumAtStart = parseFloat(fields[3])
var dtS = fields[1]
var dtParts = dtS.split('-')
var previousRecordDate = new Date(parseInt(dtParts[0]), parseInt(dtParts[1]-1), 
parseInt(dtParts[2]));

var firstDay = new Date(2000, 1, 1)

// Get year, month and day
var today = new Date();
var dd = String(today.getDate()).padStart(2, '0');
var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
var yyyy = today.getFullYear();

if(previousRecordDate > today){
  throw new Error("The previous date seems to be in the future: " + previousRecordDate + ". String: " + dtS + " Please fix manually.");
}

// Did we move forward a week?
var previousRecordWeek = Math.floor((previousRecordDate - firstDay)/ 604800000);
var currentWeek = Math.floor((today - firstDay)/ 604800000);

// Present the basic data collection Alert
amountInput = new Alert();
amountInput.title = 'Spend'
amountInput.message = 'You are at: ' + cumSumAtStart.toFixed(2)
var moneyField = amountInput.addTextField('Amount')
moneyField.setNumberPadKeyboard()
// TODO: Add categorical label field
amountInput.addAction('Save')
amountInput.addCancelAction('Cancel')
await amountInput.present()

// Get the values
spentAmount = parseFloat(amountInput.textFieldValue(0))
if(isNaN(spentAmount)){
  throw new Error("The amount is NaN. Stopping execution to avoid data corruption.");
}
cumSumAtEnd = cumSumAtStart - (currentWeek - previousRecordWeek) * 100 + spentAmount;
if(isNaN(cumSumAtEnd)){
  throw new Error("Cumulative sum is NaN. Stopping execution to avoid data corruption.");
}

// Update the metadata
var updatedTimeLine = "updated_time: " + today.toISOString()
lines[updatedTimeLineIndex] = updatedTimeLine
// TODO: Update the app name in note metadata

// Format the values
// |-|-:|-:|-:|-|
// |Date|Amount|Cumulative|Label|Notes|
var newLine = '|' + yyyy + '-' + mm + '-' + dd + '|' + spentAmount + '|' + cumSumAtEnd + '| | |'
lines.splice(endOfContent, 0, newLine)
noteBody = lines.join('\n')

// Write the new table
var req = new Request(url + '/' + noteId + '.md');
req.method = 'PUT'
req.body = noteBody
let content;
content = await req.load()
response = req.response;

