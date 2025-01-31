
// popup.js

document.getElementById('removeRowsButton').addEventListener('click', () => {
  // Send a message to the content script to remove rows
  console.log("Test123")
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'removeRows'}, (response) => {
      console.log(response.result);
    });
  });
});

document.getElementById('login').addEventListener('click', function() {
  chrome.runtime.sendMessage({ action: 'getAuthToken' }, function(response) {
    if (response.error) {
      console.error('Error getting auth token: ', response.error);
      return;
    }

    chrome.runtime.sendMessage({ action: 'getCalendars' }, function(response) {
      if (response.error) {
        console.error('Error fetching calendars: ', response.error);
        return;
      }
      console.log(response.calendars);
      const calendarSelect = document.getElementById('calendarSelect');
      response.calendars.forEach(calendar => {
        const option = document.createElement('option');
        option.value = calendar.id;
        option.text = calendar.summary;
        calendarSelect.appendChild(option);
      });
    });
  });
});

document.getElementById('retriveData').addEventListener('click', function() {
  console.log("button Clicked")
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'retriveData' }, function(response) {
      console.log(response.result);
    });
  });
})


// code for reserving availability

let checkboxContainer = document.getElementById('ageGroups');

const ageGroups = ['Wiek 6 lat', 'Wiek 7 lat', 'Wiek 8 lat', 'Wiek 9 lat', 'Wiek 10-12 lat']

ageGroups.forEach(element => {
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = `ageGroups-${element}`;
  checkbox.name = 'ageGroups';
  checkbox.value = element;

  const label = document.createElement('label');
  label.htmlFor = `ageGroups-${element}`;
  label.textContent = element;
  checkboxContainer.appendChild(checkbox);
  checkboxContainer.appendChild(label);
});

let checkboxContainer2 = document.getElementById('windows');

const timeWindows = [
  '09:00-10:00',
  '09:20-10:20',
  '09:40-10:40',
  '10:00-11:00',
  '10:20-11:20',
  '10:40-11:40',
  '11:00-12:00',
  '11:20-12:20',
  '11:40-12:40',
  '12:00-13:00',
  '12:20-13:20',
  '12:40-13:40',
  '13:00-14:00',
  '13:20-14:20',
  '13:40-14:40',
  '14:00-15:00',
  '14:20-15:20',
  '14:40-15:40',
  '15:00-16:00',
  '15:20-16:20',
  '15:40-16:40',
  '16:00-17:00',
  '16:20-17:20',
  '16:40-17:40',
  '17:00-18:00',
  '17:20-18:20',
  '17:40-18:40',
  '18:00-19:00',
  '18:20-19:20',
  '18:40-19:40',
  '19:00-20:00',
];

// Set the time gap index (minimum difference in time slots)
let timeGap = 2; // Adjust to require a minimum gap between time slots

const rangeInputvalue = document.querySelectorAll(".range-input input");
const timeInputvalue = document.querySelectorAll(".time-input input");
const rangevalue = document.querySelector(".slider-container .time-slider");

// Initialize the input fields
timeInputvalue[0].value = timeWindows[5];
timeInputvalue[1].value = timeWindows[timeWindows.length - 1];

// Adding event listeners to the range input elements
for (let i = 0; i < rangeInputvalue.length; i++) {
    rangeInputvalue[i].addEventListener("input", e => {
        let startIndex = parseInt(rangeInputvalue[0].value);
        let endIndex = parseInt(rangeInputvalue[1].value);

        // Validate and enforce minimum time gap
        if (endIndex - startIndex < timeGap) {
            if (e.target.className === "min-range") {
                rangeInputvalue[0].value = endIndex - timeGap;
                startIndex = endIndex - timeGap;
            } else {
                rangeInputvalue[1].value = startIndex + timeGap;
                endIndex = startIndex + timeGap;
            }
        }

        // Update the time inputs
        timeInputvalue[0].value = timeWindows[startIndex];
        timeInputvalue[1].value = timeWindows[endIndex];
        rangevalue.style.left = `${(startIndex / rangeInputvalue[0].max) * 100}%`;
        rangevalue.style.right = `${100 - (endIndex / rangeInputvalue[1].max) * 100}%`;
    });
}

// Initialize slider positions
rangeInputvalue[0].value = 0;
rangeInputvalue[1].value = timeWindows.length - 1;


// timeWindows.forEach(element => {
//   const checkbox = document.createElement('input');
//   checkbox.type = 'checkbox';
//   checkbox.id = `time-${element}`;
//   checkbox.name = 'time';
//   checkbox.value = element;

//   const label = document.createElement('label');
//   label.htmlFor = `time-${element}`;
//   label.textContent = element;
//   checkboxContainer2.appendChild(checkbox);
//   checkboxContainer2.appendChild(label);
// });




document.addEventListener('DOMContentLoaded', function () {
  const reserveButton = document.getElementById('reserveButton');
  reserveButton.addEventListener('click', async () => {
      const selectedDate = document.getElementById('datePicker').value;
      const selectedAgeGroups = getSelectedCheckboxes('ageGroups');
      // const selectedTimeWindows = getSelectedCheckboxes('time');

      const rangeInputs = document.querySelectorAll(".range-input input");

      const startIndex = parseInt(rangeInputs[0].value);
      const endIndex = parseInt(rangeInputs[1].value);

      const selectedTimeWindows = timeWindows.slice(startIndex, endIndex + 1);

      // Replace the example logic with your actual implementation
      console.log('Selected date:', selectedDate);
      console.log('Selected age groups:', selectedAgeGroups);
      console.log('Selected time windows:', selectedTimeWindows);

      const eventDetails = {
        date: selectedDate,
        ageGroups: selectedAgeGroups,
        timeWindows: selectedTimeWindows,
      };
      
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'reserveDates', eventDetails: eventDetails}, (response) => {
          console.log(response.result);
        });
      });
  });
});

function getSelectedCheckboxes(checkboxGroupName) {
  const checkboxes = document.querySelectorAll(`input[type="checkbox"][name^="${checkboxGroupName}"]:checked`);
  return Array.from(checkboxes).map(checkbox => checkbox.value);
}