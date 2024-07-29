// find rows of lessons where nobody is signed up and remove them from dom
function removeTableRows() {
  console.log("removeTableRows function called.");
  
  const tables = document.querySelectorAll('table');
  console.log("Found tables:", tables)

  tables.forEach((table) => {
    const rows = table.querySelectorAll('tr');
    console.log("Found rows in table:", rows);

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length > 0) {
        const lastCell = cells[cells.length - 1];
        console.log("Last cell content:", lastCell.textContent);

        if (lastCell.textContent.trim() === '0') {
          console.log("Removing row:", row);
          row.remove();
        }
      }
    });
  });
}

// Function to start observing DOM changes for the table
function observeTableChanges() {
  // Select the node to be observed
  const targetNode = document.querySelector('tbody');
  if (!targetNode) {
    console.error("Target node not found.");
    return;
  }

  const config = { childList: true, subtree: true };

  let isMutating = false;
  // Callback function to execute when mutations of table are observed
  const callback = function(mutationsList, observer) {
    if (isMutating) return;

    isMutating = true;
    observer.disconnect(); 
    console.log('A child node has been added or removed.');
    removeTableRows(); 

    isMutating = false;
    observer.observe(targetNode, config);
  };
  const observer = new MutationObserver(callback);

  observer.observe(targetNode, config);

  console.log("DOM observer started for table changes.");
}

// Function to observe DOM for the presence of the submit button and attach observer when found
function observeForSubmitButton() {
  const observer = new MutationObserver((mutationsList, observer) => {

    const submitButtons = document.getElementsByClassName("btn-submit");; 
    const submitButton = submitButtons[0];
    if (submitButton) {
      console.log("Submit button found.");
      console.log*(submitButton)
      // on click of submit button add observer to table. Have to do this this way becaouse before submit button is clicked the table is not rendered
      submitButton.addEventListener('click', () => {
        console.log("Submit button clicked.");
        observeTableChanges();  
      });

      observer.disconnect();
      console.log("Stopped observing for submit button.");
    }
  });

  // Start observing the document body for child list changes
  observer.observe(document.body, { childList: true, subtree: true });
  console.log("Started observing for submit button.");
}

// Start observing for the submit button when the content script is loaded
observeForSubmitButton();

async function reserveDates(eventDetails) {
  console.log("reserveDates function called.");
  console.log("Event details:", eventDetails);
  const startDate = eventDetails.date + "T00%3A00%3A00.000Z";
  const ageGroups = eventDetails.ageGroups;
  const timeWindows = eventDetails.timeWindows; 
  //url for getting lessons for selected day, also pageSize is 500 so it for sure load all lessons, Type is for demonstration lessons, query for programming lessons excludes math and graphics, 
  const response = await fetch(`https://crm.giganciprogramowania.edu.pl/api/TimetableTeacher?pageSize=500&courseType=DemonstrationLesson1On1Online&startDate=${startDate}&semester=Lato2024&query=programowania`)
  const data = await response.json();
  console.log(data.results);
  const lessons = [];
  console.log(ageGroups, timeWindows, startDate +"T00:00:00")
  //filter letrived lessons to get only those that match selected age group, time window and date
  for(const lesson of data.results) {
    const lessonDate = lesson.startCourse;
    const lessonTime = lesson.courseHours;
    const courseLevel = lesson.courseLevel;
    if(ageGroups.includes(courseLevel) && timeWindows.includes(lessonTime) && lessonDate === (eventDetails.date+"T00:00:00")) {
      lessons.push(lesson.timetableIds[0]);
    }else {
      console.log("not matching");
    }
  }
  console.log(lessons);
  requestBody = {TImetableIds: lessons};
  //request for reserving all lessons that match selected criteria
  const response2 = await fetch('https://crm.giganciprogramowania.edu.pl/api/TimetableTeacher/AddTimetableTeacher', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  console.log(response2);
}



// Listen for messages from the popup (if you still want to use the popup functionality)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("message retrived")
  if (request.action === 'removeRows') {
    console.log("Message received: removeRows");
    removeTableRows();
    sendResponse({result: 'Rows removed'});
  }

  if(request.action === 'reserveDates') {
    console.log("Message received: reserveDates");
    reserveDates(request.eventDetails);
    sendResponse({result: 'Dates reserved'});
  }
});
