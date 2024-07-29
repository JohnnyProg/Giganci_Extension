

// changing number of items per page to 200
chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1],
    addRules: [
      {
        id: 1,
        priority: 1,
        action: {
          type: "redirect",
          redirect: {
            transform: {
              queryTransform: {
                addOrReplaceParams: [{key: "pageSize", value: "200"}]
              }
            }      
          },
        },
        condition: {
          urlFilter: "https://crm.giganciprogramowania.edu.pl/api/TimetableTeacher*",
          resourceTypes: ["xmlhttprequest"],
        },
      },
    ],
  });
});


chrome.webNavigation.onHistoryStateUpdated.addListener(details => {
  tabId = details.tabId;
  currentUrl = details.url;
  console.log("URL", currentUrl);
  if (currentUrl.includes('RezerwacjaTerminow')) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
  } else if (currentUrl.includes('KalendarzZajec')) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content_time.js']
    });
  
  }
})

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log()
  if (message.action === 'getAuthToken') {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        sendResponse({ error: chrome.runtime.lastError });
        return;
      }
      sendResponse({ token: token });
    });
    return true;
  } else if (message.action === 'getCalendars') {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        sendResponse({ error: chrome.runtime.lastError });
        return;
      }

      fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      }).then(response => response.json()).then(data => {
        sendResponse({ calendars: data.items });
      }).catch(error => {
        console.error('Error fetching calendars: ', error);
        sendResponse({ error: error });
      });
    });
    return true;
  } else if (message.action === 'addToCalendar') {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        sendResponse({ error: chrome.runtime.lastError });
        return;
      }
      calendars = [];
      fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      }).then(response => response.json()).then(data => {
        const eventDetails = message.eventDetails;
        console.log(data)
        const calendarId = data.items[0].id;
        const [day, month, year] = eventDetails.date.split('/')
        const formattedDateString = `${year}-${month}-${day}`;
        const startDate = new Date(formattedDateString + "T" + eventDetails.time.split("-")[0] + ":00");
        const endDate = new Date(formattedDateString + "T" + eventDetails.time.split("-")[1] + ":00");
        console.log(startDate, endDate)
        console.log(startDate.toISOString(), endDate.toISOString())
        const event = {
          summary: eventDetails.title + ' - ' + eventDetails.id,
          start: {
            dateTime: startDate.toISOString(),
            timeZone: 'Poland' // Replace with your desired time zone
          },
          end: {
            dateTime: endDate.toISOString(),
            timeZone: 'Poland' // Replace with your desired time zone
          }
        };
        console.log("calendarId", calendarId)
        console.log("event", event)
        fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        }).then(response => response.json()).then(data => {
          sendResponse({ event: data });
        }).catch(error => {
          console.error('Error creating event: ', error);
          sendResponse({ error: error });
        });
      }).catch(error => {
        console.error('Error fetching calendars: ', error);
        sendResponse({ error: error });
      });
    });
    return true;
  }
});
