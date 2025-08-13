// === Config ===
const url = "http://10.8.0.101:8005/";
const noteId = "1b0af8e8299449ababc92bc11929e99d"; // Replace with your note's ID

// === Setup ===
const noteUrl = url + '/' + noteId + '.md';
let req = new Request(noteUrl);
let noteBody = await req.loadString();
let response = req.response;

const updatedTimeRegExp = /^updated_time: /g;
const endOfContentRegExp = /^id: /g;

let lines = noteBody.split('\n');
let updatedTimeLineIndex = -1;
let endOfContent = -1;

for (let i = lines.length - 1; i >= 0; i--) {
  if (updatedTimeLineIndex === -1 && lines[i].match(updatedTimeRegExp)) {
    updatedTimeLineIndex = i + 1;
  }
  if (endOfContent === -1 && lines[i].match(endOfContentRegExp)) {
    endOfContent = i - 2;
  }
  if (updatedTimeLineIndex !== -1 && endOfContent !== -1) break;
}

// === Ask for inputs ===
let bpInput = new Alert();
bpInput.title = 'Blood Pressure';
bpInput.message = 'Enter systolic, diastolic, pulse. Others are optional.';
bpInput.addTextField('Systolic (e.g. 120)');
bpInput.addTextField('Diastolic (e.g. 80)');
bpInput.addTextField('Pulse (e.g. 70)');
bpInput.addTextField('Weight (kg)');
bpInput.addTextField('Waist (cm)');
bpInput.addTextField('Position (e.g. Sitting)');
bpInput.addTextField('Arm (e.g. Left)');
bpInput.addTextField('Note');
bpInput.addAction('Save');
bpInput.addCancelAction('Cancel');

let choice = await bpInput.presentAlert();
if (choice !== 0) throw new Error("User cancelled");

// === Parse inputs ===
function clean(value) {
  return value.trim().replace(/\|/g, ''); // Remove pipe characters to not break the table
}

let systolic = parseInt(bpInput.textFieldValue(0));
let diastolic = parseInt(bpInput.textFieldValue(1));
let pulse = parseInt(bpInput.textFieldValue(2));
let weight = clean(bpInput.textFieldValue(3));
let waist = clean(bpInput.textFieldValue(4));
let position = clean(bpInput.textFieldValue(5));
let arm = clean(bpInput.textFieldValue(6));
let note = clean(bpInput.textFieldValue(7));

if (isNaN(systolic) || isNaN(diastolic)) {
  throw new Error("Systolic and diastolic values must be numbers.");
}

// === Format new entry ===
let now = new Date();
let yyyy = now.getFullYear();
let mm = String(now.getMonth() + 1).padStart(2, '0');
let dd = String(now.getDate()).padStart(2, '0');
let hh = String(now.getHours()).padStart(2, '0');
let min = String(now.getMinutes()).padStart(2, '0');
let timestamp = `${yyyy}-${mm}-${dd} ${hh}:${min}`;

let newLine = `|${timestamp}|${systolic}|${diastolic}|${pulse || ''}|${weight}|${waist}|${note}|${position}|${arm}|`;

// === Insert the new line ===
let endOfTable = endOfContent - 1;
lines.splice(endOfTable + 2, 0, newLine);

// === Update metadata ===
let updatedTimeLine = "updated_time: " + now.toISOString();
if (updatedTimeLineIndex !== -1) {
  lines[updatedTimeLineIndex] = updatedTimeLine;
} else {
  lines.push(updatedTimeLine);
}

while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
noteBody = lines.join('\n');

// === Write the updated file back ===
let putReq = new Request(noteUrl);
putReq.method = 'PUT';
putReq.body = noteBody;
let content = await putReq.load();

let done = new Alert();
done.title = "Saved!";
done.message = `Logged ${systolic}/${diastolic}.`;
done.addAction("Great");
await done.present();