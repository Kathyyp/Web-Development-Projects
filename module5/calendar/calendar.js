//initialization
var month_names = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
var date = new Date();
var todaydate = date.getDate();
var todaymonth = date.getMonth();
var todayyear = date.getFullYear();

var currentMonth = new Month(todayyear, todaymonth);
let current_id = 0;

fetch("loggedin.php", {
  method: "POST",
  body: JSON.stringify(),
  headers: { "content-type": "application/json" },
})
  .then((response) => response.json())
  .then((data) => loggedin(data))
  .catch((error) => console.error("Error:", error));

// btn to change the month
document.getElementById("next_month_btn").addEventListener(
  "click",
  function (event) {
    currentMonth = currentMonth.nextMonth();
    updateCalendar();
  },
  false
);

document.getElementById("prev_month_btn").addEventListener(
  "click",
  function (event) {
    currentMonth = currentMonth.prevMonth();
    updateCalendar();
  },
  false
);

// document.getElementById("month-selector").addEventListener(
//   "change",
//   function (event) {
//     let vals = document.getElementById("month-selector").value.split("-");
//     currentMonth = new Month(Number(vals[0]), Number(vals[1]) - 1);
//     updateCalendar();
//   },
//   false
// );

//check status
function loggedin(data) {
  var logged_in = false;

  if (data.success) {
    logged_in = true;
    document
      .getElementsByClassName("login_page")[0]
      .setAttribute("hidden", "true");
    document.getElementsByClassName("container")[0].removeAttribute("hidden");
    document.getElementsByClassName("add_event")[0].removeAttribute("hidden");
    document.getElementsByClassName("topmenu")[0].removeAttribute("hidden");
    updateCalendar();
  } else if (!data.success) {
    document.getElementsByClassName("login_page")[0].removeAttribute("hidden");
    document
      .getElementsByClassName("add_event")[0]
      .setAttribute("hidden", "true");
    document
      .getElementsByClassName("container")[0]
      .setAttribute("hidden", "true");
    document
      .getElementsByClassName("topmenu")[0]
      .setAttribute("hidden", "true");
  }
}

function updateCalendar() {
  get_all_events(currentMonth.month + 1, currentMonth.year);
}

