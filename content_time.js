
// Function to start observing DOM changes for the table
function observeContentChange() {
  // Select the node to be observed
  const targetNode = document.getElementsByClassName('main-content')[0];
  if (!targetNode) {
    console.error("Target node not found.");
    return;
  }

  const config = { childList: true, subtree: false };

  let isMutating = false;

  const callback = function(mutationsList, observer) {
    if (isMutating) return;
    isMutating = true;
    observer.disconnect(); 
    console.log('A child node has been added or removed.');
    addButtons();
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

    // const submitButtons = document.getElementsByClassName("mat-focus-indicator mat-raised-button mat-button-base");
    const submitButtons = document.querySelectorAll('button.mat-focus-indicator.mat-raised-button.mat-button-base:not(.navbar-toggler)')
    console.log(submitButtons)
    const submitButton = submitButtons[0];
    if (submitButton) {
      console.log("Submit button found.");
      console.log(submitButton)

      submitButton.addEventListener('click', () => {
        console.log("Submit button clicked.");
        observeContentChange();  
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

function addButtons() {
  let elements = getWorkDates();
  elements.forEach(element => {
    if (doesElementHaveButton(element)) {
      return;
    }
    const data = extractEventDetails(element);
    const button = document.createElement('button');
    button.textContent = 'Add to Calendar';
    button.classList.add('mat-focus-indicator', 'mat-raised-button', 'mat-button-base');
    button.addEventListener('click', () => {
      console.log("Button clicked", data);
      chrome.runtime.sendMessage({ action: 'addToCalendar', eventDetails: data }, function(response) {
        console.log(response);
      });
    })
    element.appendChild(button);
  })
}

function getWorkDates() {
  const elements = document.querySelectorAll('.main-content > div.ng-star-inserted:not(.groups-number)')
  return elements;
}

function doesElementHaveButton(element) {
  const buttons = element.querySelectorAll('button.mat-focus-indicator.mat-raised-button.mat-button-base'); // TODO: CHANGE SELECT
  return buttons.length > 0;
}

function retriveData() {
  let elements = getWorkDates();
  const results = [];
  elements.forEach(row => {
    let result = extractEventDetails(row)
    results.push(result)
  })
  return results;
}

function extractEventDetails(row) {
  dateElement = row.querySelector('p.d-flex.align-items-center > b');
  let date = dateElement.textContent.trim();
  timeElement = row.querySelector('mat-chip > b');
  let time = timeElement.textContent.trim();
  matChip = row.querySelector('mat-chip');
  titleElement = document.querySelector(`#${matChip.getAttribute('aria-describedby') }`)
  let titleElementText = titleElement.textContent.trim();
  const elements = titleElementText.split("||");
  const id = elements[0];
  const title = elements[1];
  // console.log("Date", date);
  // console.log("Time", time);
  // console.log("Title", title);
  // console.log("ID", id);
  return {
    date,
    time,
    title,
    id,
  }
}
