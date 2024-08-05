const url = "http://10.8.0.101:8005/";
const noteId = "1b0af8e8299449ababc92bc11929e99d"
const endOfContentRegExp = /^id: /g

// Read the existing table
var req = new Request(url + '/' + noteId + '.md');
let noteBody;
noteBody = await req.loadString();
let response = req.response;
// console.log(response)/
// console.log(noteBody)

let endOfContent;
// Insert the new data
var lines = noteBody.split('\n');
for(var i = lines.length - 1;i > 0;i--){
  if(lines[i].match(endOfContentRegExp)){
  	endOfContent = i - 1;
    break;
  }
}
console.log(endOfContent)

// Present the basic data collection Alert
bpInput = new Alert();
bpInput.title = 'Record Blood Pressure'
bpInput.message = 'Enter diastolic and systolic BP. Weight & HR are optional.'
var diastolicField = bpInput.addTextField('Diastolic')
diastolicField.setNumberPadKeyboard()
var systolicField = bpInput.addTextField('Systolic')
systolicField.setNumberPadKeyboard()
var heartRateField = bpInput.addTextField('HR')
heartRateField.setNumberPadKeyboard()
var weightField = bpInput.addTextField('Weight')
weightField.setDecimalPadKeyboard()
bpInput.addAction('Save')
bpInput.addCancelAction('Cancel')
await bpInput.present()

// Get year, month and day
var today = new Date();
var dd = String(today.getDate()).padStart(2, '0');
var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
var yyyy = today.getFullYear();

// Get the values
diastolic = bpInput.textFieldValue(0)
systolic = bpInput.textFieldValue(1)
hr = bpInput.textFieldValue(2)
weight = bpInput.textFieldValue(3)

// TODO: Check the values

var newLine = '|' + yyyy + '-' + mm + '-' + dd + '|' + diastolic + '|' + systolic + '|' + hr + '|' + weight + '|||Sitting||'
lines.splice(endOfContent, 0, newLine)
console.log(lines.join('\n'))
noteBody = lines.join('\n')

// Header & Format for the Markdown Table
// |Date|Systolic|Diastolic|Pulse|Weight|Waist (cm)|Note|Position|Arm|
// |2024-07-13|100|72|78||||Sitting||

// Write the new table
var req = new Request(url + '/' + noteId + '.md');
req.method = 'PUT'
req.body = noteBody
let content;
content = await req.load()
response = req.response;
console.log(response)