//load in events to board
function finishUpdatingCalendar(event_array) {
  let weeks = currentMonth.getWeeks();
  $("#current-month").empty();
  $("#current-month").append(currentMonth.month_name[currentMonth.month] + " ");
  $("#current-month").append(currentMonth.year);
  let days = document.getElementsByClassName("calendar_day");

  let starting_day = currentMonth.getDateObject(1).getDay();

  let day = 1;
  let box = 0;

  $(".calendar_day").empty();
  $(".calendar_day").each(function () {
    if (day <= currentMonth.days_in_month && box >= starting_day) {
      $(this).append(day);

      for (i = 0; i < event_array.length; i++) {
        if (event_array[i].day == day) {
          let minute = event_array[i].minute;
          if (minute < 10) {
            minute = 0 + "" + minute;
          }
          category_colors = {
            work: "red",
            life: "blue",
            other: "grey",
          };
          $(this).append("<br>");
          $(this).append(
            '<button style="font-size: small; color: ' +
              category_colors[event_array[i].category] +
              '" class="btn btn-outline-secondary btn-sm' +
              event_array[i].category +
              '" \
						id="' +
              event_array[i].id +
              '"' +
              ' \
              data-toggle="collapse" \
              data-target="#collapseExample" \
              aria-expanded="false" \
              aria-controls="collapseExample">' +
              event_array[i].name +
              "</button>" +
              '<div class="collapse" id="collapseExample">' +
              '<div class="card card-body">' +
              "Event at: " +
              event_array[i].hour +
              ":" +
              minute +
              "</div></div>"
          );
          $(".collapse").collapse();

          let html_obj = document.getElementById(event_array[i].id);
          let name = event_array[i].name;
          let category = event_array[i].category;
          let year = currentMonth.year;
          let month = currentMonth.month + 1;
          let day = event_array[i].day;
          let hour = event_array[i].hour;
          if (hour < 10) {
            hour = "0" + hour;
          }

          if (month < 10) {
            month = "0" + month;
          }

          if (day < 10) {
            day = "0" + day;
          }

          if (year < 1000) {
            year = "0" + year;
          } else if (year < 100) {
            year = "00" + year;
          }

          document.getElementById(event_array[i].id).addEventListener(
            "focus",
            function (event) {
              current_id = html_obj.id;
              $("#event_title").val(name);
              console.log("event click");
              $("#event_date").val(
                year + "-" + month + "-" + day + "T" + hour + ":" + minute
              );

              //handle delete
              document.getElementById("delete").addEventListener(
                "click",
                function (event) {
                  const data = {
                    event_id: current_id,
                    token: localStorage.getItem("csrf_token"),
                  };

                  fetch("delete_event.php", {
                    method: "POST",
                    body: JSON.stringify(data),
                    headers: { "content-type": "application/json" },
                  })
                    .then((response) => response.json())
                    .then((data) => {
                      alert(
                        data.success
                          ? "Event has been deleted!"
                          : `Error: event has not been deleted.`
                      );
                      updateCalendar();
                    })
                    .catch((error) => console.error("Error:", error));
                },
                false
              );

              //edit event
              document.getElementById("edit").addEventListener(
                "click",
                function (event) {
                  // Get input from the form
                  const event_title =
                    document.getElementById("event_title").value;
                  let date_time = document.getElementById("event_date").value;
                  let category = $("input[name='category']:checked").val();
                  let share_event = $(
                    "input[name='share_event']:checked"
                  ).val();
                  let adding_event = new new_event(
                    event_title,
                    date_time,
                    category,
                    share_event
                  );

                  const data = {
                    event_id: current_id,
                    new_title: event_title,
                    new_year: adding_event.year,
                    new_month: adding_event.month,
                    new_day: adding_event.day,
                    new_hour: adding_event.hour,
                    new_minute: adding_event.minute,
                    new_category: category,
                    new_share: share_event,
                    token: localStorage.getItem("csrf_token"),
                  };

                  fetch("edit_event.php", {
                    method: "POST",
                    body: JSON.stringify(data),
                    headers: { "content-type": "application/json" },
                  })
                    .then((response) => response.json())
                    .then((data) => {
                      alert(
                        data.success
                          ? "Event has been edited! (this might pop out several times)"
                          : "Error: event has not been edited."
                      );
                      updateCalendar();
                    })
                    .catch((error) => console.error("Error:", error));
                },
                false
              );
            },
            false
          );
        }
      }
      day++;
    } else {
    }
    box++;
  });
}

function clearBoard() {
  console.log("empty board");
  $(".calendar_day").empty();
  $("#current-month").empty();
  $(this).empty();
}

function get_all_events(month, year) {
  const data = {
    year: year,
    month: month,
    token: localStorage.getItem("csrf_token"),
  };

  fetch("get_events.php", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "content-type": "application/json" },
  })
    .then((response) => response.json())
    .then((data) => {
      let event_array = make_event_array(data);
      finishUpdatingCalendar(event_array);
    })
    .catch((error) => console.error("Error:", error));
}

function new_event(name, date_time, category, share_event) {
  this.name = name;
  this.date_time = date_time;
  let split1 = this.date_time.split("-");
  let split2 = split1[2].split("T");
  let split3 = split2[1].split(":");

  this.year = Number(split1[0]);
  this.month = Number(split1[1]);
  this.day = Number(split2[0]);
  this.hour = Number(split3[0]);
  this.minute = Number(split3[1]);
  this.category = category;
  this.share_event = share_event;
}

function event1(id, name, day, hour, minute, category, share_event) {
  this.name = name;
  this.id = id;
  this.hour = hour;
  this.day = day;
  this.minute = minute;
  this.category = category;
  this.share_event = share_event;
}

function make_event_array(data) {
  let events = [];

  if (data.success == true) {
    let ids = data.ids;
    let names = data.names;
    let days = data.days;
    let hours = data.hours;
    let minutes = data.minutes;
    let categories = data.categories;

    for (i = 0; i < names.length; i++) {
      let new_event = new event1(
        ids[i],
        names[i],
        days[i],
        hours[i],
        minutes[i],
        categories[i]
      );
      events.push(new_event);
    }
  }
  return events;
}

function add_event(event) {
  // Get input from form
  const event_title = document.getElementById("event_title").value;
  let date_time = document.getElementById("event_date").value;
  let category = $("input[name='category']:checked").val();
  let share_event = $("input[name='share_event']:checked").val();
  let adding_event = new new_event(
    event_title,
    date_time,
    category,
    share_event
  );
  const data = {
    event_title: event_title,
    year: adding_event.year,
    month: adding_event.month,
    day: adding_event.day,
    hour: adding_event.hour,
    minute: adding_event.minute,
    category: category,
    share_event: share_event,
  };

  fetch("add_event.php", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "content-type": "application/json" },
  })
    .then((response) => response.json())
    .then((data) =>
      alert(
        data.success
          ? "Event has been added!"
          : `Error: event has not been added (guest need to login/register).`
      )
    )
    .catch((error) => console.error("Error:", error));
  updateCalendar();
}
document.getElementById("add").addEventListener("click", add_event, false);

//Login part
document.getElementById("login").addEventListener("click", loginAjax, false); // Bind the AJAX call to button click

fetch("csrf.php", {
  method: "POST",
  body: JSON.stringify(),
  headers: { "content-type": "application/json" },
})
  .then((response) => response.json())
  .then((data) => {
    localStorage.setItem("csrf_token", data.token);
  })
  .catch((error) => console.error("Error:", error));
function loginAjax(event) {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  console.log("username: " + username);

  // Make a URL-encoded string for passing POST data:
  const data = { username: username, password: password };

  fetch("login.php", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "content-type": "application/json" },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        localStorage.setItem("csrf_token", data.token);
        // alert("data.success");
      }
      if (!data.success) {
        alert(data.message);
      }
    })
    .catch((error) => console.error("Error:", error));

  fetch("loggedin.php", {
    method: "POST",
    body: JSON.stringify(),
    headers: { "content-type": "application/json" },
  })
    .then((response) => response.json())
    .then((data) => loggedin(data))
    .catch((error) => console.error("Error:", error));
}

//guest login
document.getElementById("guest").addEventListener("click", guest_login, false);

function guest_login(event) {
  const username = "guest";
  const data = { username: username };

  fetch("guest_login.php", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "content-type": "application/json" },
  })
    .then((response) => response.json())
    .then((data) => {
      localStorage.setItem("csrf_token", data.token);
      loggedin(data);
    })
    .catch((error) => console.error("Error:", error));
}

//Register
document
  .getElementById("register")
  .addEventListener("click", registerAjax, false);

function registerAjax(event) {
  const new_username = document.getElementById("new_username").value;
  const new_password = document.getElementById("new_password").value;

  // Make a URL-encoded string for passing POST data:
  const data = {
    new_username: new_username,
    new_password: new_password,
  };

  fetch("signup.php", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "content-type": "application/json" },
  })
    .then((response) => response.json())
    .then((data) =>
      alert(data.success ? "You've been registered!" : `Error: ${data.message}`)
    )
    .catch((error) => console.error("Error:", error));
}

//logout
document.getElementById("logout").addEventListener("click", logoutAjax, false);

function logoutAjax(event) {
  fetch("logout.php", {
    method: "POST",
    body: JSON.stringify(),
    headers: { "content-type": "application/json" },
  })
    .then((response) => response.json())
    .then((data) => {
      localStorage.removeItem("csrf_token");
    })
    .catch((error) => console.error("Error:", error));

  fetch("loggedin.php", {
    method: "POST",
    body: JSON.stringify(),
    headers: { "content-type": "application/json" },
  })
    .then((response) => response.json())
    .then((data) => {
      loggedin(data);
      if (!data.success) {
        clearBoard();
      }
    })
    .catch((error) => console.error("Error:", error));
}

/* * * * * * * * * * * * * * * * * * * *\
 *               Module 4              *
 *      Calendar Helper Functions      *
 *                                     *
 *        by Shane Carr '15 (TA)       *
 *  Washington University in St. Louis *
 *    Department of Computer Science   *
 *               CSE 330S              *
 *                                     *
 *      Last Update: October 2017      *
\* * * * * * * * * * * * * * * * * * * */

/*  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function () {
  "use strict";

  /* Date.prototype.deltaDays(n)
   *
   * Returns a Date object n days in the future.
   */
  Date.prototype.deltaDays = function (n) {
    // relies on the Date object to automatically wrap between months for us
    return new Date(this.getFullYear(), this.getMonth(), this.getDate() + n);
  };

  /* Date.prototype.getSunday()
   *
   * Returns the Sunday nearest in the past to this date (inclusive)
   */
  Date.prototype.getSunday = function () {
    return this.deltaDays(-1 * this.getDay());
  };
})();

/** Week
 *
 * Represents a week.
 *
 * Functions (Methods):
 *	.nextWeek() returns a Week object sequentially in the future
 *	.prevWeek() returns a Week object sequentially in the past
 *	.contains(date) returns true if this week's sunday is the same
 *		as date's sunday; false otherwise
 *	.getDates() returns an Array containing 7 Date objects, each representing
 *		one of the seven days in this month
 */
function Week(initial_d) {
  "use strict";

  this.sunday = initial_d.getSunday();

  this.nextWeek = function () {
    return new Week(this.sunday.deltaDays(7));
  };

  this.prevWeek = function () {
    return new Week(this.sunday.deltaDays(-7));
  };

  this.contains = function (d) {
    return this.sunday.valueOf() === d.getSunday().valueOf();
  };

  this.getDates = function () {
    let dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(this.sunday.deltaDays(i));
    }
    return dates;
  };
}

/** Month
 *
 * Represents a month.
 *
 * Properties:
 *	.year == the year associated with the month
 *	.month == the month number (January = 0)
 *
 * Functions (Methods):
 *	.nextMonth() returns a Month object sequentially in the future
 *	.prevMonth() returns a Month object sequentially in the past
 *	.getDateObject(d) returns a Date object representing the date
 *		d in the month
 *	.getWeeks() returns an Array containing all weeks spanned by the
 *		month; the weeks are represented as Week objects
 */
function Month(year, month) {
  "use strict";

  this.year = year;
  this.month = month;
  this.month_name = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  this.is_leap_year = year % 4 || (year % 100 === 0 && year % 400) ? 0 : 1;
  this.days_in_month =
    month + 1 === 2 ? 28 + this.is_leap_year : 31 - ((month % 7) % 2);

  this.nextMonth = function () {
    return new Month(year + Math.floor((month + 1) / 12), (month + 1) % 12);
  };

  this.prevMonth = function () {
    return new Month(year + Math.floor((month - 1) / 12), (month + 11) % 12);
  };

  this.getDateObject = function (d) {
    return new Date(this.year, this.month, d);
  };

  this.getWeeks = function () {
    let firstDay = this.getDateObject(1);
    let lastDay = this.nextMonth().getDateObject(0);

    let weeks = [];
    let currweek = new Week(firstDay);
    weeks.push(currweek);
    while (!currweek.contains(lastDay)) {
      currweek = currweek.nextWeek();
      weeks.push(currweek);
    }
    return weeks;
  };
}
